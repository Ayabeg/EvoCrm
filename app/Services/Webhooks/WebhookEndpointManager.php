<?php

namespace App\Services\Webhooks;

use App\Models\WebhookEndpoint;
use App\Models\Workspace;
use Illuminate\Support\Str;

class WebhookEndpointManager
{
    public const PROVIDER_EVOLUTION = 'evolution';

    public const PROVIDER_META_LEADS = 'meta_leads';

    public const PROVIDER_OUTBOUND_BOUNCE = 'outbound_bounce';

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
            self::PROVIDER_OUTBOUND_BOUNCE => 'webhooks.outbound.bounces',
            default => abort(404),
        };

        return route($route, ['webhookKey' => $endpoint->key]);
    }

    public function maskedUrlFor(Workspace $workspace, string $provider): string
    {
        return $this->maskUrl($this->urlFor($workspace, $provider));
    }

    public function maskUrl(string $url): string
    {
        $parts = parse_url($url);

        if (! is_array($parts) || ! isset($parts['scheme'], $parts['host'], $parts['path'])) {
            return $url;
        }

        $path = (string) preg_replace('#(/webhooks/[^/]+/)[^/]+$#', '$1••••••••', $parts['path']);
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return $parts['scheme'].'://'.$parts['host'].$port.$path;
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
            self::PROVIDER_OUTBOUND_BOUNCE,
        ], true), 404);
    }
}
