<?php

namespace App\Services\Ai;

use App\Models\Activity;
use App\Models\AiInsight;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Crm\CustomAttributes;
use App\Services\Crm\DealBoardForecast;
use App\Services\Crm\PipelineManager;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class RecordInsight
{
    public function __construct(private LlmClient $llm, private CustomAttributes $attributes) {}

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
     * @return array{label: string, summary: string, question: string|null, answer: string|null, source: string, live: bool}
     */
    public function forCompany(Company $company): array
    {
        $company->loadMissing(['owner', 'contacts', 'deals.stage']);

        return $this->present('company', $company->id, $this->summarizeCompany($company));
    }

    /**
     * @return array{score: int, band: string, label: string, reason: string}
     */
    public function contactEngagement(Contact $contact): array
    {
        $contact->loadMissing(['deals.stage']);

        $days = $this->daysSince($contact->last_activity_at);
        $openDeals = $contact->deals->filter(fn (Deal $deal) => $deal->stage && ! $deal->stage->is_won && ! $deal->stage->is_lost)->count();
        $hasEmail = filled($contact->email);

        $score = (int) round(
            ($this->recencyScore($days) * 0.5)
            + (min($openDeals, 3) / 3 * 100 * 0.3)
            + (($hasEmail ? 100 : 0) * 0.2)
        );
        $score = max(0, min(100, $score));

        $band = $score >= 70 ? 'engaged' : ($score >= 40 ? 'warming' : 'cold');
        $label = $score >= 70 ? 'Engaged' : ($score >= 40 ? 'Warming' : 'Cold');

        return [
            'score' => $score,
            'band' => $band,
            'label' => $label,
            'reason' => ($days === null ? 'no activity' : 'last activity '.$days.'d ago')
                .' · '.$openDeals.' open deal'.($openDeals === 1 ? '' : 's')
                .($contact->wilaya ? ' · '.$contact->wilaya : '').'.',
        ];
    }

    public function proactiveSummary(Contact|Deal $record): string
    {
        $cached = AiInsight::query()
            ->where('subject_type', $record instanceof Deal ? 'deal' : 'contact')
            ->where('subject_id', $record->id)
            ->whereNull('question')
            ->latest('id')
            ->first();

        if ($cached && $cached->created_at && $cached->created_at->greaterThan(now()->subHours(6))) {
            return (string) $cached->answer;
        }

        $summary = $record instanceof Deal
            ? $this->summarizeDeal($record->loadMissing(['stage', 'contact', 'company', 'owner']))
            : $this->summarizeContact($record->loadMissing(['company', 'owner', 'deals.stage']));

        AiInsight::query()->create([
            'workspace_id' => $record->workspace_id,
            'subject_type' => $record instanceof Deal ? 'deal' : 'contact',
            'subject_id' => $record->id,
            'question' => null,
            'answer' => $summary,
            'source' => 'proactive',
        ]);

        return $summary;
    }

    /**
     * @return array{subject: string, body: string}
     */
    public function draftEmail(Contact|Deal $record, string $intent = 'follow_up'): array
    {
        $name = $record instanceof Deal
            ? ($record->contact?->displayName() ?? 'there')
            : $record->displayName();

        $live = $this->llm->complete(
            $this->systemPrompt(),
            "Draft a short {$intent} email to {$name}. Algerian B2B tone, French or Arabic ok. Two sentences max.",
        );

        $body = $live['text'] ?? "Bonjour {$name}, je reviens vers vous concernant notre échange EvoSales.";

        return [
            'subject' => $intent === 'follow_up' ? 'Suite à notre échange' : 'EvoSales',
            'body' => $body,
        ];
    }

    /**
     * @return array{score: int, band: string, label: string, reason: string}
     */
    public function dealHealth(Deal $deal): array
    {
        $deal->loadMissing('stage');

        $stage = $this->stageOf($deal);
        $probability = $stage
            ? DealBoardForecast::probabilityFor($stage)
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

        $stageBit = $stage
            ? $stage->name.' at '.$probability.'%'
            : 'stage at '.$probability.'%';
        $activityBit = $days === null
            ? 'no activity yet'
            : ($days === 0 ? 'active today' : 'last activity '.$days.' days ago');
        $amountBit = $hasAmount ? 'amount set' : 'amount missing';

        $nextAction = match (true) {
            $days === null && ! $hasAmount => 'Add an amount and log a first activity — health is incomplete without either.',
            $days === null => 'Log a first activity so health is more than stage math.',
            $days > 7 => 'Book a follow-up — this deal has gone quiet.',
            ! $hasAmount => 'Set an amount so forecast and health are not incomplete.',
            default => 'Keep the next step current and move the stage when the buyer advances.',
        };

        return [
            'score' => $score,
            'band' => $band,
            'label' => $days === null && ! $hasAmount ? 'Low data' : $label,
            'reason' => $stageBit.' · '.$activityBit.' · '.$amountBit.'.',
            'factors' => [
                ['key' => 'stage', 'label' => 'Stage probability', 'detail' => $stageBit],
                ['key' => 'recency', 'label' => 'Activity', 'detail' => $activityBit],
                ['key' => 'amount', 'label' => 'Amount', 'detail' => $amountBit],
            ],
            'next_action' => $nextAction,
        ];
    }

    /**
     * @return array{answer: string, source: string, summary: string}
     */
    public function ask(Contact|Deal|Company $record, string $question): array
    {
        $question = trim($question);
        $kind = match (true) {
            $record instanceof Deal => 'deal',
            $record instanceof Company => 'company',
            default => 'contact',
        };
        $summary = match (true) {
            $record instanceof Deal => $this->summarizeDeal($record->loadMissing(['stage', 'contact', 'company', 'owner'])),
            $record instanceof Company => $this->summarizeCompany($record->loadMissing(['owner', 'contacts', 'deals.stage'])),
            default => $this->summarizeContact($record->loadMissing(['company', 'owner', 'deals.stage'])),
        };
        $facts = match (true) {
            $record instanceof Deal => $this->dealFacts($record),
            $record instanceof Company => $this->companyFacts($record),
            default => $this->contactFacts($record),
        };
        $activities = $this->retrieveRelevantActivities($record, $question);

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
     * AI-assisted forecast band for a pipeline (deterministic range + optional LLM narrative).
     *
     * @return array{
     *     weighted_cents: int,
     *     low_cents: int,
     *     high_cents: int,
     *     band_label: string,
     *     narrative: string|null,
     *     source: string
     * }
     */
    public function pipelineForecastBand(Workspace $workspace, Pipeline $pipeline): array
    {
        $manager = app(PipelineManager::class);
        $forecast = $manager->forecast($workspace, $pipeline);
        $weighted = (int) $forecast['weighted_cents'];
        $open = (int) ($forecast['open_cents'] ?? $forecast['amount_cents']);

        $low = (int) round($weighted * 0.75);
        $high = (int) round(min($open, $weighted * 1.35));

        $facts = sprintf(
            'Open pipeline %s DZD, weighted forecast %s DZD, %d deals.',
            number_format($open / 100, 0, ',', ' '),
            number_format($weighted / 100, 0, ',', ' '),
            (int) $forecast['count'],
        );

        $live = $this->llm->complete(
            'You are Evo, Evotechly\'s CRM assistant. Give a one-sentence forecast band commentary from the numbers only. Never invent data.',
            $facts.' Provide a conservative-to-upside forecast band comment for the sales team.',
        );

        $bandLabel = $high > $weighted * 1.1 ? 'Upside likely' : ($low < $weighted * 0.85 ? 'Conservative' : 'On track');

        return [
            'weighted_cents' => $weighted,
            'low_cents' => $low,
            'high_cents' => $high,
            'band_label' => $bandLabel,
            'narrative' => $live['text'] ?? null,
            'source' => $live['source'] ?? 'math',
        ];
    }

    /**
     * RAG-lite: keyword-ranked activities beyond the default recent window.
     *
     * @return Collection<int, Activity>
     */
    protected function retrieveRelevantActivities(Contact|Deal|Company $record, string $question): Collection
    {
        $recent = $this->recentActivities($record, 30);
        $terms = collect(preg_split('/\s+/', Str::lower($question)))
            ->filter(fn (string $term) => strlen($term) >= 4)
            ->values();

        if ($terms->isEmpty()) {
            return $recent->take(8);
        }

        return $recent
            ->sortByDesc(function (Activity $activity) use ($terms) {
                $haystack = Str::lower(trim(($activity->subject ?? '').' '.($activity->body ?? '').' '.$activity->type));
                $score = 0;
                foreach ($terms as $term) {
                    if (str_contains($haystack, $term)) {
                        $score++;
                    }
                }

                return $score;
            })
            ->take(12)
            ->values();
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

        $insight = $latest instanceof AiInsight ? $latest : null;

        return [
            'label' => 'Ask Evo',
            'summary' => $summary,
            'question' => $insight?->question,
            'answer' => $insight?->answer,
            'source' => $insight instanceof AiInsight ? $insight->source : 'fields',
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

    public function summarizeCompany(Company $company): string
    {
        $facts = $this->companyFacts($company);
        $bits = array_filter([
            $facts['Name'] ?? 'This company',
            isset($facts['Domain']) ? 'domain '.$facts['Domain'] : 'no domain',
            isset($facts['City']) ? $facts['City'] : null,
            isset($facts['Industry']) ? $facts['Industry'] : null,
            isset($facts['Contacts']) ? $facts['Contacts'] : 'no contacts',
            isset($facts['Deals']) ? $facts['Deals'] : 'no deals',
        ]);

        $line = implode(' · ', $bits).'.';
        $activity = $this->activityLine($this->recentActivities($company));

        return $activity === '' ? $line : $line.' '.$activity;
    }

    /**
     * @return array<string, string>
     */
    protected function contactFacts(Contact $contact): array
    {
        $dealLines = [];

        foreach ($contact->deals as $deal) {
            if (! $deal instanceof Deal) {
                continue;
            }

            $stage = $this->stageOf($deal);
            $amount = (int) $deal->amount_cents > 0
                ? number_format(((int) $deal->amount_cents) / 100, 0, ',', ' ').' DZD'
                : null;

            $dealLines[] = trim($deal->title.($stage instanceof Stage ? ' ('.$stage->name.')' : '').($amount ? ' '.$amount : ''));
        }

        $dealLines = array_values(array_filter($dealLines));

        return array_filter([
            'Name' => $contact->displayName(),
            'Email' => $contact->email,
            'Phone' => $contact->phone_e164 ?? $contact->phone,
            'City' => $contact->city,
            'Wilaya' => $contact->wilaya,
            'Company' => $this->companyName($contact->company),
            'Owner' => $this->userName($contact->owner),
            'Deals' => $dealLines === [] ? null : count($dealLines).' deal'.(count($dealLines) === 1 ? '' : 's').' ('.implode(', ', $dealLines).')',
            ...$this->attributeFacts($contact->workspace_id, 'contact', $contact->id),
        ], fn ($value) => filled($value));
    }

    /**
     * @return array<string, string>
     */
    protected function companyFacts(Company $company): array
    {
        $contactCount = $company->contacts->count();
        $dealLines = [];

        foreach ($company->deals as $deal) {
            if (! $deal instanceof Deal) {
                continue;
            }

            $stage = $this->stageOf($deal);
            $dealLines[] = trim($deal->title.($stage instanceof Stage ? ' ('.$stage->name.')' : ''));
        }

        $dealLines = array_values(array_filter($dealLines));

        return array_filter([
            'Name' => $company->name,
            'Domain' => $company->domain,
            'Industry' => $company->industry,
            'Phone' => $company->phone,
            'City' => $company->city,
            'Wilaya' => $company->wilaya,
            'Owner' => $this->userName($company->owner),
            'Contacts' => $contactCount > 0
                ? $contactCount.' contact'.($contactCount === 1 ? '' : 's')
                : null,
            'Deals' => $dealLines === [] ? null : count($dealLines).' deal'.(count($dealLines) === 1 ? '' : 's').' ('.implode(', ', $dealLines).')',
            ...$this->attributeFacts($company->workspace_id, 'company', $company->id),
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
        $stage = $this->stageOf($deal);
        $probability = $stage
            ? DealBoardForecast::probabilityFor($stage).'%'
            : null;
        $contact = $deal->contact instanceof Contact ? $deal->contact : null;

        return array_filter([
            'Title' => $deal->title,
            'Stage' => $stage?->name,
            'Probability' => $probability,
            'Amount' => $amount,
            'Contact' => $contact?->displayName(),
            'Company' => $this->companyName($deal->company) ?? $this->companyName($contact?->company),
            'Owner' => $this->userName($deal->owner),
            'Next step' => $deal->next_step,
            'Close date' => $this->dateString($deal->close_date),
            ...$this->attributeFacts($deal->workspace_id, 'deal', $deal->id),
        ], fn ($value) => filled($value));
    }

    /**
     * @return array<string, string>
     */
    protected function attributeFacts(int $workspaceId, string $entity, int $entityId): array
    {
        $workspace = Workspace::query()->find($workspaceId);

        if (! $workspace) {
            return [];
        }

        $definitions = $this->attributes->definitions($workspace, $entity);
        $values = $this->attributes->valuesFor($workspace, $entity, $entityId);
        $facts = [];

        foreach ($definitions as $definition) {
            $value = $values[$definition->key] ?? null;

            if (filled($value)) {
                $facts[$definition->label] = is_array($value) ? implode(', ', $value) : (string) $value;
            }
        }

        return $facts;
    }

    /**
     * @return Collection<int, Activity>
     */
    protected function recentActivities(Contact|Deal|Company $record, int $limit = 8): Collection
    {
        $query = Activity::query()->latest('id')->limit($limit);

        if ($record instanceof Company) {
            $query->where('company_id', $record->id);
        } elseif ($record instanceof Deal) {
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
                if (str_contains($haystack, $needle)) {
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
            'Domain' => ['website', 'url'],
            'Industry' => ['sector', 'vertical'],
            'Contacts' => ['people', 'team'],
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

    protected function stageOf(Deal $deal): ?Stage
    {
        $stage = $deal->stage;

        return $stage instanceof Stage ? $stage : null;
    }

    protected function companyName(mixed $company): ?string
    {
        return $company instanceof Company ? $company->name : null;
    }

    protected function userName(mixed $user): ?string
    {
        return $user instanceof User ? $user->name : null;
    }

    protected function dateString(mixed $value): ?string
    {
        if ($value instanceof CarbonInterface) {
            return $value->toDateString();
        }

        return is_string($value) && $value !== '' ? $value : null;
    }
}
