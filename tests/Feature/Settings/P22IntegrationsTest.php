<?php

use App\Enums\WorkspaceRole;
use App\Models\Integration;
use App\Models\Mailbox;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Webhooks\WebhookEndpointManager;
use App\Support\Integrations;
use Inertia\Testing\AssertableInertia as Assert;

function p22ConnectMeta(Workspace $workspace): Integration
{
    return $workspace->integrations()->create([
        'provider' => Integration::PROVIDER_META,
        'status' => 'connected',
        'access_token' => 'stored-token',
        'scopes' => ['pages_show_list', 'ads_management'],
        'meta' => [
            'name' => 'Sara Founder',
            'pages' => [],
            'ad_accounts' => [],
        ],
        'connected_at' => now(),
    ]);
}

function p22HtmlContainsWorkspaceKey(string $html, string $key): bool
{
    return str_contains($html, $key);
}

it('masks the Meta webhook callback and never embeds the workspace key on GET', function () {
    $user = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $manager = app(WebhookEndpointManager::class);
    $endpoint = $manager->forWorkspace($user->workspace, WebhookEndpointManager::PROVIDER_META_LEADS);
    $key = $endpoint->key;

    $response = $this->actingAs($user)->get('/settings/meta');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/meta')
            ->missing('webhook_url')
            ->where('webhook_callback.can_reveal', true)
            ->where('webhook_callback.configured', true)
            ->where('webhook_callback.reveal_url', '/settings/meta/webhook-url')
            ->where(
                'webhook_callback.masked_url',
                fn (mixed $url): bool => is_string($url)
                    && str_contains($url, '/webhooks/meta/leads/••••••••')
                    && ! str_contains($url, $key),
            )
            ->where('status', 'not_connected'));

    expect(p22HtmlContainsWorkspaceKey($response->getContent(), $key))->toBeFalse();
});

it('lets an admin reveal the Meta callback for this workspace only', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $other = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $manager = app(WebhookEndpointManager::class);
    $ownerEndpoint = $manager->forWorkspace($owner->workspace, WebhookEndpointManager::PROVIDER_META_LEADS);
    $otherEndpoint = $manager->forWorkspace($other->workspace, WebhookEndpointManager::PROVIDER_META_LEADS);

    $response = $this->actingAs($owner)->postJson('/settings/meta/webhook-url');

    $response->assertOk();

    $url = $response->json('url');
    $containsOwner = is_string($url) && str_contains($url, '/webhooks/meta/leads/');
    $leaksOther = is_string($url) && str_contains($url, $otherEndpoint->key);

    expect($containsOwner)->toBeTrue()
        ->and($leaksOther)->toBeFalse()
        ->and(is_string($url) && str_contains($url, $ownerEndpoint->key))->toBeTrue();
});

it('forbids members from revealing the Meta webhook callback', function () {
    $member = User::factory()->create(['role' => WorkspaceRole::Member]);

    $this->actingAs($member)
        ->postJson('/settings/meta/webhook-url')
        ->assertForbidden();
});

it('does not let a member HTML page contain another workspace webhook key', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);
    $foreign = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $manager = app(WebhookEndpointManager::class);
    $foreignKey = $manager->forWorkspace($foreign->workspace, WebhookEndpointManager::PROVIDER_META_LEADS)->key;
    $ownKey = $manager->forWorkspace($owner->workspace, WebhookEndpointManager::PROVIDER_META_LEADS)->key;

    $response = $this->actingAs($member)->get('/settings/meta');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('webhook_callback.can_reveal', false));

    $html = $response->getContent();

    expect(p22HtmlContainsWorkspaceKey($html, $foreignKey))->toBeFalse()
        ->and(p22HtmlContainsWorkspaceKey($html, $ownKey))->toBeFalse();
});

it('scopes Meta disconnect to the acting workspace', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $other = User::factory()->create(['role' => WorkspaceRole::Owner]);
    p22ConnectMeta($owner->workspace);
    p22ConnectMeta($other->workspace);

    $this->actingAs($owner)
        ->delete('/settings/apps/meta')
        ->assertRedirect(route('settings.apps', absolute: false));

    expect(Integration::query()
        ->where('workspace_id', $owner->workspace_id)
        ->where('provider', Integration::PROVIDER_META)
        ->exists())->toBeFalse()
        ->and(Integration::query()
            ->where('workspace_id', $other->workspace_id)
            ->where('provider', Integration::PROVIDER_META)
            ->exists())->toBeTrue();
});

