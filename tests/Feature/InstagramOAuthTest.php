<?php

use App\Models\Integration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InstagramOAuthTest extends TestCase
{
    use RefreshDatabase;

    private function enableInstagram(): void
    {
        config()->set('meta.app_id', '990602627938098');
        config()->set('meta.app_secret', 'ig-secret');
        config()->set('meta.instagram_app_id', '990602627938098');
        config()->set('meta.instagram_app_secret', 'ig-secret');
        config()->set('meta.instagram_redirect_uri', 'https://crm.evotechly.com/auth/instagram/callback');
    }

    public function test_instagram_routes_404_when_not_configured(): void
    {
        config()->set('meta.app_id', null);
        config()->set('meta.app_secret', null);
        config()->set('meta.instagram_app_id', null);
        config()->set('meta.instagram_app_secret', null);

        $user = User::factory()->create();

        $this->actingAs($user)->get('/auth/instagram')->assertNotFound();
        $this->actingAs($user)->get('/auth/instagram/callback')->assertNotFound();
    }

    public function test_instagram_redirect_opens_the_authorization_window(): void
    {
        $this->enableInstagram();

        $response = $this->actingAs(User::factory()->create())
            ->get('/auth/instagram?popup=1');

        $response->assertRedirect();
        $location = (string) $response->headers->get('Location');

        $this->assertStringStartsWith('https://www.instagram.com/oauth/authorize', $location);
        $this->assertStringContainsString('client_id=990602627938098', $location);
        $this->assertStringContainsString('response_type=code', $location);
        $this->assertTrue((bool) session('auth.instagram.popup'));
        $this->assertNotEmpty(session('auth.instagram.state'));
    }

    public function test_canceled_authorization_fails_gracefully(): void
    {
        $this->enableInstagram();

        $user = User::factory()->create();

        $this->actingAs($user)
            ->withSession(['auth.instagram.state' => 'abc', 'auth.instagram.popup' => true])
            ->get('/auth/instagram/callback?error=access_denied&error_reason=user_denied&error_description=The+user+denied+your+request&state=abc')
            ->assertOk()
            ->assertSee('evosales:oauth', false)
            ->assertSee('ok: false', false)
            ->assertSee('window.close', false);

        $this->assertSame(0, Integration::query()->count());
    }

    public function test_callback_exchanges_code_and_closes_the_popup(): void
    {
        $this->enableInstagram();

        Http::fake([
            'api.instagram.com/oauth/access_token' => Http::response([
                'data' => [[
                    'access_token' => 'short-ig-token',
                    'user_id' => '1020',
                    'permissions' => 'instagram_business_basic,instagram_business_manage_messages',
                ]],
            ]),
            'graph.instagram.com/access_token*' => Http::response([
                'access_token' => 'long-ig-token',
                'token_type' => 'bearer',
                'expires_in' => 5_183_944,
            ]),
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->withSession(['auth.instagram.state' => 'abc', 'auth.instagram.popup' => true])
            ->get('/auth/instagram/callback?code=AQBx-hBsH3...%23_&state=abc');

        $response->assertOk()
            ->assertSee('evosales:oauth', false)
            ->assertSee('ok: true', false)
            ->assertSee('window.close', false);

        $integration = Integration::query()
            ->where('workspace_id', $user->workspace_id)
            ->where('provider', Integration::PROVIDER_INSTAGRAM)
            ->sole();

        $this->assertSame('connected', $integration->status);
        $this->assertSame('long-ig-token', $integration->access_token);
        $this->assertContains('instagram_business_basic', $integration->scopes);
        $this->assertSame('1020', $integration->meta['instagram_user_id']);
        $this->assertTrue((bool) $integration->meta['long_lived']);
    }
}
