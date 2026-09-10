<?php

namespace App\Services\LeadOs;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\DealHealthSnapshot;
use App\Models\GraphRun;
use App\Models\Stage;
use App\Models\Workspace;
use App\Services\Ai\LlmClient;
use App\Services\Crm\DealBoardForecast;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * HubSpot Deal Insights job, Evo-native: formula score + band.
 * Ask Evo may write the reason. It never sets the number.
 */
class DealHealthScorer
{
    public function __construct(private LlmClient $llm) {}

    /**
     * @return array{score: int, band: string, label: string, reason: string, factors: list<array{key: string, label: string, detail: string}>}
     */
    public function score(Deal $deal, ?int $pipelineMedianCents = null): array
    {
        $deal->loadMissing(['stage', 'pipeline']);

        $stageAgeDays = $this->stageAgeDays($deal);
        $inactiveDays = $this->inactiveDays($deal);
        $median = $pipelineMedianCents ?? $this->pipelineMedianCents($deal);
        $openTasks = $this->openTaskCount($deal);

        $stagePenalty = match (true) {
            $stageAgeDays === null => 8,
            $stageAgeDays >= 30 => 35,
            $stageAgeDays >= 14 => 20,
            $stageAgeDays >= 7 => 10,
            default => 0,
        };
        $inactivePenalty = match (true) {
            $inactiveDays === null => 25,
            $inactiveDays >= 21 => 40,
            $inactiveDays >= 14 => 28,
            $inactiveDays >= 7 => 16,
            default => 0,
        };
        $amountPenalty = $this->amountPenalty($deal, $median);
        $taskPenalty = $openTasks >= 3 ? 12 : ($openTasks === 0 && ($inactiveDays ?? 99) >= 7 ? 8 : 0);

        $score = max(0, min(100, 100 - $stagePenalty - $inactivePenalty - $amountPenalty - $taskPenalty));
        $band = $score >= 70
            ? DealHealthSnapshot::BAND_HEALTHY
            : ($score >= 40 ? DealHealthSnapshot::BAND_AT_RISK : DealHealthSnapshot::BAND_STALLED);
        $label = match ($band) {
            DealHealthSnapshot::BAND_HEALTHY => 'Healthy',
            DealHealthSnapshot::BAND_AT_RISK => 'At risk',
            default => 'Stalled',
        };

        $factors = [
            ['key' => 'stage_age', 'label' => 'Stage age', 'detail' => $this->stageAgeDetail($deal, $stageAgeDays)],
            ['key' => 'inactivity', 'label' => 'Inactivity', 'detail' => $this->inactivityDetail($inactiveDays)],
            ['key' => 'amount', 'label' => 'Amount vs pipeline', 'detail' => $this->amountDetail($deal, $median)],
            ['key' => 'tasks', 'label' => 'Open tasks', 'detail' => $openTasks === 1 ? '1 open task' : $openTasks.' open tasks'],
        ];

        return [
            'score' => $score,
            'band' => $band,
            'label' => $label,
            'reason' => $this->formulaReason($factors),
            'factors' => $factors,
        ];
    }

    /**
     * @param  array{score: int, band: string, label: string, reason: string, factors: list<array{key: string, label: string, detail: string}>}  $computed
     * @return array{score: int, band: string, label: string, reason: string, factors: list<array{key: string, label: string, detail: string}>}
     */
    public function withAskEvoReason(array $computed, Deal $deal): array
    {
        if (! $this->llm->available()) {
            return $computed;
        }

        $facts = collect($computed['factors'])
            ->map(fn (array $factor) => $factor['label'].': '.$factor['detail'])
            ->implode('; ');

        $live = $this->llm->complete(
            'You are Evo, Evotechly\'s CRM assistant. Write one short sentence explaining why this deal health band is what it is. Use only the supplied factors. Never invent emails, contacts, or a new score. Never mention HubSpot or Breeze.',
            'Deal '.$deal->title.' scored '.$computed['score'].' ('.$computed['label'].'). Factors: '.$facts,
        );

        $reason = trim((string) ($live['text'] ?? ''));

        if ($reason !== '') {
            $computed['reason'] = $reason;
        }

        return $computed;
    }

    public function persist(Workspace $workspace, Deal $deal, array $computed, ?GraphRun $run = null): DealHealthSnapshot
    {
        return DealHealthSnapshot::query()->create([
            'workspace_id' => $workspace->id,
            'deal_id' => $deal->id,
            'graph_run_id' => $run?->id,
            'score' => $computed['score'],
            'band' => $computed['band'],
            'label' => $computed['label'],
            'reason' => $computed['reason'],
            'factors' => $computed['factors'],
        ]);
    }

    /**
     * Formula snapshot now — not the nightly graph. Ask Evo still writes reasons on the 02:15 run.
     */
    public function refreshLive(Deal $deal): ?DealHealthSnapshot
    {
        $deal->loadMissing(['stage', 'pipeline', 'workspace']);

        if ($deal->stage?->isTerminal()) {
            return null;
        }

        $workspace = $deal->workspace ?? Workspace::query()->find($deal->workspace_id);

        if (! $workspace instanceof Workspace) {
            return null;
        }

        return $this->persist($workspace, $deal, $this->score($deal));
    }

