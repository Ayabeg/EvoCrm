<?php

namespace App\Services\Crm;

use App\Models\Lead;
use App\Support\AlgerianPhone;
use Illuminate\Support\Carbon;

/**
 * Deterministic 0–100 lead score. Fit / intent / timing are rule totals.
 * Ask Evo never calls this — it may only rewrite the human reason.
 */
class LeadScoreFormula
{
    public const FIT_MAX = 40;

    public const INTENT_MAX = 35;

    public const TIMING_MAX = 25;

    public function __construct(private DataQualityScorer $quality) {}

    /**
     * @return array{
     *     score: int,
     *     fit: int,
     *     intent: int,
     *     timing: int,
     *     data_quality: int,
     *     quality_breakdown: list<array{key: string, label: string, points: int}>,
     *     reason: string,
     *     breakdown: list<array{pillar: string, key: string, label: string, points: int}>
     * }
     */
    public function compute(Lead $lead): array
    {
        $lead->loadMissing(['contact.company', 'company']);

        $fit = $this->fit($lead);
        $intent = $this->intent($lead);
        $timing = $this->timing($lead);
        $quality = $this->quality->compute($lead);

        $score = max(0, min(100, $fit['points'] + $intent['points'] + $timing['points']));
        $breakdown = [...$fit['rules'], ...$intent['rules'], ...$timing['rules']];

        return [
            'score' => $score,
            'fit' => $fit['points'],
            'intent' => $intent['points'],
            'timing' => $timing['points'],
            'data_quality' => $quality['score'],
            'quality_breakdown' => $quality['breakdown'],
            'reason' => $this->reason($breakdown, $score),
            'breakdown' => $breakdown,
        ];
    }

    /**
     * @return array{points: int, rules: list<array{pillar: string, key: string, label: string, points: int}>}
     */
    private function fit(Lead $lead): array
    {
        $contact = $lead->contact;
        $rules = [];

        $wilaya = trim((string) ($contact?->wilaya ?? ''));
        $priority = array_map('mb_strtolower', config('evosales.wilayas', []));
        if ($wilaya !== '' && in_array(mb_strtolower($wilaya), $priority, true)) {
            $rules[] = $this->rule('fit', 'wilaya', $wilaya.' wilaya', 12);
        }

        $phone = AlgerianPhone::normalize($contact?->phone_e164 ?: $contact?->phone);
        if (is_string($phone) && $phone !== '') {
            $rules[] = str_starts_with($phone, '+213')
                ? $this->rule('fit', 'phone_dz', '+213 phone', 12)
                : $this->rule('fit', 'phone', 'phone on file', 8);
        }

        if (filled($contact?->email)) {
            $rules[] = $this->rule('fit', 'email', 'email on file', 10);
        }

        if ($lead->company_id || $contact?->company_id || $lead->company || $contact?->company) {
            $rules[] = $this->rule('fit', 'company', 'company attached', 6);
        }

        return $this->sum($rules, self::FIT_MAX);
    }

    /**
     * @return array{points: int, rules: list<array{pillar: string, key: string, label: string, points: int}>}
     */
    private function intent(Lead $lead): array
    {
        $rules = [];
        $source = mb_strtolower((string) ($lead->source ?? ''));
        $inbound = ['meta_lead_form', 'meta_ads', 'website', 'inbound', 'whatsapp_cloud', 'ctwa'];

        if (in_array($source, $inbound, true)) {
            $rules[] = $this->rule('intent', 'inbound', 'inbound '.$source, 15);
        }

        if ($this->hasFormAnswers($lead->payload)) {
            $rules[] = $this->rule('intent', 'form', 'form answers', 12);
        }

        if ($lead->contact?->last_activity_at) {
            $rules[] = $this->rule('intent', 'activity', 'recent activity', 8);
        }

        return $this->sum($rules, self::INTENT_MAX);
    }

    /**
     * @return array{points: int, rules: list<array{pillar: string, key: string, label: string, points: int}>}
     */
    private function timing(Lead $lead): array
    {
        $anchor = $lead->contact?->last_activity_at ?? $lead->created_at ?? now();
        $days = (int) Carbon::parse($anchor)->diffInDays(now(), true);

        $rule = match (true) {
            $days <= 0 => $this->rule('timing', 'today', 'created today', 25),
            $days <= 3 => $this->rule('timing', '3d', 'last 3 days', 18),
            $days <= 7 => $this->rule('timing', '7d', 'last 7 days', 12),
            $days <= 30 => $this->rule('timing', '30d', 'last 30 days', 6),
            default => $this->rule('timing', 'stale', 'older than 30 days', 0),
        };

        return $this->sum([$rule], self::TIMING_MAX);
    }

    /**
     * @param  array<string, mixed>|null  $payload
     */
    private function hasFormAnswers(?array $payload): bool
    {
        if (! is_array($payload) || $payload === []) {
            return false;
        }

        $fields = $payload['fields'] ?? $payload['field_data'] ?? null;

        return is_array($fields) && $fields !== [];
    }

    /**
     * @param  list<array{pillar: string, key: string, label: string, points: int}>  $rules
     * @return array{points: int, rules: list<array{pillar: string, key: string, label: string, points: int}>}
     */
    private function sum(array $rules, int $max): array
    {
        $points = 0;

        foreach ($rules as $rule) {
            $points += $rule['points'];
        }

        return [
            'points' => max(0, min($max, $points)),
            'rules' => $rules,
        ];
    }

    /**
     * @return array{pillar: string, key: string, label: string, points: int}
     */
    private function rule(string $pillar, string $key, string $label, int $points): array
    {
        return [
            'pillar' => $pillar,
            'key' => $key,
            'label' => $label,
            'points' => $points,
        ];
    }

    /**
     * @param  list<array{pillar: string, key: string, label: string, points: int}>  $breakdown
     */
    private function reason(array $breakdown, int $score): string
    {
        $bits = collect($breakdown)
            ->filter(fn (array $rule): bool => $rule['points'] > 0)
            ->sortByDesc('points')
            ->take(3)
            ->pluck('label')
            ->all();

        if ($bits === []) {
            return 'Score '.$score.' — not enough fit, intent, or timing yet.';
        }

        return 'Score '.$score.' — '.implode(' · ', $bits).'.';
    }
}
