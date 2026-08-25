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
}