    public function refreshOpenDealsForContact(Workspace $workspace, Contact $contact): void
    {
        $deals = Deal::query()
            ->forWorkspace($workspace)
            ->where('contact_id', $contact->id)
            ->with(['stage', 'pipeline', 'workspace'])
            ->whereHas('stage', fn ($query) => $query->where('is_won', false)->where('is_lost', false))
            ->get();

        foreach ($deals as $deal) {
            if (! $deal instanceof Deal) {
                continue;
            }

            $deal->forceFill(['last_activity_at' => now()])->save();
            $this->refreshLive($deal);
        }
    }

    public function latestFor(Deal $deal): ?DealHealthSnapshot
    {
        return DealHealthSnapshot::query()
            ->where('deal_id', $deal->id)
            ->latest('id')
            ->first();
    }

    /**
     * @return Collection<int, Deal>
     */
    public function openDeals(Workspace $workspace): Collection
    {
        return Deal::query()
            ->forWorkspace($workspace)
            ->with(['stage', 'pipeline', 'contact'])
            ->whereHas('stage', fn ($query) => $query->where('is_won', false)->where('is_lost', false))
            ->orderBy('id')
            ->get();
    }

    public function pipelineMedianCents(Deal $deal): ?int
    {
        $amounts = Deal::query()
            ->where('workspace_id', $deal->workspace_id)
            ->where('pipeline_id', $deal->pipeline_id)
            ->where('amount_cents', '>', 0)
            ->whereHas('stage', fn ($query) => $query->where('is_won', false)->where('is_lost', false))
            ->pluck('amount_cents')
            ->map(fn ($cents) => (int) $cents)
            ->sort()
            ->values();

        if ($amounts->isEmpty()) {
            return null;
        }

        $mid = (int) floor(($amounts->count() - 1) / 2);

        if ($amounts->count() % 2 === 1) {
            return $amounts[$mid];
        }

        return (int) round(($amounts[$mid] + $amounts[$mid + 1]) / 2);
    }

    protected function stageAgeDays(Deal $deal): ?int
    {
        $changed = Activity::query()
            ->where('deal_id', $deal->id)
            ->where('type', 'stage_change')
            ->latest('id')
            ->value('created_at');

        $stamp = $changed instanceof CarbonInterface
            ? $changed
            : ($deal->created_at instanceof CarbonInterface ? $deal->created_at : null);

        return $this->daysSince($stamp);
    }

    protected function inactiveDays(Deal $deal): ?int
    {
        return $this->daysSince($deal->last_activity_at instanceof CarbonInterface ? $deal->last_activity_at : null);
    }

    protected function openTaskCount(Deal $deal): int
    {
        return Activity::query()
            ->where('deal_id', $deal->id)
            ->where('type', 'task')
            ->where('done', false)
            ->count();
    }

    protected function amountPenalty(Deal $deal, ?int $median): int
    {
        $amount = (int) $deal->amount_cents;

        if ($amount <= 0) {
            return 15;
        }

        if ($median === null || $median <= 0) {
            return 0;
        }

        if ($amount < (int) round($median * 0.5)) {
            return 12;
        }

        return 0;
    }

    protected function stageAgeDetail(Deal $deal, ?int $days): string
    {
        $stage = $deal->stage instanceof Stage ? $deal->stage : null;
        $name = $stage?->name ?? 'stage';
        $probability = $stage ? DealBoardForecast::probabilityFor($stage) : 20;

        if ($days === null) {
            return $name.' at '.$probability.'% · age unknown';
        }

        return $name.' at '.$probability.'% · '.$days.'d in stage';
    }

    protected function inactivityDetail(?int $days): string
    {
        if ($days === null) {
            return 'no activity yet';
        }

        return $days === 0 ? 'active today' : 'last activity '.$days.' days ago';
    }

    protected function amountDetail(Deal $deal, ?int $median): string
    {
        $amount = (int) $deal->amount_cents;

        if ($amount <= 0) {
            return 'amount missing';
        }

        $formatted = number_format($amount / 100, 0, ',', ' ').' DZD';

        if ($median === null || $median <= 0) {
            return $formatted.' · no pipeline median yet';
        }

        $medianLabel = number_format($median / 100, 0, ',', ' ').' DZD median';

        if ($amount < (int) round($median * 0.5)) {
            return $formatted.' · below '.$medianLabel;
        }

        return $formatted.' · vs '.$medianLabel;
    }

    /**
     * @param  list<array{key: string, label: string, detail: string}>  $factors
     */
    protected function formulaReason(array $factors): string
    {
        return collect($factors)->pluck('detail')->implode(' · ').'.';
    }

    protected function daysSince(?CarbonInterface $stamp): ?int
    {
        if (! $stamp instanceof CarbonInterface) {
            return null;
        }

        return (int) $stamp->diffInDays(now());
    }
}
