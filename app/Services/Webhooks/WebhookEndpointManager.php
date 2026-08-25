<?php

namespace App\Services\Webhooks;

use App\Models\WebhookEndpoint;
use App\Models\Workspace;
use Illuminate\Support\Str;

class WebhookEndpointManager
{
    public const PROVIDER_EVOLUTION = 'evolution';

    public const PROVIDER_META_LEADS = 'meta_leads';

    public function forWorkspace(Workspace $workspace, string $provider): WebhookEndpoint
    {
        $this->assertProvider($provider);

        $endpoint = WebhookEndpoint::query()
            ->where('workspace_id', $workspace->id)
            ->where('provider', $provider)
            ->first();

        if ($endpoint) {
            return $endpoint;
        }

        $key = Str::random(64);

        return WebhookEndpoint::query()->create([
            'workspace_id' => $workspace->id,
            'provider' => $provider,
            'key_hash' => hash('sha256', $key),
            'key' => $key,
            'active' => true,
        ]);
    }

    public function resolve(string $provider, string $key): WebhookEndpoint
    {
        $this->assertProvider($provider);

        $matches = WebhookEndpoint::query()
            ->with('workspace')
            ->where('provider', $provider)
            ->where('key_hash', hash('sha256', $key))
            ->where('active', true)
            ->limit(2)
            ->get();

        abort_unless($matches->count() === 1, 404);

        return $matches->firstOrFail();
    }

    public function urlFor(Workspace $workspace, string $provider): string
    {
        $endpoint = $this->forWorkspace($workspace, $provider);
        $route = match ($provider) {
            self::PROVIDER_EVOLUTION => 'webhooks.evolution',
            self::PROVIDER_META_LEADS => 'webhooks.meta.leads',
        };

        return route($route, ['webhookKey' => $endpoint->key]);
    }

    public function markReceived(WebhookEndpoint $endpoint, ?string $event): void
    {
        $endpoint->forceFill([
            'last_received_at' => now(),
            'last_event' => filled($event) ? Str::limit($event, 255, '') : null,
        ])->save();
    }

    private function assertProvider(string $provider): void
    {
        abort_unless(in_array($provider, [
            self::PROVIDER_EVOLUTION,
            self::PROVIDER_META_LEADS,
        ], true), 404);
    }
}
