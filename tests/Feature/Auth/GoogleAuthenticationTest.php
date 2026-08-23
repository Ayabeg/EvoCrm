<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\User as SocialiteUserContract;
use Laravel\Socialite\Facades\Socialite;
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
    }

    public function test_redirect_route_sends_guests_to_google_when_configured()
    {
        $this->enableGoogle();

        $provider = Mockery::mock();
        $provider->shouldReceive('redirect')->once()->andReturn(
            redirect('https://accounts.google.com/o/oauth2/v2/auth?client_id=test-client-id')
        );

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google'));

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
}
