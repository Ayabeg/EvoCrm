<?php

namespace App\Services\Crm;

use App\Models\Lead;
use App\Models\LeadScore;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class LeadScorer
{
    public function __construct(
        private LeadScoreFormula $formula,
        private LeadConverter $converter,
        private WorkflowRunner $workflows,
    ) {}

    /**
     * @return array{
     *     score: int,
     *     fit: int,
     *     intent: int,
     *     timing: int,
     *     reason: string,
     *     breakdown: list<array{pillar: string, key: string, label: string, points: int}>,
     *     changed: bool,
     *     action: string|null
     * }
     */
    public function score(Lead $lead, ?User $actor = null): array
    {
        $lead->loadMissing(['workspace', 'contact', 'company', 'deal']);
        $computed = $this->formula->compute($lead);
        $previous = (int) $lead->score;
        $hadScore = $lead->latestScore()->exists();
        $changed = ! $hadScore || $previous !== $computed['score'];

        $action = DB::transaction(function () use ($lead, $computed, $changed, $actor): ?string {
            $lead->forceFill(['score' => $computed['score']])->save();

            if ($changed) {
                LeadScore::query()->create([
                    'workspace_id' => $lead->workspace_id,
                    'lead_id' => $lead->id,
                    'score' => $computed['score'],
                    'fit' => $computed['fit'],
                    'intent' => $computed['intent'],
                    'timing' => $computed['timing'],
                    'reason' => $computed['reason'],
                    'breakdown' => $computed['breakdown'],
                ]);
            }

            return $this->applyThresholds($lead->fresh() ?? $lead, $computed['score'], $actor);
        });

        $lead->refresh()->load('latestScore');

        if ($changed) {
            $this->workflows->handleLeadScored($lead);
        }

        return [
            ...$computed,
            'changed' => $changed,
            'action' => $action,
        ];
    }

    /**
     * Ask Evo may rewrite the human reason only. The numeric score stays formula-owned.
     */
    public function writeReason(Lead $lead, string $reason): void
    {
        $reason = mb_substr(trim($reason), 0, 280);
        $latest = $lead->latestScore;

        if ($latest instanceof LeadScore) {
            $latest->forceFill(['reason' => $reason])->save();

            return;
        }

        LeadScore::query()->create([
            'workspace_id' => $lead->workspace_id,
            'lead_id' => $lead->id,
            'score' => (int) $lead->score,
            'fit' => 0,
            'intent' => 0,
            'timing' => 0,
            'reason' => $reason,
            'breakdown' => [],
        ]);
    }

    private function applyThresholds(Lead $lead, int $score, ?User $actor): ?string
    {
        if ($lead->status === 'disqualified') {
            return null;
        }

        $workspace = $lead->workspace ?? Workspace::query()->find($lead->workspace_id);

        if (! $workspace instanceof Workspace) {
            return null;
        }

        $thresholds = $workspace->leadScoreThresholds();

        if ($score >= $thresholds['convert'] && ! $lead->deal) {
            $user = $this->actor($lead, $actor);

            if ($user instanceof User) {
                $this->converter->convert($lead, $user);

                return 'convert';
            }

            $lead->qualify();

            return 'qualify';
        }

        if ($score >= $thresholds['qualify'] && $lead->status !== 'qualified') {
            $lead->qualify();

            return 'qualify';
        }

        if ($score >= $thresholds['hold'] && $lead->status === 'new') {
            $lead->forceFill(['status' => 'working'])->save();

            return 'hold';
        }

        return null;
    }

    private function actor(Lead $lead, ?User $actor): ?User
    {
        if ($actor instanceof User && (int) $actor->workspace_id === (int) $lead->workspace_id) {
            return $actor;
        }

        return User::query()
            ->where('workspace_id', $lead->workspace_id)
            ->whereIn('role', ['owner', 'admin'])
            ->orderBy('id')
            ->first();
    }
}
