<?php

use App\Enums\ConnectorProvider;
use App\Enums\ConnectorStatus;
use App\Models\Connector;
use App\Models\Integration;
use App\Models\User;
use Illuminate\Support\Facades\Http;

it('exposes the official desk connect panel on the native inbox empty state', function () {
    config()->set('evosales.inbox_url', '');

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => null]);

    $this->actingAs($user)
        ->get('/inbox')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('embedState', 'no-url')
            ->has('officialConnectors', 3)
            ->where('officialConnectors.0.provider', 'whatsapp_cloud')
            ->where('officialConnectors.1.provider', 'instagram')
            ->where('officialConnectors.2.provider', 'facebook_messenger')
            ->where('officialConnectors.0.status', 'not_connected')
        );
});

it('keeps the official connect panel when EvoDesk is framed', function () {
    Http::fake(['*' => Http::response('', 200)]);

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    $this->actingAs($user)
        ->get('/inbox')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('embedUrl', 'https://desk.evotechly.com/')
            ->has('officialConnectors', 3)
        );
});

it('saves a WhatsApp Cloud row as needs official token without Evolution Cloud env', function () {
    config()->set('evolution.base_url', null);
    config()->set('evolution.api_key', null);
    config()->set('evolution.meta.token', null);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/inbox')
        ->post('/desk/connectors', ['provider' => 'whatsapp_cloud'])
        ->assertRedirect();

    $connector = Connector::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', ConnectorProvider::WhatsAppCloud)
        ->sole();

    expect($connector->intent)->toBe('desk_whatsapp_cloud')
        ->and($connector->status)->toBe(ConnectorStatus::NeedsToken)
        ->and($connector->config['reason'])->toContain('Needs official token')
        ->and($connector->config['reason'])->toContain('never Baileys');
});

it('marks WhatsApp Cloud connected only when Evolution Cloud credentials already exist', function () {
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    config()->set('evolution.meta.token', 'wa-token');
    config()->set('evolution.meta.phone_number_id', '123');
    config()->set('evolution.meta.waba_id', 'waba-1');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/inbox')
        ->post('/desk/connectors', ['provider' => 'whatsapp_cloud'])
        ->assertRedirect();

    $connector = Connector::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', ConnectorProvider::WhatsAppCloud)
        ->sole();

    expect($connector->status)->toBe(ConnectorStatus::Connected)
        ->and($connector->connected_at)->not->toBeNull();
});

it('saves Instagram and Messenger as needs official token without Embedded Signup', function () {
    config()->set('meta.app_id', null);
    config()->set('meta.app_secret', null);

    $user = User::factory()->create();

    foreach (['instagram' => 'desk_instagram', 'facebook_messenger' => 'desk_messenger'] as $provider => $intent) {
        $this->actingAs($user)
            ->from('/inbox')
            ->post('/desk/connectors', ['provider' => $provider])
            ->assertRedirect();

        $connector = Connector::query()
            ->where('workspace_id', $user->workspace_id)
            ->where('provider', $provider)
            ->sole();

        expect($connector->intent)->toBe($intent)
            ->and($connector->status)->toBe(ConnectorStatus::NeedsToken)
            ->and($connector->config['reason'])->toContain('Needs official token')
            ->and($connector->config['reason'])->toContain('Embedded Signup');
    }
});

it('marks Messenger connected from a stored Meta Page grant without calling Graph', function () {
    Http::fake();

    config()->set('meta.app_id', 'meta-app-id');
    config()->set('meta.app_secret', 'meta-app-secret');

    $user = User::factory()->create();

    Integration::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => 'meta',
        'status' => 'connected',
        'access_token' => 'stored-token',
        'scopes' => ['pages_show_list'],
        'connected_at' => now(),
    ]);

    $this->actingAs($user)
        ->from('/inbox')
        ->post('/desk/connectors', ['provider' => 'facebook_messenger'])
        ->assertRedirect();

    expect(Connector::query()->where('provider', ConnectorProvider::FacebookMessenger)->sole()->status)
        ->toBe(ConnectorStatus::Connected);

    Http::assertNothingSent();
});

it('refuses unofficial WhatsApp providers on the desk connect path', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/desk/connectors', ['provider' => 'whatsapp-baileys'])
        ->assertStatus(422);

    $this->actingAs($user)
        ->post('/desk/connectors', ['provider' => 'telegram'])
        ->assertSessionHasErrors('provider');

    expect(Connector::query()->count())->toBe(0);
});

it('never offers Baileys or unofficial WhatsApp on the desk page source', function () {
    $inbox = file_get_contents(resource_path('js/pages/desk/inbox.tsx'));
    $panel = file_get_contents(resource_path('js/components/desk/official-connect-panel.tsx'));

    expect($inbox.$panel)
        ->toContain('officialConnectors')
        ->toContain('WhatsApp Cloud')
        ->toContain('No Baileys')
        ->not->toContain('WHATSAPP-BAILEYS')
        ->not->toContain('connectWithQr');
});
