<?php

namespace App\Http\Middleware;

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Support\Integrations;
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
            'posthog' => [
                'enabled' => filled(config('services.posthog.api_key')),
                'key' => config('services.posthog.api_key'),
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
            'evoSearchIndex' => function () use ($workspace) {
                if (! $workspace) {
                    return [];
                }

                $contacts = Contact::query()
                    ->forWorkspace($workspace)
                    ->latest('id')
                    ->limit(8)
                    ->get(['id', 'first_name', 'last_name', 'email'])
                    ->map(fn (Contact $row): array => [
                        'type' => 'Contact',
                        'label' => $row->displayName(),
                        'hint' => $row->email,
                        'href' => '/crm/contacts/'.$row->id,
                    ]);

                $companies = Company::query()
                    ->forWorkspace($workspace)
                    ->latest('id')
                    ->limit(8)
                    ->get(['id', 'name'])
                    ->map(fn (Company $row): array => [
                        'type' => 'Company',
                        'label' => $row->name,
                        'hint' => null,
                        'href' => '/crm/companies/'.$row->id,
                    ]);

                $leads = Lead::query()
                    ->forWorkspace($workspace)
                    ->latest('id')
                    ->limit(8)
                    ->get(['id', 'title'])
                    ->map(fn (Lead $row): array => [
                        'type' => 'Lead',
                        'label' => $row->title ?: 'Lead #'.$row->id,
                        'hint' => null,
                        'href' => '/crm/leads/'.$row->id,
                    ]);

                $deals = Deal::query()
                    ->forWorkspace($workspace)
                    ->latest('id')
                    ->limit(8)
                    ->get(['id', 'title'])
                    ->map(fn (Deal $row): array => [
                        'type' => 'Deal',
                        'label' => $row->title,
                        'hint' => null,
                        'href' => '/crm/deals/'.$row->id,
                    ]);

                return $contacts
                    ->concat($companies)
                    ->concat($leads)
                    ->concat($deals)
                    ->values()
                    ->all();
            },
        ];
    }
}
