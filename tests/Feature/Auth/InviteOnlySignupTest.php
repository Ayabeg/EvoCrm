<?php

namespace Tests\Feature\Auth;

use App\Enums\WorkspaceRole;
use App\Mail\WorkspaceInviteMail;
use App\Models\Mailbox;
use App\Models\User;
use App\Support\SignupMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;
use Mockery;
use Tests\TestCase;

class InviteOnlySignupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('evosales.signup.mode', SignupMode::INVITE);
        config()->set('evosales.signup.request_url', 'mailto:pilot@evotechly.com');
    }

    public function test_register_routes_are_closed_in_invite_mode(): void
    {
        $this->get(route('register'))->assertNotFound();

        $this->post(route('register.store'), [
            'name' => 'Pilot User',
            'email' => 'pilot@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertNotFound();

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'pilot@example.com']);
    }

    public function test_login_screen_replaces_sign_up_with_request_access(): void
    {
        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('auth/login')
                ->where('canRegister', false)
                ->where('signupRequestUrl', 'mailto:pilot@evotechly.com')
            );
    }

    public function test_login_and_password_reset_still_work(): void
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);

        $this->post(route('logout'));

        $this->get(route('password.request'))->assertOk();
    }

    public function test_workspace_invite_still_creates_an_account(): void
    {
        Mail::fake();

        $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
        Mailbox::factory()->create([
            'workspace_id' => $owner->workspace_id,
            'enabled' => true,
            'is_default' => true,
        ]);

        $this->actingAs($owner)
            ->post(route('settings.people.store'), [
                'name' => 'Invited Pilot',
                'email' => 'invited-pilot@evotechly.com',
                'role' => WorkspaceRole::Member->value,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'invited-pilot@evotechly.com',
            'workspace_id' => $owner->workspace_id,
        ]);

        Mail::assertSent(WorkspaceInviteMail::class, fn (WorkspaceInviteMail $mail) => $mail->hasTo('invited-pilot@evotechly.com'));
    }

    public function test_google_cannot_create_a_workspace_in_invite_mode(): void
    {
        config()->set('services.google.client_id', 'test-client-id');
        config()->set('services.google.client_secret', 'test-client-secret');
        config()->set('services.google.redirect', 'https://crm.evotechly.com/auth/google/callback');

        $googleUser = (new GoogleUser)->setRaw([
            'id' => 'google-pilot',
            'name' => 'New Google',
            'email' => 'new-google@evotechly.com',
        ])->map([
            'id' => 'google-pilot',
            'name' => 'New Google',
            'email' => 'new-google@evotechly.com',
        ]);

        $provider = Mockery::mock();
        $provider->shouldReceive('redirectUrl')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($googleUser);
        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $this->get(route('auth.google.callback'))
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', SignupMode::closedStatus());

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'new-google@evotechly.com']);
    }

    public function test_google_still_logs_in_an_existing_user(): void
    {
        config()->set('services.google.client_id', 'test-client-id');
        config()->set('services.google.client_secret', 'test-client-secret');
        config()->set('services.google.redirect', 'https://crm.evotechly.com/auth/google/callback');

        $user = User::factory()->create(['email' => 'existing-google@evotechly.com']);

        $googleUser = (new GoogleUser)->setRaw([
            'id' => 'google-existing',
            'name' => $user->name,
            'email' => $user->email,
        ])->map([
            'id' => 'google-existing',
            'name' => $user->name,
            'email' => $user->email,
        ]);

        $provider = Mockery::mock();
        $provider->shouldReceive('redirectUrl')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($googleUser);
        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $this->get(route('auth.google.callback'))
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
    }

    public function test_open_mode_allows_self_serve_registration(): void
    {
        config()->set('evosales.signup.mode', SignupMode::OPEN);

        $this->get(route('register'))->assertOk();

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('auth/login')
                ->where('canRegister', true)
            );

        $this->post(route('register.store'), [
            'name' => 'Open User',
            'email' => 'open@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'open@example.com']);
    }
}
