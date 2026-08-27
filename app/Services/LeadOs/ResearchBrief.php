<?php

namespace App\Services\LeadOs;

use App\Models\AiInsight;
use App\Models\Company;
use App\Models\Deal;
use App\Models\Workspace;
use App\Services\Ai\LlmClient;
use App\Services\Ai\RecordInsight;

/**
 * Short public-facts brief after enrich. Never invent emails or contacts.
 */
class ResearchBrief
{
    public function __construct(
        private LlmClient $llm,
        private RecordInsight $insight,
    ) {}

    public function configured(): bool
    {
        return $this->llm->available();
    }

    /**
     * @return array{status: string, counts: array<string, int>, error: string|null}
     */
    public function run(Workspace $workspace): array
    {
        if (! $this->configured()) {
            return [
                'status' => 'skipped',
                'counts' => ['briefs' => 0],
                'error' => 'Ask Evo is unconfigured',
            ];
        }

        $written = 0;

        Company::query()
            ->forWorkspace($workspace)
            ->whereHas('deals', function ($query): void {
                $query->whereHas('stage', fn ($stage) => $stage->where('is_won', false)->where('is_lost', false));
            })
            ->orderBy('id')
            ->each(function (Company $company) use (&$written): void {
                $this->writeCompany($company);
                $written++;
            });

        Deal::query()
            ->forWorkspace($workspace)
            ->whereNull('company_id')
            ->whereHas('stage', fn ($query) => $query->where('is_won', false)->where('is_lost', false))
            ->with(['contact.company'])
            ->orderBy('id')
            ->each(function (Deal $deal) use (&$written): void {
                if ($deal->contact?->company instanceof Company) {
                    return;
                }

                $this->writeDealPlace($deal);
                $written++;
            });

        return [
            'status' => 'ok',
            'counts' => ['briefs' => $written],
            'error' => null,
        ];
    }

    public function writeCompany(Company $company): AiInsight
    {
        $company->loadMissing(['contacts', 'deals.stage']);
        $summary = $this->insight->summarizeCompany($company);
        $place = trim(implode(', ', array_filter([$company->city, $company->wilaya, $company->country ?: 'DZ'])));

        $live = $this->llm->complete(
            'You are Evo. Write a two-sentence public-facts brief about this Algerian company or place. Use only the supplied fields. Never invent emails, phone numbers, or people. If a fact is missing, say it is not on the record. Never mention HubSpot or Breeze.',
            "Name: {$company->name}\nDomain: ".($company->domain ?: 'none')."\nIndustry: ".($company->industry ?: 'none')."\nPlace: ".($place !== '' ? $place : 'unknown')."\nRecord: {$summary}",
        );

        $answer = $this->withoutInventedEmails(
            (string) ($live['text'] ?? $this->stubCompany($company, $place, $summary)),
            $company,
        );

        return AiInsight::query()->create([
            'workspace_id' => $company->workspace_id,
            'subject_type' => 'company',
            'subject_id' => $company->id,
            'question' => 'Research brief',
            'answer' => $answer,
            'source' => $live['source'] ?? 'fields',
        ]);
    }

    public function writeDealPlace(Deal $deal): AiInsight
    {
        $deal->loadMissing(['contact', 'stage']);
        $wilaya = $deal->contact?->wilaya;
        $city = $deal->contact?->city;
        $place = trim(implode(', ', array_filter([$city, $wilaya])));
        $summary = $this->insight->summarizeDeal($deal);

        $live = $this->llm->complete(
            'You are Evo. Write a two-sentence public-facts brief about this Algerian place or account. Use only the supplied fields. Never invent emails, phone numbers, or people.',
            "Deal: {$deal->title}\nPlace: ".($place !== '' ? $place : 'unknown')."\nRecord: {$summary}",
        );

        $answer = $this->withoutInventedEmails(
            (string) ($live['text'] ?? $this->stubPlace($deal, $place, $summary)),
            $deal,
        );

        return AiInsight::query()->create([
            'workspace_id' => $deal->workspace_id,
            'subject_type' => 'deal',
            'subject_id' => $deal->id,
            'question' => 'Research brief',
            'answer' => $answer,
            'source' => $live['source'] ?? 'fields',
        ]);
    }

    protected function stubCompany(Company $company, string $place, string $summary): string
    {
        $bits = array_filter([
            $company->name,
            $company->domain ? 'domain '.$company->domain : 'no domain on file',
            $place !== '' ? $place : null,
            $company->industry,
        ]);

        return implode(' · ', $bits).'. Public facts from this record only — '.$summary;
    }

    protected function stubPlace(Deal $deal, string $place, string $summary): string
    {
        return $deal->title.' · '.($place !== '' ? $place : 'place unknown').'. '.$summary;
    }

    protected function withoutInventedEmails(string $text, Company|Deal $record): string
    {
        $clean = trim($text);
        $known = $record instanceof Company
            ? $record->contacts->pluck('email')->filter()->map(fn ($email) => strtolower((string) $email))->all()
            : array_filter([strtolower((string) ($record->contact?->email ?? ''))]);

        preg_match_all('/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i', $clean, $matches);

        foreach ($matches[0] as $email) {
            if (! in_array(strtolower($email), $known, true)) {
                $clean = str_replace($email, '[not on record]', $clean);
            }
        }

        return $clean;
    }
}