it('forbids members from disconnecting Meta', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);
    p22ConnectMeta($owner->workspace);

    $this->actingAs($member)
        ->delete('/settings/apps/meta')
        ->assertForbidden();

    expect(Integration::query()
        ->where('workspace_id', $owner->workspace_id)
        ->where('provider', Integration::PROVIDER_META)
        ->exists())->toBeTrue();
});

it('reports truthful Apps status without collapsing WhatsApp providers', function () {
    $user = User::factory()->create();

    $user->workspace->integrations()->create([
        'provider' => Integration::PROVIDER_WHATSAPP,
        'status' => 'connected',
        'access_token' => 'evolution',
        'meta' => ['display_phone' => '+213555000000', 'state' => 'open'],
        'connected_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/settings/apps')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/apps/index')
            ->where('apps.1.key', 'whatsapp')
            ->where('apps.1.connected', true)
            ->where('apps.1.manage_url', '/settings/whatsapp')
            ->where('apps.1.status', 'connected')
            ->where('apps.2.key', 'whatsapp_business')
            ->where('apps.2.connected', false)
            ->where('apps.2.manage_url', '/settings/whatsapp-business')
            ->where('apps.3.key', 'google')
            ->where('apps.3.connected', false)
            ->where('apps.3.configured', false));
});

it('exposes P23 activation facts without secrets', function () {
    $user = User::factory()->create();
    p22ConnectMeta($user->workspace);
    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
    ]);

    $facts = Integrations::forWorkspace($user->workspace);

    expect($facts['activation']['has_meta_configured'])->toBeTrue()
        ->and($facts['activation']['has_mailbox'])->toBeTrue()
        ->and($facts['activation']['has_configured_integration'])->toBeTrue()
        ->and($facts['smtp']['has_mailbox'])->toBeTrue()
        ->and(array_key_exists('access_token', $facts['meta']))->toBeFalse();

    $this->actingAs($user)
        ->get('/settings/apps')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('integrations.activation.has_meta_configured', true)
            ->where('integrations.activation.has_mailbox', true)
            ->missing('integrations.meta.access_token'));
});

it('masks webhook URLs without inventing last-four fragments', function () {
    $manager = app(WebhookEndpointManager::class);
    $url = 'https://crm.example.test/webhooks/meta/leads/abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz01';

    expect($manager->maskUrl($url))->toBe('https://crm.example.test/webhooks/meta/leads/••••••••');
});

it('keeps API and webhook settings pages deferred', function () {
    $ia = file_get_contents(resource_path('js/lib/settings/ia.ts'));

    expect($ia)->not->toContain('/settings/api')
        ->and($ia)->not->toContain('/settings/webhooks')
        ->and(file_exists(resource_path('js/pages/settings/api.tsx')))->toBeFalse()
        ->and(file_exists(resource_path('js/pages/settings/webhooks.tsx')))->toBeFalse();
});

it('keeps disconnect confirmations honest and secret-safe in source', function () {
    $whatsapp = file_get_contents(resource_path('js/pages/settings/whatsapp.tsx'));
    $business = file_get_contents(resource_path('js/pages/settings/whatsapp-business.tsx'));
    $sms = file_get_contents(resource_path('js/pages/settings/sms.tsx'));
    $meta = file_get_contents(resource_path('js/pages/settings/meta.tsx'));
    $secret = file_get_contents(resource_path('js/components/settings/secret-callback-field.tsx'));

    expect($whatsapp)->toContain('window.confirm')
        ->and($whatsapp)->toContain('Existing inbox messages stay')
        ->and($business)->toContain('Meta OAuth is not disconnected')
        ->and($sms)->toContain('Stored API credentials are deleted')
        ->and($meta)->toContain('SecretCallbackField')
        ->and($meta)->not->toContain('webhook_url')
        ->and($secret)->toContain('Treat this callback as a secret')
        ->and($secret)->toContain('Reveal')
        ->and($secret)->toContain('Copy');
});
