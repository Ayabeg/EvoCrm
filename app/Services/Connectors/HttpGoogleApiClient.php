<?php

namespace App\Services\Connectors;

use App\Models\Integration;
use Illuminate\Support\Facades\Http;

class HttpGoogleApiClient implements GoogleApiClient
{
    public function listMessages(Integration $integration, ?string $cursor = null): array
    {
        if (! $integration->isConnected()) {
            return ['items' => [], 'cursor' => $cursor, 'expired' => false, 'revoked' => true];
        }

        $response = Http::withToken((string) $integration->access_token)
            ->acceptJson()
            ->get('https://gmail.googleapis.com/gmail/v1/users/me/messages', array_filter([
                'pageToken' => $cursor,
                'maxResults' => 50,
            ]));

        if ($response->status() === 401) {
            return ['items' => [], 'cursor' => $cursor, 'expired' => false, 'revoked' => true];
        }

        if ($response->status() === 410) {
            return ['items' => [], 'cursor' => null, 'expired' => true];
        }

        $payload = $response->json() ?? [];

        return [
            'items' => collect($payload['messages'] ?? [])->map(fn (array $row) => [
                'id' => $row['id'] ?? null,
                'thread_id' => $row['threadId'] ?? null,
                'subject' => $row['subject'] ?? 'Email',
                'snippet' => $row['snippet'] ?? null,
                'from' => $row['from'] ?? null,
                'to' => $row['to'] ?? null,
                'sent_at' => $row['internalDate'] ?? null,
            ])->filter(fn (array $row) => filled($row['id']))->values()->all(),
            'cursor' => $payload['nextPageToken'] ?? null,
            'expired' => false,
        ];
    }

    public function listEvents(Integration $integration, ?string $cursor = null): array
    {
        if (! $integration->isConnected()) {
            return ['items' => [], 'cursor' => $cursor, 'expired' => false, 'revoked' => true];
        }

        $response = Http::withToken((string) $integration->access_token)
            ->acceptJson()
            ->get('https://www.googleapis.com/calendar/v3/calendars/primary/events', array_filter([
                'syncToken' => $cursor,
                'maxResults' => 50,
                'singleEvents' => 'true',
            ]));

        if ($response->status() === 401) {
            return ['items' => [], 'cursor' => $cursor, 'expired' => false, 'revoked' => true];
        }

        if ($response->status() === 410) {
            return ['items' => [], 'cursor' => null, 'expired' => true];
        }

        $payload = $response->json() ?? [];

        return [
            'items' => collect($payload['items'] ?? [])->map(fn (array $row) => [
                'id' => $row['id'] ?? null,
                'subject' => $row['summary'] ?? 'Meeting',
                'body' => $row['description'] ?? null,
                'status' => $row['status'] ?? 'confirmed',
                'starts_at' => $row['start']['dateTime'] ?? $row['start']['date'] ?? null,
                'attendees' => collect($row['attendees'] ?? [])->pluck('email')->filter()->values()->all(),
            ])->filter(fn (array $row) => filled($row['id']))->values()->all(),
            'cursor' => $payload['nextSyncToken'] ?? $payload['nextPageToken'] ?? null,
            'expired' => false,
        ];
    }

    public function refresh(Integration $integration): bool
    {
        if (blank($integration->refresh_token)) {
            return false;
        }

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $integration->refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if (! $response->successful()) {
            $integration->forceFill([
                'status' => 'revoked',
                'access_token' => null,
            ])->save();

            return false;
        }

        $payload = $response->json() ?? [];
        $integration->forceFill([
            'access_token' => $payload['access_token'] ?? $integration->access_token,
            'expires_at' => isset($payload['expires_in'])
                ? now()->addSeconds((int) $payload['expires_in'])
                : $integration->expires_at,
            'status' => 'connected',
        ])->save();

        return true;
    }
}
