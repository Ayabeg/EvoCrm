<?php

use App\Enums\ChannelType;
use App\Enums\ConnectorProvider;
use App\Enums\ConnectorStatus;
use App\Exceptions\UnofficialWhatsAppRefused;
use App\Models\Channel;
use App\Models\Connector;
use App\Models\Integration;
use App\Models\Message;
use App\Models\User;
use App\Services\Evolution\EvolutionCloudService;
use App\Services\Evolution\EvolutionWebhookProcessor;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as MetaUser;

function enableEvolution(): void
{
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
}

function fakeEvolutionWhatsApp(): void
{
    Http::fake([
        'https://evolution.example.test/instance/create' => Http::response([
            'instance' => [
                'instanceName' => 'evo-ws-wa',
                'integration' => 'WHATSAPP-BAILEYS',
                'status' => 'connecting',
            ],
            'hash' => 'inst-hash',
            'qrcode' => [
                'base64' => 'data:image/png;base64,AAAQR',
                'code' => '2@abc',
                'pairingCode' => null,
            ],
        ], 201),
        'https://evolution.example.test/instance/connect/*' => Http::response([
            'base64' => 'data:image/png;base64,BBBQR',
            'code' => '2@fresh',
        ], 200),
        'https://evolution.example.test/instance/connectionState/*' => Http::response([
            'instance' => [
                'instanceName' => 'evo-ws-wa',
                'state' => 'connecting',
            ],
        ], 200),
        'https://evolution.example.test/webhook/set/*' => Http::response(['ok' => true], 200),
        'https://evolution.example.test/instance/logout/*' => Http::response(['ok' => true], 200),
        'https://evolution.example.test/instance/delete/*' => Http::response(['ok' => true], 200),
        'https://evolution.example.test/instance/fetchInstances*' => Http::response([
            ['name' => 'evo-ws-wa', 'connectionStatus' => 'open'],
        ], 200),
    ]);
}

it('creates a native Evolution WhatsApp instance with Baileys and a QR', function () {
    enableEvolution();
    fakeEvolutionWhatsApp();

    $workspace = User::factory()->create()->workspace;
    $service = app(EvolutionCloudService::class);

    $result = $service->createWhatsAppInstance($workspace);

    expect($result['ok'])->toBeTrue();

    Http::assertSent(function ($request) use ($workspace) {
        return $request->url() === 'https://evolution.example.test/instance/create'
            && $request['integration'] === 'WHATSAPP-BAILEYS'
            && $request['qrcode'] === true
            && $request['instanceName'] === 'evo-ws'.$workspace->id.'-wa';
    });
});

it('creates a native Evolution WhatsApp Business instance without a QR', function () {
    enableEvolution();
    fakeEvolutionWhatsApp();

    $workspace = User::factory()->create()->workspace;
    $service = app(EvolutionCloudService::class);

    $result = $service->createBusinessInstance($workspace, [
        'token' => 'meta-user-token',
        'number' => 'pn-1',
        'businessId' => 'waba-1',
    ]);

    expect($result['ok'])->toBeTrue();

    Http::assertSent(function ($request) use ($workspace) {
        return $request->url() === 'https://evolution.example.test/instance/create'
            && $request['integration'] === 'WHATSAPP-BUSINESS'
            && $request['qrcode'] === false
            && $request['token'] === 'meta-user-token'
            && $request['number'] === 'pn-1'
            && $request['businessId'] === 'waba-1'
            && $request['instanceName'] === 'evo-ws'.$workspace->id.'-waba';
    });
});

it('still refuses OpenWA and linked-device takeovers', function () {
    $service = app(EvolutionCloudService::class);

    expect(fn () => $service->createInstance(['integration' => 'OPENWA']))
        ->toThrow(UnofficialWhatsAppRefused::class);

    expect(fn () => $service->refuseUnofficial('linked-device'))
        ->toThrow(UnofficialWhatsAppRefused::class);
});

it('lists WhatsApp and WhatsApp Business on Apps without exposing Evolution keys', function () {
    $this->actingAs(User::factory()->create())
        ->get('/settings/apps')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/apps/index')
            ->has('apps', 5)
            ->where('apps.1.key', 'whatsapp')
            ->where('apps.1.connect_url', '/auth/meta?popup=1')
            ->where('apps.1.popup', true)
            ->where('apps.2.key', 'whatsapp_business')
            ->where('apps.2.connect_url', '/auth/meta?popup=1')
            ->where('apps.2.popup', true)
        )
        ->assertDontSee('EVOLUTION_API_KEY')
        ->assertDontSee('EVOLUTION_BASE_URL')
        ->assertDontSee('WA_BUSINESS_TOKEN')
        ->assertDontSee('WA_BUSINESS_PHONE_NUMBER_ID')
        ->assertDontSee('WA_BUSINESS_WABA_ID');
});

