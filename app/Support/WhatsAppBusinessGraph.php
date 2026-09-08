<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Discover a WhatsApp Business Account + phone number from a Facebook
 * Login user token. Official Graph paths only — not Embedded Signup.
 *
 * @see https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account
 */
class WhatsAppBusinessGraph
{
    /**
     * @return array{
     *     business_id: string,
     *     waba_id: string,
     *     phone_number_id: string,
     *     display_phone_number: string|null,
     *     verified_name: string|null
     * }|null
     */
    public function discover(string $token): ?array
    {
        $businesses = $this->get($token, '/me/businesses', ['fields' => 'id,name']);

        foreach ($businesses as $business) {
            $businessId = (string) ($business['id'] ?? '');

            if ($businessId === '') {
                continue;
            }

            $accounts = $this->get($token, '/'.$businessId.'/owned_whatsapp_business_accounts', [
                'fields' => 'id,name',
            ]);

            foreach ($accounts as $account) {
                $wabaId = (string) ($account['id'] ?? '');

                if ($wabaId === '') {
                    continue;
                }

                $phones = $this->get($token, '/'.$wabaId.'/phone_numbers', [
                    'fields' => 'id,display_phone_number,verified_name',
                ]);

                $phone = $phones[0] ?? null;

                if (! is_array($phone) || ! filled($phone['id'] ?? null)) {
                    continue;
                }

                return [
                    'business_id' => $businessId,
                    'waba_id' => $wabaId,
                    'phone_number_id' => (string) $phone['id'],
                    'display_phone_number' => $phone['display_phone_number'] ?? null,
                    'verified_name' => $phone['verified_name'] ?? ($account['name'] ?? null),
                ];
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $query
     * @return list<array<string, mixed>>
     */
    protected function get(string $token, string $path, array $query = []): array
    {
        try {
            $response = Http::timeout(15)->get($this->graphUrl($path), [
                ...$query,
                'access_token' => $token,
            ]);
        } catch (Throwable $exception) {
            Log::info('WhatsApp Business Graph lookup skipped', [
                'path' => $path,
                'error' => $exception->getMessage(),
            ]);

            return [];
        }

        if (! $response->successful()) {
            return [];
        }

        $data = $response->json('data');

        return is_array($data) ? array_values(array_filter($data, 'is_array')) : [];
    }

    protected function graphUrl(string $path): string
    {
        $version = (string) config('meta.graph_version', config('evolution.meta.graph_version', 'v21.0'));

        return 'https://graph.facebook.com/'.$version.'/'.ltrim($path, '/');
    }
}
