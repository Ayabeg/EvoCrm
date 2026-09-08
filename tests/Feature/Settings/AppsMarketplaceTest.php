<?php

namespace Tests\Feature\Settings;

use App\Models\Integration;
use App\Models\User;
use App\Support\GoogleAuth;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as MetaUser;
use Mockery;
use Tests\TestCase;

class AppsMarketplaceTest extends TestCase
{
    use RefreshDatabase;

    private function enableMeta(): void
    {
        config()->set('services.meta.client_id', 'meta-app-id');
        config()->set('services.meta.client_secret', 'meta-app-secret');
        config()->set(
            'services.meta.redirect',
            'https://crm.evotechly.com/auth/meta/callback',
        );
        config()->set('meta.app_id', 'meta-app-id');
        config()->set('meta.app_secret', 'meta-app-secret');
    }

    public function test_marketplace_renders_without_meta_env(): void
    {
        config()->set('services.meta.client_id', null);
        config()->set('services.meta.client_secret', null);
        config()->set('meta.app_id', null);
        config()->set('meta.app_secret', null);

        $this->actingAs(User::factory()->create())
            ->get('/settings/apps')
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('settings/apps/index')
                    ->has('apps', 5)
                    ->where('apps.0.key', 'meta')
                    ->where('apps.0.connected', false)
                    ->where('apps.0.connect_url', '/auth/meta?popup=1')
                    ->missing('apps.0.callback_url')
                    ->missing('apps.0.instagram_connect_url')
                    ->missing('apps.0.instagram_callback_url')
                    ->where('apps.1.key', 'whatsapp')
                    ->where('apps.2.key', 'whatsapp_business')
                    ->where('apps.3.key', 'google')
                    ->where('apps.3.callback_url', GoogleAuth::callbackUrl())
                    ->where('apps.3.origin_url', GoogleAuth::javascriptOrigin())
                    ->where('apps.4.key', 'smtp')
            )
            ->assertDontSee('META_APP_ID')
            ->assertDontSee('META_APP_SECRET')
            ->assertDontSee('META_ACCESS_TOKEN')
            ->assertDontSee('.env');
    }

    public function test_meta_popup_stays_client_friendly_when_platform_app_is_missing(): void
    {
        config()->set('meta.app_id', null);
        config()->set('meta.app_secret', null);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/auth/meta?popup=1')
            ->assertOk()
            ->assertSee('evosales:oauth', false)
            ->assertSee('ok: false', false);

        $this->actingAs($user)
            ->get('/auth/meta/callback')
            ->assertRedirect(route('settings.apps', absolute: false));
    }

    public function test_meta_redirect_sends_user_to_facebook_when_configured(): void
    {
        $this->enableMeta();

        $provider = Mockery::mock();
        $provider->shouldReceive('scopes')->once()->andReturnSelf();
        $provider->shouldReceive('usingGraphVersion')->once()->andReturnSelf();
        $provider->shouldReceive('reRequest')->once()->andReturnSelf();
        $provider->shouldReceive('redirect')->once()->andReturn(
            redirect('https://www.facebook.com/v21.0/dialog/oauth?client_id=meta-app-id')
        );

        Socialite::shouldReceive('driver')->once()->with('meta')->andReturn($provider);

        $response = $this->actingAs(User::factory()->create())->get('/auth/meta');

        $response->assertRedirect();
        $this->assertStringStartsWith(
            'https://www.facebook.com/',
            $response->headers->get('Location'),
        );
    }

    public function test_facebook_callback_closes_the_popup_instead_of_loading_apps(): void
    {
        $this->enableMeta();

        $metaUser = new MetaUser;
        $metaUser->setRaw(['id' => 'fb-user-popup', 'name' => 'Sara', 'email' => 'sara@evotechly.com'])
            ->map(['id' => 'fb-user-popup', 'name' => 'Sara', 'email' => 'sara@evotechly.com']);
        $metaUser->setToken('short-lived-token');
        $metaUser->setExpiresIn(3600);

        $provider = Mockery::mock();
        $provider->shouldReceive('usingGraphVersion')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($metaUser);
        Socialite::shouldReceive('driver')->once()->with('meta')->andReturn($provider);

        Http::fake([
            'graph.facebook.com/*' => Http::response(['data' => []], 200),
        ]);

        $this->actingAs(User::factory()->create())
            ->withSession(['auth.meta.popup' => true])
            ->get('/auth/meta/callback')
            ->assertOk()
            ->assertSee('evosales:oauth', false)
            ->assertSee('window.close', false)
            ->assertDontSee('settings/apps');
    }

    public function test_meta_popup_asks_facebook_for_the_authorization_window(): void
    {
        $this->enableMeta();

        $provider = Mockery::mock();
        $provider->shouldReceive('scopes')->once()->andReturnSelf();
        $provider->shouldReceive('usingGraphVersion')->once()->andReturnSelf();
        $provider->shouldReceive('reRequest')->once()->andReturnSelf();
        $provider->shouldReceive('with')->once()->with(['display' => 'popup'])->andReturnSelf();
        $provider->shouldReceive('redirect')->once()->andReturn(
            redirect('https://www.facebook.com/v21.0/dialog/oauth?display=popup')
        );

        Socialite::shouldReceive('driver')->once()->with('meta')->andReturn($provider);

        $response = $this->actingAs(User::factory()->create())->get('/auth/meta?popup=1');

        $response->assertRedirect();
        $this->assertTrue((bool) session('auth.meta.popup'));
    }

    public function test_meta_callback_stores_an_encrypted_workspace_connection(): void
    {
        $this->enableMeta();

        $metaUser = new MetaUser;
        $metaUser->setRaw([
            'id' => 'fb-user-1',
            'name' => 'Sara Founder',
            'email' => 'sara@evotechly.com',
        ])->map([
            'id' => 'fb-user-1',
            'name' => 'Sara Founder',
            'email' => 'sara@evotechly.com',
        ]);
        $metaUser->setToken('short-lived-token');
        $metaUser->setExpiresIn(3600);

        $provider = Mockery::mock();
        $provider->shouldReceive('usingGraphVersion')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($metaUser);

        Socialite::shouldReceive('driver')->once()->with('meta')->andReturn($provider);

        Http::fake([
            'graph.facebook.com/*/oauth/access_token*' => Http::response([
                'access_token' => 'long-lived-token',
                'expires_in' => 5_183_944,
            ]),
            'graph.facebook.com/*/me/permissions*' => Http::response([
                'data' => [
                    ['permission' => 'public_profile', 'status' => 'granted'],
                    ['permission' => 'pages_show_list', 'status' => 'granted'],
                    ['permission' => 'ads_management', 'status' => 'granted'],
                    ['permission' => 'whatsapp_business_messaging', 'status' => 'declined'],
                ],
            ]),
            'graph.facebook.com/*/me/accounts*' => Http::response([
                'data' => [['id' => 'page-1', 'name' => 'Evotechly Page']],
            ]),
            'graph.facebook.com/*/me/adaccounts*' => Http::response([
                'data' => [['id' => 'act_9', 'name' => 'Evotechly Ads']],
            ]),
            // Anything unexpected on Graph fails closed instead of hitting the network.
            'graph.facebook.com/*' => Http::response([], 404),
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/auth/meta/callback');

        $response->assertRedirect(route('settings.apps.meta', absolute: false));

        $integration = Integration::query()
            ->where('workspace_id', $user->workspace_id)
            ->where('provider', 'meta')
            ->sole();

        // The honest granted list is stored — the declined scope is not.
        $this->assertSame('connected', $integration->status);
        $this->assertContains('pages_show_list', $integration->scopes);
        $this->assertContains('ads_management', $integration->scopes);
        $this->assertNotContains('whatsapp_business_messaging', $integration->scopes);

        // Decrypted read through the cast returns the long-lived token…
        $this->assertSame('long-lived-token', $integration->access_token);
        $this->assertTrue((bool) $integration->meta['long_lived']);
        $this->assertSame('Evotechly Page', $integration->meta['pages'][0]['name']);
        $this->assertSame('act_9', $integration->meta['ad_accounts'][0]['id']);

        // …while the raw database value is encrypted, never plaintext.
        $raw = DB::table('integrations')->where('id', $integration->id)->value('access_token');
        $this->assertNotSame('long-lived-token', $raw);
        $this->assertStringNotContainsString('long-lived-token', (string) $raw);
    }

    public function test_meta_manage_page_requires_a_connection(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/settings/apps/meta')
            ->assertRedirect(route('settings.apps', absolute: false));
    }

    public function test_meta_manage_page_renders_when_connected(): void
    {
        $user = User::factory()->create();

        Integration::query()->create([
            'workspace_id' => $user->workspace_id,
            'provider' => 'meta',
            'status' => 'connected',
            'access_token' => 'stored-token',
            'scopes' => ['pages_show_list', 'ads_management'],
            'meta' => ['name' => 'Sara Founder', 'pages' => [], 'ad_accounts' => []],
            'connected_at' => now(),
        ]);

        $this->actingAs($user)
            ->get('/settings/apps/meta')
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('settings/apps/meta')
                    ->where('integration.account_name', 'Sara Founder')
                    ->where('unlocks.0.granted', true)
                    ->where('unlocks.2.granted', false)
            );
    }

    public function test_disconnecting_meta_deletes_the_connection(): void
    {
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
            ->delete('/settings/apps/meta')
            ->assertRedirect(route('settings.apps', absolute: false));

        $this->assertSame(0, Integration::query()->count());
    }
}