it('lets a paid client start WhatsApp QR connect without typing an API key', function () {
    enableEvolution();
    fakeEvolutionWhatsApp();

    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/settings/whatsapp')
        ->post('/settings/whatsapp/connect')
        ->assertRedirect();

    $integration = Integration::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', Integration::PROVIDER_WHATSAPP)
        ->sole();

    expect($integration->status)->toBe('connecting')
        ->and($integration->meta['instance'])->toBe('evo-ws'.$user->workspace_id.'-wa')
        ->and($integration->meta['integration'])->toBe('WHATSAPP-BAILEYS');

    $this->actingAs($user)
        ->get('/settings/whatsapp')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/whatsapp')
            ->where('channel.connected', false)
            ->where('channel.qr.base64', 'data:image/png;base64,AAAQR')
        )
        ->assertDontSee('EVOLUTION_API_KEY')
        ->assertDontSee('WA_BUSINESS_');
});

it('hides platform keys when Evolution is not ready yet', function () {
    config()->set('evolution.base_url', null);
    config()->set('evolution.api_key', null);

    $this->actingAs(User::factory()->create())
        ->get('/settings/whatsapp')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/whatsapp')
            ->where('channel.available', false)
        )
        ->assertDontSee('EVOLUTION_BASE_URL')
        ->assertDontSee('EVOLUTION_API_KEY')
        ->assertSee('Evotechly is enabling');
});

it('connects WhatsApp Business from a stored Facebook login and Graph WABA', function () {
    enableEvolution();
    config()->set('meta.app_id', 'meta-app-id');
    config()->set('meta.app_secret', 'meta-app-secret');
    config()->set('meta.graph_version', 'v21.0');

    Http::fake(function ($request) {
        $url = $request->url();

        if (str_contains($url, 'evolution.example.test/instance/create')) {
            return Http::response([
                'instance' => [
                    'instanceName' => 'evo-ws-waba',
                    'integration' => 'WHATSAPP-BUSINESS',
                    'status' => 'open',
                ],
            ], 201);
        }

        if (str_contains($url, 'evolution.example.test/webhook/set')) {
            return Http::response(['ok' => true], 200);
        }

        if (str_contains($url, 'graph.facebook.com') && str_contains($url, '/me/businesses')) {
            return Http::response(['data' => [['id' => 'biz-1', 'name' => 'Acme']]], 200);
        }

        if (str_contains($url, 'graph.facebook.com') && str_contains($url, 'owned_whatsapp_business_accounts')) {
            return Http::response(['data' => [['id' => 'waba-1', 'name' => 'Acme WA']]], 200);
        }

        if (str_contains($url, 'graph.facebook.com') && str_contains($url, '/phone_numbers')) {
            return Http::response([
                'data' => [[
                    'id' => 'pn-1',
                    'display_phone_number' => '+213 555 000 111',
                    'verified_name' => 'Acme',
                ]],
            ], 200);
        }

        return Http::response(['ok' => true], 200);
    });

    $user = User::factory()->create();

    Integration::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => Integration::PROVIDER_META,
        'status' => 'connected',
        'access_token' => 'stored-meta-token',
        'scopes' => ['whatsapp_business_management', 'whatsapp_business_messaging'],
        'connected_at' => now(),
    ]);

    $this->actingAs($user)
        ->from('/settings/whatsapp-business')
        ->post('/settings/whatsapp-business/connect')
        ->assertRedirect();

    $integration = Integration::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', Integration::PROVIDER_WHATSAPP_BUSINESS)
        ->sole();

    expect($integration->isConnected())->toBeTrue()
        ->and($integration->meta['waba_id'])->toBe('waba-1')
        ->and($integration->meta['phone_number_id'])->toBe('pn-1')
        ->and($integration->meta['integration'])->toBe('WHATSAPP-BUSINESS');

    Http::assertSent(function ($request) {
        return str_contains($request->url(), '/instance/create')
            && $request['integration'] === 'WHATSAPP-BUSINESS'
            && $request['token'] === 'stored-meta-token'
            && $request['number'] === 'pn-1'
            && $request['businessId'] === 'waba-1';
    });
});

