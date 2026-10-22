<?php

namespace App\Services\Enrichment;

use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Official Google Places API (New) Text Search.
 *
 * @see https://developers.google.com/maps/documentation/places/web-service/text-search
 */
final class GooglePlacesClient
{
    public const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

    public function apiKey(): ?string
    {
        $key = config('services.google.places_key');

        return is_string($key) && trim($key) !== '' ? trim($key) : null;
    }

    /**
     * @return array{ok: bool, places?: list<array<string, mixed>>, error?: string, skipped?: bool, retryable?: bool}
     */
    public function searchText(string $query): array
    {
        $key = $this->apiKey();

        if ($key === null) {
            return ['ok' => false, 'skipped' => true, 'error' => 'GOOGLE_PLACES_API_KEY missing'];
        }

        $query = trim($query);

        if ($query === '') {
            return ['ok' => false, 'error' => 'Empty Places query.'];
        }

        try {
            $response = Http::timeout(8)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Goog-Api-Key' => $key,
                    'X-Goog-FieldMask' => implode(',', [
                        'places.id',
                        'places.displayName',
                        'places.formattedAddress',
                        'places.location',
                        'places.internationalPhoneNumber',
                        'places.nationalPhoneNumber',
                        'places.websiteUri',
                        'places.googleMapsUri',
                    ]),
                ])
                ->post(self::ENDPOINT, [
                    'textQuery' => $query,
                    'regionCode' => 'DZ',
                    'languageCode' => 'fr',
                    'pageSize' => 3,
                ]);
        } catch (Throwable) {
            return ['ok' => false, 'error' => 'Google Places request failed.', 'retryable' => true];
        }

        if (! $response->successful()) {
            $status = $response->status();

            return [
                'ok' => false,
                'error' => 'Google Places returned HTTP '.$status.'.',
                'retryable' => $status === 429 || $status >= 500,
            ];
        }

        $places = $response->json('places');

        return [
            'ok' => true,
            'places' => is_array($places) ? array_values($places) : [],
        ];
    }
}
