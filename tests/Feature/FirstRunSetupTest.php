<?php

use App\Enums\ConnectorProvider;
use App\Enums\ConnectorStatus;
use App\Models\Connector;
use App\Models\Integration;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;

it('redirects /settings/setup onto the first-run wizard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/setup')
        ->assertRedirect('/settings/setup/start');
});

it('renders Google, WhatsApp and SMS on the first-run wizard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/setup/start')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/setup/wizard')
            ->where('provider', 'start')
            ->where('currentStep', 'google')
            ->has('steps', 4)
            ->where('steps.0.key', 'google')
            ->where('steps.1.key', 'whatsapp')
            ->where('steps.2.key', 'sms')
            ->where('steps.3.key', 'finish')
            ->where('startState.google.connected', false)
            ->where('startState.whatsapp.connected', false)
            ->where('startState.sms.connected', false)
            ->where('startState.whatsapp.connect_url', '/auth/meta?return=start&popup=1'));
});

it('links Apps Get started to the first-run wizard', function () {
    $this->actingAs(User::factory()->create())
        ->get('/settings/apps')
        ->assertOk()
        ->assertSee('Get started')
        ->assertInertia(fn ($page) => $page
            ->where('apps.1.setup_url', '/settings/setup/start?step=whatsapp')
            ->where('apps.3.setup_url', '/settings/setup/start?step=google'));
});

it('saves the SMS key from the wizard and lands on finish', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/settings/setup/start?step=sms')
        ->post('/settings/sms', [
            'return' => 'start',
            'driver' => 'http',
            'url' => 'https://sms.example.dz/api/send',
            'method' => 'POST',
            'auth' => 'form',
            'sender' => 'CLINIQUE',
            'api_key' => 'wizard-secret',
        ])
        ->assertRedirect('/settings/setup/start?step=finish');

    expect($user->workspace->fresh()->integration(Integration::PROVIDER_SMS)?->isConnected())->toBeTrue();

    $this->actingAs($user)
        ->get('/settings/setup/start?step=finish')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('currentStep', 'finish')
            ->where('startState.sms.connected', true)
            ->where('startState.sms.key_set', true));
});

it('keeps the SMS settings page on /settings/sms when return is omitted', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/settings/sms')
        ->post('/settings/sms', [
            'driver' => 'http',
            'url' => 'https://sms.example.dz/api/send',
            'method' => 'POST',
            'auth' => 'form',
            'sender' => 'CLINIQUE',
            'api_key' => 'page-secret',
        ])
        ->assertRedirect('/settings/sms');
});

it('stores google_setup_return when Calendar reconnect starts from first-run', function () {
    config()->set('services.google.client_id', 'test-client-id');
    config()->set('services.google.client_secret', 'test-client-secret');
    config()->set('services.google.redirect', 'https://crm.evotechly.com/auth/google/callback');

    $provider = Mockery::mock();
    $provider->shouldReceive('redirectUrl')->once()->andReturnSelf();
    $provider->shouldReceive('scopes')->once()->andReturnSelf();
    $provider->shouldReceive('with')->once()->andReturnSelf();
    $provider->shouldReceive('redirect')->once()->andReturn(
        redirect('https://accounts.google.com/o/oauth2/v2/auth')
    );
    Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

    $this->actingAs(User::factory()->create())
        ->get('/settings/connectors/google/google_calendar?return=start')
        ->assertRedirect();

    expect(session('google_setup_return'))->toBe('start')
        ->and(session('google_connector_intent'))->toBe('google_calendar');
});

it('returns a Calendar reconnect to the WhatsApp step', function () {
    config()->set('services.google.client_id', 'test-client-id');
    config()->set('services.google.client_secret', 'test-client-secret');
    config()->set('services.google.redirect', 'https://crm.evotechly.com/auth/google/callback');
    config()->set('services.google.calendar_scope', 'https://www.googleapis.com/auth/calendar.readonly');

    $googleUser = new GoogleUser;
    $googleUser->setRaw([
        'id' => 'google-123',
        'name' => 'Sara Founder',
        'email' => 'sara@clinic.dz',
    ])->map([
        'id' => 'google-123',
        'name' => 'Sara Founder',
        'email' => 'sara@clinic.dz',
    ]);

    $provider = Mockery::mock();
    $provider->shouldReceive('redirectUrl')->once()->andReturnSelf();
    $provider->shouldReceive('user')->once()->andReturn($googleUser);
    Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession([
            'google_connector_intent' => 'google_calendar',
            'google_setup_return' => 'start',
        ])
        ->get('/auth/google/callback')
        ->assertRedirect('/settings/setup/start?step=whatsapp');

    expect(Connector::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', ConnectorProvider::GoogleCalendar)
        ->sole()
        ->status)->toBe(ConnectorStatus::Connected);
});

it('remembers Meta return=start for the first-run WhatsApp step', function () {
    config()->set('meta.app_id', 'test-app');
    config()->set('meta.app_secret', 'test-secret');

    $this->actingAs(User::factory()->create())
        ->get('/auth/meta?return=start')
        ->assertRedirect();

    expect(session('auth.meta.return'))->toBe('start');
});

it('marks Calendar connected on the finish step', function () {
    $user = User::factory()->create();

    Connector::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => ConnectorProvider::GoogleCalendar,
        'intent' => ConnectorProvider::GoogleCalendar->intent(),
        'status' => ConnectorStatus::Connected,
        'connected_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/settings/setup/start?step=finish')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('startState.google.connected', true)
            ->where('startState.whatsapp.connected', false)
            ->where('startState.sms.connected', false));
});
