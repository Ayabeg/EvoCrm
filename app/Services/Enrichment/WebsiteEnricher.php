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

        if (! ($fetched['ok'] ?? false)) {
            $this->runs->persistFailure(
                $workspace,
                $targetType,
                (int) $target->id,
                EnrichmentRun::SOURCE_WEBSITE,
                'url',
                (string) ($fetched['error'] ?? 'Website fetch failed.'),
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
            $candidates[] = $target->domain;
        }

        if ($target instanceof Contact) {
            $meta = is_array($target->meta) ? $target->meta : [];
            $candidates[] = $meta['website'] ?? null;
            $candidates[] = $meta['url'] ?? null;
            $candidates[] = $target->company?->domain;
        }

        if ($target instanceof Lead) {
            $payload = is_array($target->payload) ? $target->payload : [];
            foreach (['website', 'website_url', 'url', 'company_website'] as $key) {
                $candidates[] = $payload[$key] ?? null;
            }
            $candidates[] = $target->company?->domain;
            $candidates[] = $target->contact?->company?->domain;
            $meta = is_array($target->contact?->meta) ? $target->contact->meta : [];
            $candidates[] = $meta['website'] ?? null;
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
}
