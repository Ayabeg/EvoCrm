<?php

namespace App\Services\Meta;

use App\Models\Integration;
use App\Models\Workspace;

class WorkspaceMetaCredentials
{
    /**
     * @return array{
     *     ok: bool,
     *     token: string|null,
     *     ad_account_id: string|null,
     *     reason: string|null,
     *     integration: Integration|null
     * }
     */
    public function resolve(Workspace $workspace): array
    {
        $integration = $workspace->integration(Integration::PROVIDER_META);

        if (! $integration?->isConnected()) {
            return $this->missing($integration, 'Meta is not connected for this workspace.');
        }

        if ($integration->expires_at?->isPast()) {
            return $this->missing($integration, 'The workspace Meta token has expired. Reconnect Meta.');
        }

        if (! $integration->grants('ads_management')) {
            return $this->missing($integration, 'The workspace Meta connection does not grant ads_management.');
        }

        $accounts = $this->accounts($integration);
        $selected = (string) ($integration->meta['selected_ad_account_id'] ?? '');

        if ($selected === '' && count($accounts) === 1) {
            $selected = $accounts[0]['id'];
        }

        if ($selected === '' || ! in_array($selected, array_column($accounts, 'id'), true)) {
            return $this->missing($integration, 'Select a discovered Meta ad account for this workspace.');
        }

        return [
            'ok' => true,
            'token' => (string) $integration->access_token,
            'ad_account_id' => $selected,
            'reason' => null,
            'integration' => $integration,
        ];
    }

    /**
     * @return array{connected: bool, ad_account_id_set: bool, reason: string|null}
     */
    public function status(Workspace $workspace): array
    {
        $resolved = $this->resolve($workspace);

        return [
            'connected' => $resolved['ok'],
            'ad_account_id_set' => filled($resolved['ad_account_id']),
            'reason' => $resolved['reason'],
        ];
    }

    public function selectAdAccount(Workspace $workspace, string $accountId): Integration
    {
        $integration = $workspace->integration(Integration::PROVIDER_META);
        abort_unless($integration?->isConnected(), 422);

        $accounts = $this->accounts($integration);
        abort_unless(in_array($accountId, array_column($accounts, 'id'), true), 422);

        $integration->forceFill([
            'meta' => [
                ...($integration->meta ?? []),
                'selected_ad_account_id' => $accountId,
            ],
        ])->save();

        return $integration->refresh();
    }

    /**
     * @return list<array{id: string, name: string}>
     */
    public function accounts(?Integration $integration): array
    {
        return collect($integration?->meta['ad_accounts'] ?? [])
            ->filter(fn (mixed $account): bool => is_array($account) && filled($account['id'] ?? null))
            ->map(fn (array $account): array => [
                'id' => (string) $account['id'],
                'name' => (string) ($account['name'] ?? $account['id']),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     ok: false,
     *     token: null,
     *     ad_account_id: null,
     *     reason: string,
     *     integration: Integration|null
     * }
     */
    private function missing(?Integration $integration, string $reason): array
    {
        return [
            'ok' => false,
            'token' => null,
            'ad_account_id' => null,
            'reason' => $reason,
            'integration' => $integration,
        ];
    }
}
