<?php

namespace App\Services\Connectors;

use App\Models\Integration;

class FakeGoogleApiClient implements GoogleApiClient
{
    /** @var list<array<string, mixed>> */
    public array $messages = [];

    /** @var list<array<string, mixed>> */
    public array $events = [];

    public bool $revoked = false;

    public bool $cursorExpired = false;

    public bool $refreshed = false;

    /** @var list<array<string, mixed>> */
    public array $createdEvents = [];

    public function reset(): void
    {
        $this->messages = [];
        $this->events = [];
        $this->createdEvents = [];
        $this->revoked = false;
        $this->cursorExpired = false;
        $this->refreshed = false;
    }

    public function listMessages(Integration $integration, ?string $cursor = null): array
    {
        if ($this->revoked || ! $integration->isConnected()) {
            return ['items' => [], 'cursor' => $cursor, 'expired' => false, 'revoked' => true];
        }

        if ($this->cursorExpired && filled($cursor)) {
            return ['items' => [], 'cursor' => null, 'expired' => true];
        }

        return [
            'items' => $this->messages,
            'cursor' => 'mail-cursor-2',
            'expired' => false,
        ];
    }

    public function listEvents(Integration $integration, ?string $cursor = null): array
    {
        if ($this->revoked || ! $integration->isConnected()) {
            return ['items' => [], 'cursor' => $cursor, 'expired' => false, 'revoked' => true];
        }

        if ($this->cursorExpired && filled($cursor)) {
            return ['items' => [], 'cursor' => null, 'expired' => true];
        }

        return [
            'items' => $this->events,
            'cursor' => 'cal-cursor-2',
            'expired' => false,
        ];
    }

    public function refresh(Integration $integration): bool
    {
        if ($this->revoked) {
            $integration->forceFill([
                'status' => 'revoked',
                'access_token' => null,
            ])->save();

            return false;
        }

        $this->refreshed = true;
        $integration->forceFill([
            'access_token' => 'refreshed-token',
            'expires_at' => now()->addHour(),
            'status' => 'connected',
        ])->save();

        return true;
    }

    public function busyTimes(Integration $integration, \DateTimeInterface $from, \DateTimeInterface $to): array
    {
        if ($this->revoked || ! $integration->isConnected()) {
            return [];
        }

        $fromAt = \Illuminate\Support\Carbon::parse($from);
        $toAt = \Illuminate\Support\Carbon::parse($to);

        return collect($this->events)
            ->map(function (array $event) {
                $start = $event['starts_at'] ?? null;
                if (! $start) {
                    return null;
                }

                return [
                    'starts_at' => $start,
                    'ends_at' => $event['ends_at'] ?? \Illuminate\Support\Carbon::parse($start)->addHour()->toIso8601String(),
                ];
            })
            ->filter()
            ->filter(function (array $row) use ($fromAt, $toAt) {
                $start = \Illuminate\Support\Carbon::parse($row['starts_at']);
                $end = \Illuminate\Support\Carbon::parse($row['ends_at']);

                return $start->lt($toAt) && $end->gt($fromAt);
            })
            ->values()
            ->all();
    }

    public function createEvent(Integration $integration, array $event): array
    {
        if ($this->revoked || ! $integration->isConnected()) {
            return ['id' => null, 'revoked' => true];
        }

        $id = 'evt-book-'.(count($this->createdEvents) + 1);
        $row = $event + ['id' => $id, 'status' => 'confirmed'];
        $this->createdEvents[] = $row;
        $this->events[] = $row;

        return ['id' => $id];
    }
}
