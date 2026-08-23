<?php

namespace App\Support;

use App\Models\Integration;
use App\Models\Mailbox;
use App\Models\Workspace;

class Integrations
{
    /**
     * Lightweight connection state shared with every Inertia page so the
     * rail can show channel chips (Kommo-style) only for connections that
     * actually exist.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function forWorkspace(?Workspace $workspace): array
    {
        $meta = $workspace?->integration(Integration::PROVIDER_META);

        return [
            'meta' => [
                'configured' => MetaAuth::enabled(),
                'connected' => $meta?->isConnected() ?? false,
                'scopes' => $meta?->scopes ?? [],
            ],
            'google' => [
                'connected' => GoogleAuth::enabled(),
            ],
            'smtp' => [
                'connected' => $workspace
                    ? Mailbox::query()->forWorkspace($workspace)->exists()
                    : false,
            ],
        ];
    }
}
