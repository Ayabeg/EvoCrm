<?php

namespace App\Services\Crm;

use App\Models\Lead;

/**
 * Deterministic 0–100 completeness and reliability score for enrichment.
 * This is intentionally separate from commercial intent/fit qualification.
 */
class DataQualityScorer
{
    /**
     * @return array{score: int, breakdown: list<array{key: string, label: string, points: int}>}
     */
    public function compute(Lead $lead): array
    {
        $lead->loadMissing(['contact.company', 'company', 'workspace']);
        $contact = $lead->contact;
        $company = $lead->company ?? $contact?->company;
        $rules = $lead->workspace?->leadScoreRules() ?? config('evosales.lead_score.rules', []);
        $breakdown = [
            $this->factor('company', 'Company attached', $company && filled($company->name) ? $rules['quality']['company'] : 0),
            $this->factor('email', 'Usable business email', $this->hasUsableEmail($contact?->email) ? $rules['quality']['email'] : 0),
            $this->factor('phone', 'Usable telephone number', filled($contact?->phone_e164 ?: $contact?->phone) ? $rules['quality']['phone'] : 0),
            $this->factor('location', 'Geographic location', filled($contact?->city ?: $contact?->wilaya ?: $company?->city ?: $company?->wilaya) ? $rules['quality']['location'] : 0),
            $this->factor('domain', 'Company domain', filled($company?->domain) ? $rules['quality']['domain'] : 0),
            $this->factor('industry', 'Industry identified', filled($company?->industry) ? $rules['quality']['industry'] : 0),
            $this->factor('source', 'Traceable lead source', filled($lead->source) ? $rules['quality']['source'] : 0),
        ];

        return [
            'score' => array_sum(array_column($breakdown, 'points')),
            'breakdown' => $breakdown,
        ];
    }

    private function hasUsableEmail(?string $email): bool
    {
        return is_string($email) && filter_var(trim($email), FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * @return array{key: string, label: string, points: int}
     */
    private function factor(string $key, string $label, int $points): array
    {
        return compact('key', 'label', 'points');
    }
}
