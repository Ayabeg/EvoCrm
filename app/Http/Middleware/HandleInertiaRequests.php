<?php

namespace App\Http\Middleware;

use App\Models\Activity;
use App\Support\Integrations;
use App\Support\Locale;
use App\Support\SignupMode;
use App\Support\SimpleMode;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $workspace = $user?->workspace;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => app()->getLocale(),
            'dir' => Locale::direction(app()->getLocale()),
            'intlLocale' => Locale::intl(app()->getLocale()),
            'translations' => $this->chromeTranslations(),
            'auth' => [
                'user' => $user,
                'capabilities' => $user
                    ? collect(array_keys(config('permissions.capabilities', [])))
                        ->filter(fn (string $permission): bool => $user->canPermission($permission))
                        ->values()
                        ->all()
                    : [],
            ],
            'workspace' => $workspace,
            'simpleMode' => SimpleMode::enabled($workspace),
            'nav' => SimpleMode::nav($workspace),
            'features' => SimpleMode::features($workspace),
            'signup' => [
                'open' => SignupMode::isOpen(),
                'request_url' => SignupMode::requestUrl(),
            ],
            'posthog' => [
                'enabled' => filled(config('services.posthog.api_key')),
                'key' => filled(config('services.posthog.api_key'))
                    ? config('services.posthog.api_key')
                    : null,
                'host' => config('services.posthog.host', 'https://us.i.posthog.com'),
                'distinct_id' => $user ? (string) $user->id : null,
            ],
            'integrations' => fn () => Integrations::forWorkspace($workspace),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'evoOpenTaskCount' => function () use ($workspace) {
                if (! $workspace) {
                    return 0;
                }

                return Activity::query()
                    ->forWorkspace($workspace)
                    ->where('done', false)
                    ->count();
            },
            'evoOpenTasks' => function () use ($workspace) {
                if (! $workspace) {
                    return [];
                }

                return Activity::query()
                    ->forWorkspace($workspace)
                    ->where('done', false)
                    ->orderByRaw('due_at is null')
                    ->orderBy('due_at')
                    ->limit(40)
                    ->get(['id', 'type', 'subject', 'due_at', 'contact_id', 'deal_id', 'company_id'])
                    ->map(fn (Activity $activity): array => [
                        'id' => $activity->id,
                        'type' => $activity->type,
                        'subject' => $activity->subject ?: 'Activity',
                        'due_at' => $activity->due_at?->toIso8601String(),
                    ])
                    ->all();
            },
            // P16: keep the shared key. Do not load CRM rows onto every page.
            // Record search is GET /crm/command/search — permission-safe and bounded.
            'evoSearchIndex' => [],
        ];
    }

    /**
     * Flat chrome dictionary for the active locale. Missing keys fall
     * back to the English source string in t().
     *
     * @return array<string, string>
     */
    private function chromeTranslations(): array
    {
        $locale = Locale::normalize(app()->getLocale()) ?? Locale::applicationDefault();
        $path = lang_path($locale.'.json');

        if (! is_file($path)) {
            return [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        if (! is_array($decoded)) {
            return [];
        }

        return collect($decoded)
            ->filter(fn (mixed $value): bool => is_string($value))
            ->all();
    }
}