it('provisions WhatsApp Business automatically after Facebook OAuth', function () {
    enableEvolution();
    config()->set('services.meta.client_id', 'meta-app-id');
    config()->set('services.meta.client_secret', 'meta-app-secret');
    config()->set('meta.app_id', 'meta-app-id');
    config()->set('meta.app_secret', 'meta-app-secret');
    config()->set('meta.graph_version', 'v21.0');

    $metaUser = new MetaUser;
    $metaUser->setRaw([
        'id' => 'fb-user-wa',
        'name' => 'Amine Owner',
        'email' => 'amine@evotechly.com',
    ])->map([
        'id' => 'fb-user-wa',
        'name' => 'Amine Owner',
        'email' => 'amine@evotechly.com',
    ]);
    $metaUser->setToken('short-lived-token');
    $metaUser->setExpiresIn(3600);

    $provider = Mockery::mock();
    $provider->shouldReceive('usingGraphVersion')->once()->andReturnSelf();
    $provider->shouldReceive('user')->once()->andReturn($metaUser);
    Socialite::shouldReceive('driver')->once()->with('meta')->andReturn($provider);

    Http::fake(function ($request) {
        $url = $request->url();

        if (str_contains($url, 'oauth/access_token')) {
            return Http::response(['access_token' => 'long-lived-token', 'expires_in' => 5000], 200);
        }

        if (str_contains($url, '/me/permissions')) {
            return Http::response([
                'data' => [
                    ['permission' => 'whatsapp_business_management', 'status' => 'granted'],
                    ['permission' => 'whatsapp_business_messaging', 'status' => 'granted'],
                ],
            ], 200);
        }

        if (str_contains($url, '/me/businesses')) {
            return Http::response(['data' => [['id' => 'biz-1', 'name' => 'Acme']]], 200);
        }

        if (str_contains($url, 'owned_whatsapp_business_accounts')) {
            return Http::response(['data' => [['id' => 'waba-1', 'name' => 'Acme WA']]], 200);
        }

        if (str_contains($url, '/phone_numbers')) {
            return Http::response([
                'data' => [[
                    'id' => 'pn-1',
                    'display_phone_number' => '+213 555 000 111',
                    'verified_name' => 'Acme',
                ]],
            ], 200);
        }

        if (str_contains($url, 'evolution.example.test/instance/create')) {
            return Http::response([
                'instance' => [
                    'instanceName' => 'evo-ws-waba',
                    'integration' => 'WHATSAPP-BUSINESS',
                    'status' => 'open',
                ],
            ], 201);
        }

        if (str_contains($url, 'evolution.example.test/webhook/set')) {
            return Http::response(['ok' => true], 200);
        }

        return Http::response(['data' => []], 200);
    });

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/auth/meta/callback')
        ->assertRedirect();

    $business = Integration::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', Integration::PROVIDER_WHATSAPP_BUSINESS)
        ->sole();

    expect($business->isConnected())->toBeTrue()
        ->and($business->meta['waba_id'])->toBe('waba-1')
        ->and($business->meta['phone_number_id'])->toBe('pn-1');
});

