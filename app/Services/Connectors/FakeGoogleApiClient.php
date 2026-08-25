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

    public function reset(): void
    {
        $this->messages = [];
        $this->events = [];
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
}
