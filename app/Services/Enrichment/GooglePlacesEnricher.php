<?php

namespace App\Services\Enrichment;

use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\Workspace;
use App\Support\AlgerianPhone;
use App\Support\AlgerianWilaya;

class GooglePlacesEnricher
{
    public function __construct(
        private GooglePlacesClient $client,
        private EnrichmentPersister $runs,
        private WebsiteFetcher $urls,
    ) {}

    public function enrich(Workspace $workspace, string $targetType, Company|Contact|Lead $target): void
    {
        if ($this->client->apiKey() === null) {
            $this->runs->persistSkip(
                $workspace,
                $targetType,
                (int) $target->id,
                EnrichmentRun::SOURCE_GOOGLE_PLACES,
                'place_id',
                'GOOGLE_PLACES_API_KEY missing',
            );

            return;
        }

        $query = $this->queryFor($target);

        if ($query === null) {
            $this->runs->persistSkip(
                $workspace,
                $targetType,
                (int) $target->id,
                EnrichmentRun::SOURCE_GOOGLE_PLACES,
                'place_id',
                'No name + wilaya/city to look up.',
            );

            return;
        }

        $result = $this->client->searchText($query);

        if (! $result['ok']) {
            $this->runs->persistFailure(
                $workspace,
                $targetType,
                (int) $target->id,
                EnrichmentRun::SOURCE_GOOGLE_PLACES,
                'place_id',
                $result['error'] ?? 'Google Places lookup failed.',
                ['query' => $query],
            );

            return;
        }

        $places = $result['places'] ?? [];

        if ($places === []) {
            $this->runs->persistSkip(
                $workspace,
                $targetType,
                (int) $target->id,
                EnrichmentRun::SOURCE_GOOGLE_PLACES,
                'place_id',
                'No Google Places match.',
                ['query' => $query],
            );

            return;
        }

        $place = $places[0];
        $confidence = count($places) === 1 ? 0.9 : 0.6;
        $evidenceUrl = is_string($place['googleMapsUri'] ?? null) && filter_var($place['googleMapsUri'], FILTER_VALIDATE_URL)
            ? $place['googleMapsUri']
            : null;
        $raw = [
            'query' => $query,
            'place' => $place,
            'result_count' => count($places),
            ...($evidenceUrl ? ['evidence_url' => $evidenceUrl] : []),
        ];

        $placeId = is_string($place['id'] ?? null) ? $place['id'] : null;
        $address = is_string($place['formattedAddress'] ?? null) ? $place['formattedAddress'] : null;
        $lat = $place['location']['latitude'] ?? null;
        $lng = $place['location']['longitude'] ?? null;
        $phone = is_string($place['internationalPhoneNumber'] ?? null)
            ? $place['internationalPhoneNumber']
            : (is_string($place['nationalPhoneNumber'] ?? null) ? $place['nationalPhoneNumber'] : null);
        $website = is_string($place['websiteUri'] ?? null) ? $place['websiteUri'] : null;
        $wilaya = AlgerianWilaya::extract($address);

        if ($placeId) {
            $this->runs->persistProposal($workspace, $targetType, $target, EnrichmentRun::SOURCE_GOOGLE_PLACES, 'place_id', $placeId, $confidence, $raw);
        }

        if ($address) {
            $this->runs->persistProposal($workspace, $targetType, $target, EnrichmentRun::SOURCE_GOOGLE_PLACES, 'address', $address, $confidence, $raw);
        }

        if (is_numeric($lat)) {
            $this->runs->persistProposal($workspace, $targetType, $target, EnrichmentRun::SOURCE_GOOGLE_PLACES, 'latitude', (string) $lat, $confidence, $raw);
        }

        if (is_numeric($lng)) {
            $this->runs->persistProposal($workspace, $targetType, $target, EnrichmentRun::SOURCE_GOOGLE_PLACES, 'longitude', (string) $lng, $confidence, $raw);
        }

        if ($phone) {
            $normalized = AlgerianPhone::normalize($phone);
            $phoneConfidence = $normalized && str_starts_with($normalized, '+213') ? max($confidence, 0.85) : 0.5;
            $this->runs->persistProposal($workspace, $targetType, $target, EnrichmentRun::SOURCE_GOOGLE_PLACES, 'phone', $phone, $phoneConfidence, $raw);
        }

        if ($wilaya) {
            $this->runs->persistProposal($workspace, $targetType, $target, EnrichmentRun::SOURCE_GOOGLE_PLACES, 'wilaya', $wilaya, 0.95, $raw);
        }

        if ($website) {
            $host = parse_url($this->urls->normalizeUrl($website) ?? $website, PHP_URL_HOST);
            if (is_string($host) && $host !== '') {
                $this->runs->persistProposal($workspace, $targetType, $target, EnrichmentRun::SOURCE_GOOGLE_PLACES, 'domain', $host, $confidence, $raw);
            }
        }

        $this->runs->persistProposal($workspace, $targetType, $target, EnrichmentRun::SOURCE_GOOGLE_PLACES, 'currency_hint', 'DZD', 0.95, $raw);
    }

    public function queryFor(Company|Contact|Lead $target): ?string
    {
        $company = $target instanceof Company ? $target : ($target->company instanceof Company ? $target->company : null);
        $contact = $target instanceof Contact ? $target : ($target instanceof Lead && $target->contact instanceof Contact ? $target->contact : null);

        $name = match (true) {
            $target instanceof Company => $target->name,
            $target instanceof Contact => $company?->name ?: $target->displayName(),
            $target instanceof Lead => $company?->name ?: $target->title,
        };

        $name = trim((string) $name);

        if ($name === '') {
            return null;
        }

        $place = $company?->wilaya
            ?: $company?->city
            ?: $contact?->wilaya
            ?: $contact?->city;

        $place = AlgerianWilaya::normalize(is_string($place) ? $place : null);
        $parts = array_filter([$name, $place, 'Algeria']);

        return implode(' ', $parts);
    }
}
