<?php

namespace App\Providers;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\User;
use App\Models\Workspace;
use App\Observers\CompanyObserver;
use App\Observers\ContactObserver;
use App\Observers\DealObserver;
use App\Observers\LeadObserver;
use App\Observers\WorkspaceObserver;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Connectors\FakeGoogleApiClient;
use App\Services\Connectors\GoogleApiClient;
use App\Services\Connectors\HttpGoogleApiClient;
use App\Services\Desk\FakeSmsClient;
use App\Services\Desk\HttpSmsGatewayClient;
use App\Services\Desk\SmsClient;
use App\Services\Desk\TwilioSmsClient;
use App\Services\Identity\WorkspaceProvisioner;
use App\Services\Operations\AuditLogger;
use App\Services\Operations\ScheduledTaskMonitor;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Authenticated;
use Illuminate\Auth\Events\Login;
use Illuminate\Console\Events\ScheduledTaskFailed;
use Illuminate\Console\Events\ScheduledTaskFinished;
use Illuminate\Console\Events\ScheduledTaskStarting;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\FacebookProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ScheduledTaskMonitor::class);
        $this->app->singleton(GoogleApiClient::class, function ($app) {
            return $app->environment('testing')
                ? $app->make(FakeGoogleApiClient::class)
                : $app->make(HttpGoogleApiClient::class);
        });
        $this->app->singleton(FakeGoogleApiClient::class);
        $this->app->singleton(FakeSmsClient::class);
        $this->app->bind(SmsClient::class, function ($app) {
            if ($app->environment('testing')) {
                return $app->make(FakeSmsClient::class);
            }

            return config('sms.driver') === 'twilio'
                ? $app->make(TwilioSmsClient::class)
                : $app->make(HttpSmsGatewayClient::class);
        });
        $this->app->singleton(ProductAnalytics::class);
    }

    public function boot(): void
    {
        $this->configureDefaults();

        Company::observe(CompanyObserver::class);
        Contact::observe(ContactObserver::class);
        Deal::observe(DealObserver::class);
        Lead::observe(LeadObserver::class);
        Workspace::observe(WorkspaceObserver::class);

        app()->terminating(fn () => app(ProductAnalytics::class)->flush());

        // Meta workspace OAuth rides Socialite's official Facebook provider
        // under the "meta" driver name, configured from META_* env vars.
        Socialite::extend('meta', function ($app) {
            return Socialite::buildProvider(FacebookProvider::class, $app['config']['services.meta']);
        });

        Event::listen(Authenticated::class, function (Authenticated $event): void {
            $user = $event->user;
            if ($user instanceof User && ! $user->workspace_id) {
                app(WorkspaceProvisioner::class)->forUser($user);
            }
        });

        // Real logins only (password, Google OAuth) — not session re-auth.
        // Settings → People shows this as "Last login".
        Event::listen(Login::class, function (Login $event): void {
            $user = $event->user;
            if ($user instanceof User) {
                $user->forceFill(['last_login_at' => now()])->save();
                $analytics = app(ProductAnalytics::class);
                $analytics->identify($user, $user->workspace);
                $analytics->capture(ProductAnalytics::USER_LOGGED_IN, [
                    'email' => $user->email,
                ], $user, $user->workspace);
                if ($user->workspace) {
                    app(AuditLogger::class)->record(
                        $user->workspace,
                        'login',
                        $user->email.' signed in',
                        $user,
                    );
                }
            }
        });

        Event::listen(
            ScheduledTaskStarting::class,
            fn (ScheduledTaskStarting $event) => app(ScheduledTaskMonitor::class)->starting($event),
        );
        Event::listen(
            ScheduledTaskFinished::class,
            fn (ScheduledTaskFinished $event) => app(ScheduledTaskMonitor::class)->finished($event),
        );
        Event::listen(
            ScheduledTaskFailed::class,
            fn (ScheduledTaskFailed $event) => app(ScheduledTaskMonitor::class)->failed($event),
        );
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        if (str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
