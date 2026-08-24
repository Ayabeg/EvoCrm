<?php

namespace App\Services\Ai;

use App\Models\Activity;
use App\Models\AiInsight;
use App\Models\Contact;
use App\Models\Deal;
use App\Services\Crm\DealBoardForecast;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class RecordInsight
{
    public function __construct(private LlmClient $llm) {}

    /**
     * @return array{label: string, summary: string, question: string|null, answer: string|null, source: string, live: bool}
     */
    public function forContact(Contact $contact): array
    {
        $contact->loadMissing(['company', 'owner', 'deals.stage']);

        return $this->present('contact', $contact->id, $this->summarizeContact($contact));
    }

    /**
     * @return array{label: string, summary: string, question: string|null, answer: string|null, source: string, live: bool}
     */
    public function forDeal(Deal $deal): array
    {
        $deal->loadMissing(['stage', 'contact', 'company', 'owner']);

        return $this->present('deal', $deal->id, $this->summarizeDeal($deal));
    }

    /**
     * @return array{score: int, band: string, label: string, reason: string}
     */
    public function dealHealth(Deal $deal): array
    {
        $deal->loadMissing('stage');

        $probability = $deal->stage
            ? DealBoardForecast::probabilityFor($deal->stage)
            : (int) config('evosales.stage_probability_fallback', 20);
        $days = $this->daysSince($deal->last_activity_at);
        $hasAmount = (int) $deal->amount_cents > 0;

        $score = (int) round(
            ($probability * 0.55)
            + ($this->recencyScore($days) * 0.30)
            + (($hasAmount ? 100 : 0) * 0.15)
        );
        $score = max(0, min(100, $score));

        $band = $score >= 70 ? 'healthy' : ($score >= 40 ? 'watch' : 'risk');
        $label = $score >= 70 ? 'Healthy' : ($score >= 40 ? 'Watch' : 'At risk');

        $stageBit = $deal->stage
            ? $deal->stage->name.' at '.$probability.'%'
            : 'stage at '.$probability.'%';
        $activityBit = $days === null
            ? 'no activity yet'
            : ($days === 0 ? 'active today' : 'last activity '.$days.' days ago');
        $amountBit = $hasAmount ? 'amount set' : 'amount missing';

        return [
            'score' => $score,
            'band' => $band,
            'label' => $label,
            'reason' => $stageBit.' · '.$activityBit.' · '.$amountBit.'.',
        ];
    }

    /**
     * @return array{answer: string, source: string, summary: string}
     */
    public function ask(Contact|Deal $record, string $question): array
    {
        $question = trim($question);
        $kind = $record instanceof Deal ? 'deal' : 'contact';
        $summary = $record instanceof Deal
            ? $this->summarizeDeal($record->loadMissing(['stage', 'contact', 'company', 'owner']))
            : $this->summarizeContact($record->loadMissing(['company', 'owner', 'deals.stage']));
        $facts = $record instanceof Deal
            ? $this->dealFacts($record)
            : $this->contactFacts($record);
        $activities = $this->recentActivities($record);

        $stub = $this->stubAnswer($question, $facts, $summary, $activities);
        $live = $this->llm->complete($this->systemPrompt(), $this->userPrompt($kind, $facts, $activities, $question, $summary));

        $answer = $live['text'] ?? $stub;
        $source = $live['source'] ?? 'fields';

        AiInsight::query()->create([
            'workspace_id' => $record->workspace_id,
            'subject_type' => $kind,
            'subject_id' => $record->id,
            'question' => $question,
            'answer' => $answer,
            'source' => $source,
        ]);

        return [
            'answer' => $answer,
            'source' => $source,
            'summary' => $summary,
        ];
    }

    /**
     * @return array{label: string, summary: string, question: string|null, answer: string|null, source: string, live: bool}
     */
    protected function present(string $type, int $id, string $summary): array
    {
        $latest = AiInsight::query()
            ->where('subject_type', $type)
            ->where('subject_id', $id)
            ->latest('id')
            ->first();

        return [
            'label' => 'Ask Evo',
            'summary' => $summary,
            'question' => $latest?->question,
            'answer' => $latest?->answer,
            'source' => $latest?->source ?? 'fields',
            'live' => $this->llm->available(),
        ];
    }

    public function summarizeContact(Contact $contact): string
    {
        $facts = $this->contactFacts($contact);
        $name = $facts['Name'] ?? 'This contact';
        $bits = array_filter([
            $name,
            isset($facts['City']) ? $facts['City'] : null,
            isset($facts['Email']) ? 'email '.$facts['Email'] : 'no email',
            isset($facts['Phone']) ? 'phone '.$facts['Phone'] : 'no phone',
            isset($facts['Company']) ? 'company '.$facts['Company'] : null,
            isset($facts['Deals']) ? $facts['Deals'] : 'no deals',
        ]);

        $line = implode(' · ', $bits).'.';
        $activity = $this->activityLine($this->recentActivities($contact));

        return $activity === '' ? $line : $line.' '.$activity;
    }

    public function summarizeDeal(Deal $deal): string
    {
        $facts = $this->dealFacts($deal);
        $bits = array_filter([
            $facts['Title'] ?? 'This deal',
            isset($facts['Stage']) ? 'stage '.$facts['Stage'] : null,
            isset($facts['Amount']) ? 'amount '.$facts['Amount'] : 'amount missing',
            isset($facts['Contact']) ? 'contact '.$facts['Contact'] : null,
            isset($facts['Company']) ? 'company '.$facts['Company'] : null,
        ]);

        $line = implode(' · ', $bits).'.';
        $activity = $this->activityLine($this->recentActivities($deal));

        return $activity === '' ? $line : $line.' '.$activity;
    }

    /**
     * @return array<string, string>
     */
    protected function contactFacts(Contact $contact): array
    {
        $deals = $contact->deals
            ->map(function (Deal $deal): string {
                $stage = $deal->stage?->name;
                $amount = (int) $deal->amount_cents > 0
                    ? number_format(((int) $deal->amount_cents) / 100, 0, ',', ' ').' DZD'
                    : null;

                return trim($deal->title.($stage ? ' ('.$stage.')' : '').($amount ? ' '.$amount : ''));
            })
            ->filter()
            ->values();

        return array_filter([
            'Name' => $contact->displayName(),
            'Email' => $contact->email,
            'Phone' => $contact->phone_e164 ?? $contact->phone,
            'City' => $contact->city,
            'Wilaya' => $contact->wilaya,
            'Company' => $contact->company?->name,
            'Owner' => $contact->owner?->name,
            'Deals' => $deals->isEmpty() ? null : $deals->count().' deal'.($deals->count() === 1 ? '' : 's').' ('.$deals->implode(', ').')',
        ], fn ($value) => filled($value));
    }

    /**
     * @return array<string, string>
     */
    protected function dealFacts(Deal $deal): array
    {
        $amount = (int) $deal->amount_cents > 0
            ? number_format(((int) $deal->amount_cents) / 100, 0, ',', ' ').' DZD'
            : null;
        $probability = $deal->stage
            ? DealBoardForecast::probabilityFor($deal->stage).'%'
            : null;

        return array_filter([
            'Title' => $deal->title,
            'Stage' => $deal->stage?->name,
            'Probability' => $probability,
            'Amount' => $amount,
            'Contact' => $deal->contact?->displayName(),
            'Company' => $deal->company?->name ?? $deal->contact?->company?->name,
            'Owner' => $deal->owner?->name,
            'Next step' => $deal->next_step,
            'Close date' => $deal->close_date?->toDateString(),
        ], fn ($value) => filled($value));
    }

    /**
     * @return Collection<int, Activity>
     */
    protected function recentActivities(Contact|Deal $record): Collection
    {
        $query = Activity::query()->latest('id')->limit(8);

        if ($record instanceof Deal) {
            $query->where(function ($q) use ($record): void {
                $q->where('deal_id', $record->id);
                if ($record->contact_id) {
                    $q->orWhere(function ($inner) use ($record): void {
                        $inner->where('contact_id', $record->contact_id)->whereNull('deal_id');
                    });
                }
            });
        } else {
            $query->where('contact_id', $record->id);
        }

        return $query->get();
    }

    /**
     * @param  Collection<int, Activity>  $activities
     */
    protected function activityLine(Collection $activities): string
    {
        $latest = $activities->first();

        if (! $latest instanceof Activity) {
            return 'No recent activities on this record.';
        }

        $label = $latest->subject ?: ($latest->body ?: $latest->type);
        $when = $latest->created_at?->diffForHumans() ?? 'recently';

        return 'Last activity '.$when.': '.$latest->type.' — '.$label.'.';
    }

    /**
     * @param  array<string, string>  $facts
     * @param  Collection<int, Activity>  $activities
     */
    protected function stubAnswer(string $question, array $facts, string $summary, Collection $activities): string
    {
        $haystack = Str::lower($question);
        $hits = [];

        foreach ($facts as $label => $value) {
            $needles = array_unique(array_filter([
                Str::lower($label),
                ...$this->aliasesFor($label),
            ]));

            foreach ($needles as $needle) {
                if ($needle !== '' && str_contains($haystack, $needle)) {
                    $hits[] = $label.': '.$value;
                    break;
                }
            }
        }

        if (str_contains($haystack, 'activit') || str_contains($haystack, 'last touch') || str_contains($haystack, 'timeline')) {
            $line = $this->activityLine($activities);
            if ($line !== '') {
                $hits[] = $line;
            }
        }

        if ($hits === []) {
            return 'From this record — '.$summary;
        }

        return 'From this record — '.implode(' · ', array_unique($hits)).'.';
    }

    /**
     * @return list<string>
     */
    protected function aliasesFor(string $label): array
    {
        return match ($label) {
            'Name' => ['who', 'person', 'contact name'],
            'Email' => ['mail', 'e-mail'],
            'Phone' => ['mobile', 'tel'],
            'City' => ['town'],
            'Wilaya' => ['province', 'region'],
            'Company' => ['account', 'organisation', 'organization'],
            'Owner' => ['assignee', 'assigned'],
            'Deals' => ['pipeline', 'opportunity'],
            'Title' => ['deal name', 'name'],
            'Stage' => ['status', 'step'],
            'Probability' => ['win', 'forecast', 'chance'],
            'Amount' => ['value', 'dzd', 'money', 'price'],
            'Contact' => ['person', 'who'],
            'Next step' => ['next', 'follow'],
            'Close date' => ['close', 'deadline'],
            default => [],
        };
    }

    /**
     * @param  array<string, string>  $facts
     * @param  Collection<int, Activity>  $activities
     */
    protected function userPrompt(string $kind, array $facts, Collection $activities, string $question, string $summary): string
    {
        $factLines = collect($facts)
            ->map(fn (string $value, string $label) => $label.': '.$value)
            ->implode("\n");

        $activityLines = $activities
            ->map(function (Activity $activity): string {
                $label = $activity->subject ?: ($activity->body ?: $activity->type);

                return ($activity->created_at?->toDateTimeString() ?? '').' '.$activity->type.' '.$label;
            })
            ->implode("\n");

        return "Record type: {$kind}\nFacts:\n{$factLines}\n\nRecent activities:\n".($activityLines !== '' ? $activityLines : 'none')."\n\nField summary: {$summary}\n\nQuestion: {$question}";
    }

    protected function systemPrompt(): string
    {
        return 'You are Evo, Evotechly\'s record assistant on EvoSales. Answer only from the supplied record fields and recent activities. Never invent facts. Never mention HubSpot or Breeze. If the answer is not in the fields, say you only have this record\'s fields. Keep it to two short sentences.';
    }

    protected function recencyScore(?int $days): int
    {
        if ($days === null) {
            return 0;
        }

        return match (true) {
            $days <= 2 => 100,
            $days <= 7 => 70,
            $days <= 14 => 40,
            $days <= 30 => 15,
            default => 0,
        };
    }

    protected function daysSince(mixed $stamp): ?int
    {
        if (! $stamp instanceof CarbonInterface) {
            return null;
        }

        return (int) $stamp->diffInDays(now());
    }
}
