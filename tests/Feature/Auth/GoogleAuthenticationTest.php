<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\User as SocialiteUserContract;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Laravel\Socialite\Two\User as GoogleUser;
use Mockery;
use Tests\TestCase;

class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private function fakeGoogleUser(array $overrides = []): GoogleUser
    {
        $googleUser = new GoogleUser;

        $googleUser->setRaw(array_merge([
            'id' => 'google-123',
            'name' => 'Sara Founder',
            'email' => 'sara@evotechly.com',
            'verified_email' => true,
        ], $overrides))->map([
            'id' => 'google-123',
            'name' => $overrides['name'] ?? 'Sara Founder',
            'email' => $overrides['email'] ?? 'sara@evotechly.com',
        ]);

        return $googleUser;
    }

    private function mockSocialiteCallback(SocialiteUserContract $googleUser): void
    {
        $provider = Mockery::mock();
        $provider->shouldReceive('redirectUrl')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);
    }

    private function enableGoogle(): void
    {
        config()->set('services.google.client_id', 'test-client-id');
        config()->set('services.google.client_secret', 'test-client-secret');
        config()->set(
            'services.google.redirect',
            'https://crm.evotechly.com/auth/google/callback',
        );
        config()->set('app.url', 'https://crm.evotechly.com');
    }

    public function test_redirect_pins_the_canonical_callback_url_on_socialite()
    {
        $this->enableGoogle();
        config()->set('app.url', 'https://crm.evotechly.com');
        config()->set('services.google.redirect', '');

        $provider = Mockery::mock();
        $provider->shouldReceive('redirectUrl')
            ->once()
            ->with('https://crm.evotechly.com/auth/google/callback')
            ->andReturnSelf();
        $provider->shouldReceive('redirect')->once()->andReturn(
            redirect('https://accounts.google.com/o/oauth2/v2/auth?client_id=test-client-id&redirect_uri=https%3A%2F%2Fcrm.evotechly.com%2Fauth%2Fgoogle%2Fcallback')
        );

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $this->get('https://crm.evotechly.com/auth/google')->assertRedirect();
    }

    public function test_redirect_hops_to_the_callback_host_when_the_request_host_differs()
    {
        $this->enableGoogle();

        Socialite::shouldReceive('driver')->never();

        $this->get('https://evormapp.com/auth/google')
            ->assertRedirect('https://crm.evotechly.com/auth/google');
    }

    public function test_callback_pins_the_same_canonical_url_for_the_token_exchange()
    {
        $this->enableGoogle();
        config()->set('app.url', 'https://crm.evotechly.com');
        config()->set('services.google.redirect', '');

        $provider = Mockery::mock();
        $provider->shouldReceive('redirectUrl')
            ->once()
            ->with('https://crm.evotechly.com/auth/google/callback')
            ->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($this->fakeGoogleUser());

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $this->get(route('auth.google.callback'))->assertRedirect();
        $this->assertAuthenticated();
    }

    public function test_redirect_route_sends_guests_to_google_when_configured()
    {
        $this->enableGoogle();

        $provider = Mockery::mock();
        $provider->shouldReceive('redirectUrl')->once()->andReturnSelf();
        $provider->shouldReceive('redirect')->once()->andReturn(
            redirect('https://accounts.google.com/o/oauth2/v2/auth?client_id=test-client-id')
        );

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $response = $this->get('https://crm.evotechly.com/auth/google');

        $response->assertRedirect();
        $this->assertStringStartsWith(
            'https://accounts.google.com/',
            $response->headers->get('Location'),
        );
    }

    public function test_google_routes_404_when_not_configured()
    {
        config()->set('services.google.client_id', null);
        config()->set('services.google.client_secret', null);

        $this->get(route('auth.google'))->assertNotFound();
        $this->get(route('auth.google.callback'))->assertNotFound();
    }

    public function test_login_screen_hides_google_button_when_not_configured()
    {
        config()->set('services.google.client_id', null);
        config()->set('services.google.client_secret', null);

        $this->get(route('login'))->assertInertia(
            fn ($page) => $page
                ->component('auth/login')
                ->where('canLoginWithGoogle', false)
        );
    }

    public function test_login_screen_shows_google_button_when_configured()
    {
        $this->enableGoogle();

        $this->get(route('login'))->assertInertia(
            fn ($page) => $page
                ->component('auth/login')
                ->where('canLoginWithGoogle', true)
        );
    }

    public function test_callback_creates_and_logs_in_a_new_user_with_verified_email()
    {
        $this->enableGoogle();
        $this->mockSocialiteCallback($this->fakeGoogleUser());

        $response = $this->get(route('auth.google.callback'));

        $this->assertAuthenticated();

        $user = User::query()->where('email', 'sara@evotechly.com')->sole();

        $this->assertSame('Sara Founder', $user->name);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->workspace_id);

        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_callback_logs_in_an_existing_user_and_marks_email_verified()
    {
        $this->enableGoogle();

        $user = User::factory()->unverified()->create([
            'email' => 'sara@evotechly.com',
        ]);

        $this->mockSocialiteCallback($this->fakeGoogleUser());

        $response = $this->get(route('auth.google.callback'));

        $this->assertAuthenticatedAs($user);
        $this->assertSame(1, User::query()->where('email', 'sara@evotechly.com')->count());
        $this->assertNotNull($user->fresh()->email_verified_at);

        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_callback_respects_two_factor_when_already_enabled()
    {
        $this->enableGoogle();

        $user = User::factory()->withTwoFactor()->create([
            'email' => 'sara@evotechly.com',
        ]);

        $this->mockSocialiteCallback($this->fakeGoogleUser());

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('two-factor.login'));
        $response->assertSessionHas('login.id', $user->id);
        $this->assertGuest();
    }

    public function test_callback_redirects_back_to_login_when_google_shares_no_email()
    {
        $this->enableGoogle();

        $googleUser = new GoogleUser;
        $googleUser->setRaw(['id' => 'google-123'])->map([
            'id' => 'google-123',
            'name' => 'No Email',
            'email' => null,
        ]);

        $this->mockSocialiteCallback($googleUser);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('login'));
        $this->assertGuest();
        $this->assertSame(0, User::query()->count());
    }

    public function test_callback_redirects_to_login_when_oauth_state_is_invalid()
    {
        $this->enableGoogle();

        $provider = Mockery::mock();
        $provider->shouldReceive('redirectUrl')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andThrow(new InvalidStateException);

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('login'));
        $response->assertSessionHas(
            'status',
            'Google sign-in could not be completed. Start again from this page and try once more.',
        );
        $this->assertGuest();
    }
}
