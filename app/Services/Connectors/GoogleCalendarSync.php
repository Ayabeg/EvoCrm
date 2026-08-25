<?php

namespace App\Services\Connectors;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\GoogleSyncState;
use App\Models\Integration;
use App\Models\Workspace;
use App\Services\Crm\ActivityRecorder;

class GoogleCalendarSync
{
    public function __construct(
        private GoogleApiClient $google,
        private ActivityRecorder $activities,
    ) {}

    /**
     * @return array{imported: int, updated: int, cancelled: int, status: string}
     */
    public function sync(Workspace $workspace): array
    {
        $state = $this->state($workspace);

        if ($state->isPaused()) {
            return ['imported' => 0, 'updated' => 0, 'cancelled' => 0, 'status' => GoogleSyncState::STATUS_PAUSED];
        }

        $integration = $workspace->integration(Integration::PROVIDER_GOOGLE_CALENDAR);

        if (! $integration instanceof Integration || ! $this->ensureToken($integration, $state)) {
            return ['imported' => 0, 'updated' => 0, 'cancelled' => 0, 'status' => $state->fresh()->status];
        }

        $page = $this->google->listEvents($integration, $state->cursor);

        if (! empty($page['revoked'])) {
            $this->markRevoked($integration, $state);

            return ['imported' => 0, 'updated' => 0, 'cancelled' => 0, 'status' => GoogleSyncState::STATUS_ERROR];
        }

        if (! empty($page['expired'])) {
            $state->forceFill(['cursor' => null, 'last_error' => null])->save();
            $page = $this->google->listEvents($integration, null);
        }

        $imported = 0;
        $updated = 0;
        $cancelled = 0;

        foreach ($page['items'] ?? [] as $item) {
            $eventId = (string) ($item['id'] ?? '');

            if ($eventId === '') {
                continue;
            }

            $existing = Activity::query()
                ->where('workspace_id', $workspace->id)
                ->where('provider', Integration::PROVIDER_GOOGLE_CALENDAR)
                ->where('provider_event_id', $eventId)
                ->first();

            $contact = $this->matchContact($workspace, $item);
            $deal = $contact ? $this->matchDeal($contact) : null;
            $cancelledEvent = strtolower((string) ($item['status'] ?? '')) === 'cancelled';

            if ($existing instanceof Activity) {
                $existing->forceFill([
                    'subject' => $item['subject'] ?? $existing->subject,
                    'body' => $item['body'] ?? $existing->body,
                    'due_at' => $item['starts_at'] ?? $existing->due_at,
                    'done' => $cancelledEvent,
                    'contact_id' => $contact?->id ?? $existing->contact_id,
                    'deal_id' => $deal?->id ?? $existing->deal_id,
                    'meta' => array_merge($existing->meta ?? [], [
                        'status' => $item['status'] ?? null,
                        'attendees' => $item['attendees'] ?? [],
                    ]),
                ])->save();

                $cancelledEvent ? $cancelled++ : $updated++;

                continue;
            }

            $this->activities->record($workspace, [
                'type' => 'meeting',
                'provider' => Integration::PROVIDER_GOOGLE_CALENDAR,
                'provider_event_id' => $eventId,
                'subject' => $item['subject'] ?? 'Meeting',
                'body' => $item['body'] ?? null,
                'due_at' => $item['starts_at'] ?? null,
                'done' => $cancelledEvent,
                'contact_id' => $contact?->id,
                'deal_id' => $deal?->id,
                'company_id' => $contact?->company_id,
                'meta' => [
                    'provider' => Integration::PROVIDER_GOOGLE_CALENDAR,
                    'provider_event_id' => $eventId,
                    'status' => $item['status'] ?? 'confirmed',
                    'attendees' => $item['attendees'] ?? [],
                ],
            ]);

            $cancelledEvent ? $cancelled++ : $imported++;
        }

        $state->forceFill([
            'status' => GoogleSyncState::STATUS_IDLE,
            'cursor' => $page['cursor'] ?? $state->cursor,
            'last_synced_at' => now(),
            'last_error' => null,
        ])->save();

        return [
            'imported' => $imported,
            'updated' => $updated,
            'cancelled' => $cancelled,
            'status' => GoogleSyncState::STATUS_IDLE,
        ];
    }

    public function start(Workspace $workspace): GoogleSyncState
    {
        $state = $this->state($workspace);
        $state->forceFill([
            'status' => GoogleSyncState::STATUS_IDLE,
            'last_error' => null,
        ])->save();

        return $state;
    }

    public function pause(Workspace $workspace): GoogleSyncState
    {
        $state = $this->state($workspace);
        $state->forceFill(['status' => GoogleSyncState::STATUS_PAUSED])->save();

        return $state;
    }

    public function state(Workspace $workspace): GoogleSyncState
    {
        return GoogleSyncState::query()->firstOrCreate(
            [
                'workspace_id' => $workspace->id,
                'provider' => Integration::PROVIDER_GOOGLE_CALENDAR,
            ],
            ['status' => GoogleSyncState::STATUS_IDLE],
        );
    }

    private function ensureToken(Integration $integration, GoogleSyncState $state): bool
    {
        if ($integration->isConnected() && (! $integration->expires_at || $integration->expires_at->isFuture())) {
            return true;
        }

        if ($this->google->refresh($integration->fresh() ?? $integration)) {
            return true;
        }

        $this->markRevoked($integration, $state);

        return false;
    }

    private function markRevoked(Integration $integration, GoogleSyncState $state): void
    {
        $integration->forceFill([
            'status' => 'revoked',
            'access_token' => null,
        ])->save();

        $state->forceFill([
            'status' => GoogleSyncState::STATUS_ERROR,
            'last_error' => 'Google token was revoked or could not be refreshed.',
        ])->save();
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function matchContact(Workspace $workspace, array $item): ?Contact
    {
        $emails = collect($item['attendees'] ?? [])
            ->filter(fn ($value) => is_string($value) && $value !== '')
            ->map(fn (string $value) => strtolower(trim($value)))
            ->unique()
            ->values();

        if ($emails->isEmpty()) {
            return null;
        }

        $matches = Contact::query()
            ->forWorkspace($workspace)
            ->whereIn('email', $emails->all())
            ->orderBy('id')
            ->get();

        return $matches->count() === 1 ? $matches->first() : $matches->first();
    }

    private function matchDeal(Contact $contact): ?Deal
    {
        $deals = Deal::query()
            ->where('contact_id', $contact->id)
            ->where('workspace_id', $contact->workspace_id)
            ->with('stage')
            ->latest('id')
            ->get();

        $open = $deals->filter(fn (Deal $deal) => $deal->stage && ! $deal->stage->is_won && ! $deal->stage->is_lost);

        if ($open->count() === 1) {
            return $open->first();
        }

        return $deals->count() === 1 ? $deals->first() : null;
    }
}
