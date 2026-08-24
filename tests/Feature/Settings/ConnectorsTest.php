<?php

namespace Tests\Feature\Settings;

use App\Enums\ConnectorProvider;
use App\Enums\ConnectorStatus;
use App\Models\Connector;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;
use Mockery;
use Tests\TestCase;

class ConnectorsTest extends TestCase
{
    use RefreshDatabase;

    private function enableGoogle(): void
    {
        config()->set('services.google.client_id', 'test-client-id');
        config()->set('services.google.client_secret', 'test-client-secret');
        config()->set(
            'services.google.redirect',
            'https://crm.evotechly.com/auth/google/callback',
        );
    }

    public function test_connectors_page_renders_gmail_and_calendar(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/settings/connectors')
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('settings/connectors')
                    ->where('googleEnabled', false)
                    ->has('googleConnectors', 2)
                    ->where('googleConnectors.0.provider', 'gmail')
                    ->where('googleConnectors.1.provider', 'google_calendar')
                    ->where('googleConnectors.0.scopes_on_client', false)
                    ->where('googleConnectors.0.reconnect_url', null)
                    ->has('deskConnectors', 3)
            );
    }

    public function test_saving_gmail_intent_asks_to_reconnect_when_scopes_are_missing(): void
    {
        $this->enableGoogle();

        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/settings/connectors')
            ->post('/settings/connectors', ['provider' => 'gmail'])
            ->assertRedirect();

        $connector = Connector::query()
            ->where('workspace_id', $user->workspace_id)
            ->where('provider', ConnectorProvider::Gmail)
            ->sole();

        $this->assertSame(ConnectorStatus::NeedsReconnect, $connector->status);
        $this->assertSame('gmail', $connector->intent);
        $this->assertStringContainsString('Reconnect Google with Calendar/Gmail', $connector->config['reason']);
    }

    public function test_reconnect_without_scopes_does_not_start_oauth(): void
    {
        $this->enableGoogle();

        Socialite::shouldReceive('driver')->never();

        $this->actingAs(User::factory()->create())
            ->get('/settings/connectors/google/gmail')
            ->assertRedirect(route('settings.connectors', absolute: false));
    }

    public function test_reconnect_uses_the_existing_google_client_when_scopes_are_set(): void
    {
        $this->enableGoogle();
        config()->set('services.google.gmail_scope', 'https://www.googleapis.com/auth/gmail.readonly');

        $provider = Mockery::mock();
        $provider->shouldReceive('scopes')->once()->with([
            'https://www.googleapis.com/auth/gmail.readonly',
        ])->andReturnSelf();
        $provider->shouldReceive('redirect')->once()->andReturn(
            redirect('https://accounts.google.com/o/oauth2/v2/auth?client_id=test-client-id&scope=gmail')
        );

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $response = $this->actingAs(User::factory()->create())
            ->get('/settings/connectors/google/gmail');

        $response->assertRedirect();
        $this->assertStringStartsWith(
            'https://accounts.google.com/',
            $response->headers->get('Location'),
        );
    }

    public function test_google_callback_completes_a_calendar_reconnect_for_an_authenticated_user(): void
    {
        $this->enableGoogle();
        config()->set('services.google.calendar_scope', 'https://www.googleapis.com/auth/calendar.readonly');

        $googleUser = new GoogleUser;
        $googleUser->setRaw([
            'id' => 'google-123',
            'name' => 'Sara Founder',
            'email' => 'sara@evotechly.com',
        ])->map([
            'id' => 'google-123',
            'name' => 'Sara Founder',
            'email' => 'sara@evotechly.com',
        ]);

        $provider = Mockery::mock();
        $provider->shouldReceive('user')->once()->andReturn($googleUser);
        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->withSession(['google_connector_intent' => 'google_calendar'])
            ->get(route('auth.google.callback'));

        $response->assertRedirect(route('settings.connectors', absolute: false));

        $connector = Connector::query()
            ->where('workspace_id', $user->workspace_id)
            ->where('provider', ConnectorProvider::GoogleCalendar)
            ->sole();

        $this->assertSame(ConnectorStatus::Connected, $connector->status);
        $this->assertSame('google_calendar', $connector->intent);
        $this->assertSame('sara@evotechly.com', $connector->config['google_email']);
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_redirect_never_requests_gmail_or_calendar_scopes(): void
    {
        $this->enableGoogle();
        config()->set('services.google.gmail_scope', 'https://www.googleapis.com/auth/gmail.readonly');
        config()->set('services.google.calendar_scope', 'https://www.googleapis.com/auth/calendar.readonly');

        $provider = Mockery::mock();
        $provider->shouldReceive('scopes')->never();
        $provider->shouldReceive('redirect')->once()->andReturn(
            redirect('https://accounts.google.com/o/oauth2/v2/auth?client_id=test-client-id')
        );

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $this->get(route('auth.google'))->assertRedirect();
    }

    public function test_marketplace_google_card_deepens_to_connectors(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/settings/apps')
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('settings/apps/index')
                    ->has('apps', 3)
                    ->where('apps.1.key', 'google')
                    ->where('apps.1.manage_url', '/settings/connectors')
            );
    }

    public function test_google_connector_store_rejects_desk_providers(): void
    {
        $this->actingAs(User::factory()->create())
            ->post('/settings/connectors', ['provider' => 'whatsapp_cloud'])
            ->assertSessionHasErrors('provider');
    }
}