it('keeps Facebook OAuth successful when Evolution is not ready yet', function () {
    config()->set('evolution.base_url', null);
    config()->set('evolution.api_key', null);
    config()->set('services.meta.client_id', 'meta-app-id');
    config()->set('services.meta.client_secret', 'meta-app-secret');
    config()->set('meta.app_id', 'meta-app-id');
    config()->set('meta.app_secret', 'meta-app-secret');

    $metaUser = new MetaUser;
    $metaUser->setRaw(['id' => 'fb-user-2', 'name' => 'Sara', 'email' => 'sara@evotechly.com'])
        ->map(['id' => 'fb-user-2', 'name' => 'Sara', 'email' => 'sara@evotechly.com']);
    $metaUser->setToken('short-lived-token');
    $metaUser->setExpiresIn(3600);

    $provider = Mockery::mock();
    $provider->shouldReceive('usingGraphVersion')->once()->andReturnSelf();
    $provider->shouldReceive('user')->once()->andReturn($metaUser);
    Socialite::shouldReceive('driver')->once()->with('meta')->andReturn($provider);

    Http::fake([
        'graph.facebook.com/*' => Http::response(['data' => []], 200),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/auth/meta/callback')
        ->assertRedirect();

    expect(Integration::query()->where('provider', Integration::PROVIDER_META)->sole()->isConnected())->toBeTrue()
        ->and(Integration::query()->where('provider', Integration::PROVIDER_WHATSAPP_BUSINESS)->count())->toBe(0);
});

it('asks for Facebook login when WhatsApp Business has no Meta grant', function () {
    enableEvolution();

    $this->actingAs(User::factory()->create())
        ->from('/settings/whatsapp-business')
        ->post('/settings/whatsapp-business/connect')
        ->assertRedirect();

    expect(Integration::query()->where('provider', Integration::PROVIDER_WHATSAPP_BUSINESS)->count())->toBe(0);
});

it('marks a scanned WhatsApp instance connected from CONNECTION_UPDATE', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    Integration::query()->create([
        'workspace_id' => $workspace->id,
        'provider' => Integration::PROVIDER_WHATSAPP,
        'status' => 'connecting',
        'meta' => [
            'instance' => 'evo-ws'.$workspace->id.'-wa',
            'integration' => 'WHATSAPP-BAILEYS',
        ],
    ]);

    app(EvolutionWebhookProcessor::class)->handle($workspace, [
        'event' => 'CONNECTION_UPDATE',
        'instance' => 'evo-ws'.$workspace->id.'-wa',
        'data' => ['state' => 'open'],
    ]);

    $integration = $workspace->fresh()->integration(Integration::PROVIDER_WHATSAPP);

    expect($integration?->status)->toBe('connected')
        ->and($integration?->isConnected())->toBeTrue();
});

it('routes a phone WhatsApp webhook onto the WhatsApp channel', function () {
    $workspace = User::factory()->create()->workspace;

    Integration::query()->create([
        'workspace_id' => $workspace->id,
        'provider' => Integration::PROVIDER_WHATSAPP,
        'status' => 'connected',
        'access_token' => 'inst-hash',
        'meta' => [
            'instance' => 'evo-ws'.$workspace->id.'-wa',
            'integration' => 'WHATSAPP-BAILEYS',
        ],
        'connected_at' => now(),
    ]);

    $message = app(EvolutionWebhookProcessor::class)->handle($workspace, [
        'event' => 'MESSAGES_UPSERT',
        'instance' => 'evo-ws'.$workspace->id.'-wa',
        'data' => [
            'key' => [
                'remoteJid' => '213555000222@s.whatsapp.net',
                'fromMe' => false,
                'id' => 'wamid.PHONE',
            ],
            'pushName' => 'Amine',
            'message' => ['conversation' => 'Salam from the phone'],
        ],
    ]);

    expect($message)->toBeInstanceOf(Message::class)
        ->and($message->provider)->toBe('evolution_whatsapp');

    $channel = Channel::query()
        ->where('workspace_id', $workspace->id)
        ->where('type', ChannelType::WhatsApp)
        ->sole();

    expect($channel->name)->toBe('WhatsApp')
        ->and($message->thread->channel_id)->toBe($channel->id);
});

it('exposes WhatsApp on the desk catalog and inbox channels', function () {
    config()->set('evosales.inbox_url', '');

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => null]);

    $this->actingAs($user)
        ->get('/inbox')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('officialConnectors', 4)
            ->where('officialConnectors.0.provider', 'whatsapp')
            ->where('officialConnectors.1.provider', 'whatsapp_cloud')
            ->has('channels', 4)
            ->where('channels.0.key', 'whatsapp')
            ->where('channels.1.key', 'whatsapp_cloud')
        );
});

it('saves a WhatsApp desk row that points at the QR page when Evolution is ready', function () {
    enableEvolution();

    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/inbox')
        ->post('/desk/connectors', ['provider' => 'whatsapp'])
        ->assertRedirect();

    $connector = Connector::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', ConnectorProvider::WhatsApp)
        ->sole();

    expect($connector->intent)->toBe('desk_whatsapp')
        ->and($connector->status)->toBe(ConnectorStatus::NeedsToken)
        ->and($connector->config['reason'])->toContain('Continue with Facebook');
});

it('offers Facebook login on the WhatsApp hub without exposing Evolution keys', function () {
    $this->actingAs(User::factory()->create())
        ->get('/settings/evolution')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/evolution')
            ->where('facebook_url', '/auth/meta?popup=1')
        )
        ->assertDontSee('EVOLUTION_BASE_URL')
        ->assertDontSee('EVOLUTION_API_KEY')
        ->assertDontSee('Open WhatsApp');
});
