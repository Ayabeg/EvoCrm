<?php

namespace App\Support;

use App\Models\Channel;
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
        $whatsapp = $workspace?->integration(Integration::PROVIDER_WHATSAPP);
        $whatsappBusiness = $workspace?->integration(Integration::PROVIDER_WHATSAPP_BUSINESS);
        $sms = $workspace?->integration(Integration::PROVIDER_SMS);
        $hasMailbox = $workspace
            ? Mailbox::query()->forWorkspace($workspace)->where('enabled', true)->exists()
            : false;
        $hasAnyMailbox = $workspace
            ? Mailbox::query()->forWorkspace($workspace)->exists()
            : false;
        $hasConnectedChannel = $workspace
            ? Channel::query()->forWorkspace($workspace)->where('status', 'connected')->exists()
                || ($whatsapp?->isConnected() ?? false)
                || ($whatsappBusiness?->isConnected() ?? false)
                || ($sms?->isConnected() ?? false)
            : false;
        $hasConfiguredIntegration = ($meta?->isConnected() ?? false)
            || ($whatsapp?->isConnected() ?? false)
            || ($whatsappBusiness?->isConnected() ?? false)
            || ($sms?->isConnected() ?? false)
            || $hasAnyMailbox;

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
                'connected' => $hasAnyMailbox,
                'has_mailbox' => $hasMailbox,
            ],
            'activation' => [
                'has_connected_communication_channel' => $hasConnectedChannel,
                'has_configured_integration' => $hasConfiguredIntegration,
                'has_mailbox' => $hasMailbox,
                'has_meta_configured' => $meta?->isConnected() ?? false,
            ],
        ];
    }
}
