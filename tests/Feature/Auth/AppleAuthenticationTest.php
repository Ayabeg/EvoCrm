<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\App;
use Laravel\Socialite\Contracts\User as SocialiteUserContract;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as AppleUser;
use Mockery;
use Tests\TestCase;

class AppleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private function fakeAppleUser(array $overrides = []): AppleUser
    {
        $appleUser = new AppleUser;

        $appleUser->setRaw(array_merge([
            'id' => 'apple-123',
            'name' => 'Sara Founder',
            'email' => 'sara@evotechly.com',
        ], $overrides))->map([
            'id' => 'apple-123',
            'name' => $overrides['name'] ?? 'Sara Founder',
            'email' => $overrides['email'] ?? 'sara@evotechly.com',
        ]);

        return $appleUser;
    }

    private function mockSocialiteCallback(SocialiteUserContract $appleUser): void
    {
        $provider = Mockery::mock();
        $provider->shouldReceive('redirectUrl')->once()->andReturnSelf();
        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('cookieNonce')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($appleUser);

        Socialite::shouldReceive('driver')->once()->with('apple')->andReturn($provider);
    }

    private function enableApple(): void
    {
        config()->set('services.apple.client_id', 'com.evocrm.service');
        config()->set('services.apple.team_id', 'TEAM123456');
        config()->set('services.apple.key_id', 'KEY1234567');
        config()->set('services.apple.private_key', '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----');
        config()->set(
            'services.apple.redirect',
            'https://crm.evotechly.com/auth/apple/callback',
        );
        config()->set('app.url', 'https://crm.evotechly.com');
    }

    private function disableApple(): void
    {
        config()->set('services.apple.client_id', null);
        config()->set('services.apple.team_id', null);
        config()->set('services.apple.key_id', null);
        config()->set('services.apple.private_key', null);
    }

    public function test_unconfigured_redirect_returns_to_login_with_translated_status()
    {
        $this->disableApple();

        Socialite::shouldReceive('driver')->never();

        $this->get(route('auth.apple'))
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', "Apple sign-in isn't available yet.");
    }

    public function test_unconfigured_callback_returns_to_login_without_500()
    {
        $this->disableApple();

        Socialite::shouldReceive('driver')->never();

        $this->get(route('auth.apple.callback'))
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', "Apple sign-in isn't available yet.");

        $this->post(route('auth.apple.callback'))
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', "Apple sign-in isn't available yet.");
    }

    public function test_unconfigured_status_is_translated_in_french()
    {
        $this->disableApple();
        App::setLocale('fr');

        $this->get(route('auth.apple'))
            ->assertRedirect(route('login'))
            ->assertSessionHas(
                'status',
                "La connexion avec Apple n'est pas encore disponible.",
            );
    }

    public function test_redirect_sends_guests_to_apple_when_configured()
    {
        $this->enableApple();

        $provider = Mockery::mock();
        $provider->shouldReceive('redirectUrl')
            ->once()
            ->with('https://crm.evotechly.com/auth/apple/callback')
            ->andReturnSelf();
        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('cookieNonce')->once()->andReturnSelf();
        $provider->shouldReceive('redirect')->once()->andReturn(
            redirect('https://appleid.apple.com/auth/authorize?client_id=com.evocrm.service')
        );

        Socialite::shouldReceive('driver')->once()->with('apple')->andReturn($provider);

        $response = $this->get('https://crm.evotechly.com/auth/apple');

        $response->assertRedirect();
        $this->assertStringStartsWith(
            'https://appleid.apple.com/',
            $response->headers->get('Location'),
        );
    }

    public function test_login_screen_always_shows_the_apple_and_google_buttons()
    {
        $this->disableApple();
        config()->set('services.google.client_id', null);
        config()->set('services.google.client_secret', null);

        $this->get(route('login'))->assertOk();

        expect(file_get_contents(resource_path('js/pages/auth/login.tsx')))
            ->toContain('SocialAuthButtons')
            ->and(file_get_contents(resource_path('js/components/social-auth-buttons.tsx')))
            ->toContain('apple-login-button')
            ->toContain('google-login-button')
            ->toContain('/auth/google')
            ->toContain('/auth/apple')
            ->toContain('Or continue with')
            ->and(file_get_contents(resource_path('js/pages/auth/auth-screen.tsx')))
            ->toContain('Terms of Service')
            ->toContain('Privacy Policy');
    }

    public function test_callback_creates_and_logs_in_a_new_user_with_verified_email()
    {
        $this->enableApple();
        $this->mockSocialiteCallback($this->fakeAppleUser());

        $response = $this->get(route('auth.apple.callback'));

        $this->assertAuthenticated();

        $user = User::query()->where('email', 'sara@evotechly.com')->sole();

        $this->assertSame('Sara Founder', $user->name);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->workspace_id);

        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_callback_logs_in_an_existing_user_and_marks_email_verified()
    {
        $this->enableApple();

        $user = User::factory()->unverified()->create([
            'email' => 'sara@evotechly.com',
        ]);

        $this->mockSocialiteCallback($this->fakeAppleUser());

        $response = $this->get(route('auth.apple.callback'));

        $this->assertAuthenticatedAs($user);
        $this->assertSame(1, User::query()->where('email', 'sara@evotechly.com')->count());
        $this->assertNotNull($user->fresh()->email_verified_at);

        $response->assertRedirect(route('dashboard', absolute: false));
    }
}
