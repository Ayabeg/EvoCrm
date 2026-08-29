<?php

namespace App\Services\Enrichment;

use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\Workspace;
use App\Support\AlgerianPhone;

class WebsiteEnricher
{
    public function __construct(
        private WebsiteFetcher $fetcher,
        private WebsitePageParser $parser,
        private EnrichmentPersister $runs,
    ) {}

    public function enrich(Workspace $workspace, string $targetType, Company|Contact|Lead $target): void
    {
        $url = $this->resolveUrl($target);

        if ($url === null) {
            $this->runs->persistSkip(
                $workspace,
                $targetType,
                (int) $target->id,
                EnrichmentRun::SOURCE_WEBSITE,
                'url',
                'No known public website URL on this record.',
            );

            return;
        }

        $fetched = $this->fetcher->get($url);

        if (! $fetched['ok']) {
            $this->runs->persistFailure(
                $workspace,
                $targetType,
                (int) $target->id,
                EnrichmentRun::SOURCE_WEBSITE,
                'url',
                $fetched['error'] ?? 'Website fetch failed.',
                ['url' => $url],
            );

            return;
        }

        $parsed = $this->parser->parse((string) ($fetched['body'] ?? ''));
        $raw = [
            'url' => $url,
            'title' => $parsed['title'],
            'description' => $parsed['description'],
            'emails' => $parsed['emails'],
            'phones' => $parsed['phones'],
        ];

        if ($parsed['title']) {
            $this->runs->persistProposal(
                $workspace,
                $targetType,
                $target,
                EnrichmentRun::SOURCE_WEBSITE,
                'website_title',
                $parsed['title'],
                0.9,
                $raw,
            );
        }

        if ($parsed['description']) {
            $this->runs->persistProposal(
                $workspace,
                $targetType,
                $target,
                EnrichmentRun::SOURCE_WEBSITE,
                'website_description',
                $parsed['description'],
                0.85,
                $raw,
            );
        }

        foreach ($parsed['emails'] as $email) {
            $this->runs->persistProposal(
                $workspace,
                $targetType,
                $target,
                EnrichmentRun::SOURCE_WEBSITE,
                'email',
                $email,
                0.9,
                $raw,
            );
        }

        foreach ($parsed['phones'] as $phone) {
            $normalized = AlgerianPhone::normalize($phone);
            $confidence = $normalized && str_starts_with($normalized, '+213') ? 0.85 : 0.5;

            $this->runs->persistProposal(
                $workspace,
                $targetType,
                $target,
                EnrichmentRun::SOURCE_WEBSITE,
                'phone',
                $phone,
                $confidence,
                $raw,
            );
        }

        $this->runs->persistProposal(
            $workspace,
            $targetType,
            $target,
            EnrichmentRun::SOURCE_WEBSITE,
            'currency_hint',
            'DZD',
            0.95,
            $raw,
        );
    }

    public function resolveUrl(Company|Contact|Lead $target): ?string
    {
        $candidates = [];

        if ($target instanceof Company) {
            $candidates[] = $target->getAttribute('domain');
        }

        if ($target instanceof Contact) {
            $candidates = array_merge($candidates, $this->bagStrings($target->getAttribute('meta'), ['website', 'url']));
            $company = $target->company;
            if ($company instanceof Company) {
                $candidates[] = $company->getAttribute('domain');
            }
        }

        if ($target instanceof Lead) {
            $candidates = array_merge(
                $candidates,
                $this->bagStrings($target->getAttribute('payload'), ['website', 'website_url', 'url', 'company_website']),
            );
            $company = $target->company;
            if ($company instanceof Company) {
                $candidates[] = $company->getAttribute('domain');
            }
            $contact = $target->contact;
            if ($contact instanceof Contact) {
                $relatedCompany = $contact->company;
                if ($relatedCompany instanceof Company) {
                    $candidates[] = $relatedCompany->getAttribute('domain');
                }
                $candidates = array_merge($candidates, $this->bagStrings($contact->getAttribute('meta'), ['website']));
            }
        }

        foreach ($candidates as $candidate) {
            if (! is_string($candidate) || trim($candidate) === '') {
                continue;
            }

            $url = $this->fetcher->normalizeUrl($candidate);

            if ($url !== null) {
                return $url;
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $keys
     * @return list<mixed>
     */
    private function bagStrings(mixed $bag, array $keys): array
    {
        if (is_string($bag) && $bag !== '') {
            $decoded = json_decode($bag, true);
            $bag = is_array($decoded) ? $decoded : [];
        }

        if (! is_array($bag)) {
            return [];
        }

        $values = [];

        foreach ($keys as $key) {
            $values[] = $bag[$key] ?? null;
        }

        return $values;
    }
}
