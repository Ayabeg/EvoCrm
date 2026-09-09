<?php

namespace App\Services\Connectors;

use App\Models\Integration;

interface GoogleApiClient
{
    /**
     * @return array{items: list<array<string, mixed>>, cursor: string|null, expired: bool}
     */
    public function listMessages(Integration $integration, ?string $cursor = null): array;

    /**
     * @return array{items: list<array<string, mixed>>, cursor: string|null, expired: bool}
     */
    public function listEvents(Integration $integration, ?string $cursor = null): array;

    public function refresh(Integration $integration): bool;

    /**
     * @return list<array{starts_at: string, ends_at: string}>
     */
    public function busyTimes(Integration $integration, \DateTimeInterface $from, \DateTimeInterface $to): array;

    /**
     * @param  array{subject: string, body?: string|null, starts_at: string, ends_at: string, timezone?: string, location?: string|null, attendees?: list<string>}  $event
     * @return array{id: string|null, revoked?: bool}
     */
    public function createEvent(Integration $integration, array $event): array;
}
