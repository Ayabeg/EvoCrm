<?php

namespace App\Providers;

use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Authenticated;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\FacebookProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureDefaults();

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
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

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
