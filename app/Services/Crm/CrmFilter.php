<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\SavedFilter;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class CrmFilter
{
    /**
     * @return array<string, mixed>
     */
    public function resolve(Request $request, Workspace $workspace, string $entity): array
    {
        $saved = null;
        if ($request->integer('filter_id')) {
            $saved = SavedFilter::query()
                ->forWorkspace($workspace)
                ->where('entity', $entity)
                ->find($request->integer('filter_id'));
        }

        $fromSaved = $saved?->filters ?? [];

        $view = (string) $request->input('view', $fromSaved['view'] ?? 'all');
        if (! in_array($view, ['all', 'my'], true)) {
            $view = 'all';
        }

        $owner = $request->input('owner', $fromSaved['owner'] ?? null);
        if ($view === 'my') {
            $owner = (string) $request->user()->id;
        }

        return [
            'stage' => $request->input('stage', $fromSaved['stage'] ?? null),
            'owner' => $owner,
            'city' => $request->input('city', $fromSaved['city'] ?? null),
            'wilaya' => $request->input('wilaya', $fromSaved['wilaya'] ?? null),
            'last_activity' => $request->input('last_activity', $fromSaved['last_activity'] ?? null),
            'created' => $request->input('created', $fromSaved['created'] ?? null),
            'status' => $request->input('status', $fromSaved['status'] ?? null),
            'unanswered' => $request->boolean('unanswered') || (($fromSaved['unanswered'] ?? null) === true || ($fromSaved['unanswered'] ?? null) === '1'),
            'unassigned' => $request->boolean('unassigned') || (($fromSaved['unassigned'] ?? null) === true || ($fromSaved['unassigned'] ?? null) === '1'),
            'view' => $view,
            'filter_id' => $saved?->id,
        ];
    }

    /**
     * @param  Builder<Contact>  $query
     * @param  array<string, mixed>  $filters
     */
    public function applyToContacts(Builder $query, array $filters): Builder
    {
        if (filled($filters['owner'] ?? null) && ($filters['owner'] ?? '') !== 'unassigned') {
            $query->where('owner_id', $filters['owner']);
        }

        if (! empty($filters['unassigned']) || ($filters['owner'] ?? null) === 'unassigned') {
            $query->whereNull('owner_id');
        }

        if (filled($filters['city'] ?? null)) {
            $query->where(function (Builder $inner) use ($filters) {
                $inner->where('city', $filters['city'])
                    ->orWhereHas('company', fn (Builder $company) => $company->where('city', $filters['city']));
            });
        }

        if (filled($filters['wilaya'] ?? null)) {
            $query->where(function (Builder $inner) use ($filters) {
                $inner->where('wilaya', $filters['wilaya'])
                    ->orWhereHas('company', fn (Builder $company) => $company->where('wilaya', $filters['wilaya']));
            });
        }

        if (! empty($filters['unanswered'])) {
            $query->where('unanswered', true);
        }

        $this->applyLastActivity($query, $filters['last_activity'] ?? null);
        $this->applyCreated($query, $filters['created'] ?? null);

        if (filled($filters['status'] ?? null)) {
            $query->whereHas('leads', fn (Builder $lead) => $lead->where('status', $filters['status']));
        }

        return $query;
    }

    /**
     * @param  Builder<Deal>  $query
     * @param  array<string, mixed>  $filters
     */
    public function applyToDeals(Builder $query, array $filters): Builder
    {
        if (filled($filters['stage'] ?? null)) {
            $query->whereHas('stage', fn (Builder $stage) => $stage->where('slug', $filters['stage']));
        }

        if (filled($filters['owner'] ?? null) && ($filters['owner'] ?? '') !== 'unassigned') {
            $query->where('owner_id', $filters['owner']);
        }

        if (! empty($filters['unassigned']) || ($filters['owner'] ?? null) === 'unassigned') {
            $query->whereNull('owner_id');
        }

        if (filled($filters['city'] ?? null)) {
            $query->where(function (Builder $inner) use ($filters) {
                $inner->whereHas('company', fn (Builder $company) => $company->where('city', $filters['city']))
                    ->orWhereHas('contact', fn (Builder $contact) => $contact->where('city', $filters['city']));
            });
        }

        if (filled($filters['wilaya'] ?? null)) {
            $query->where(function (Builder $inner) use ($filters) {
                $inner->whereHas('company', fn (Builder $company) => $company->where('wilaya', $filters['wilaya']))
                    ->orWhereHas('contact', fn (Builder $contact) => $contact->where('wilaya', $filters['wilaya']));
            });
        }

        if (! empty($filters['unanswered'])) {
            $query->whereHas('contact', fn (Builder $contact) => $contact->where('unanswered', true));
        }

        $this->applyLastActivity($query, $filters['last_activity'] ?? null);
        $this->applyCreated($query, $filters['created'] ?? null);
        $this->applyDealStatus($query, $filters['status'] ?? null);

        return $query;
    }

    /**
     * @param  Builder<Company>  $query
     * @param  array<string, mixed>  $filters
     */
    public function applyToCompanies(Builder $query, array $filters): Builder
    {
        if (filled($filters['owner'] ?? null) && ($filters['owner'] ?? '') !== 'unassigned') {
            $query->where('owner_id', $filters['owner']);
        }

        if (! empty($filters['unassigned']) || ($filters['owner'] ?? null) === 'unassigned') {
            $query->whereNull('owner_id');
        }

        if (filled($filters['city'] ?? null)) {
            $query->where('city', $filters['city']);
        }

        if (filled($filters['wilaya'] ?? null)) {
            $query->where('wilaya', $filters['wilaya']);
        }

        $this->applyCreated($query, $filters['created'] ?? null);
        $this->applyCompanyLastActivity($query, $filters['last_activity'] ?? null);
        $this->applyCompanyDealStatus($query, $filters['status'] ?? null);

        return $query;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function count(Workspace $workspace, string $entity, array $filters): int
    {
        return match ($entity) {
            'contact' => $this->applyToContacts(Contact::query()->forWorkspace($workspace), $filters)->count(),
            'deal' => $this->applyToDeals(Deal::query()->forWorkspace($workspace), $filters)->count(),
            'company' => $this->applyToCompanies(Company::query()->forWorkspace($workspace), $filters)->count(),
            default => 0,
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{count: int, members: array<int, array<string, mixed>>}
     */
    public function preview(Workspace $workspace, string $entity, array $filters, int $limit = 5): array
    {
        return match ($entity) {
            'contact' => $this->previewContacts($workspace, $filters, $limit),
            'deal' => $this->previewDeals($workspace, $filters, $limit),
            default => ['count' => 0, 'members' => []],
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{count: int, members: array<int, array<string, mixed>>}
     */
    protected function previewContacts(Workspace $workspace, array $filters, int $limit): array
    {
        $query = $this->applyToContacts(Contact::query()->forWorkspace($workspace), $filters);

        return [
            'count' => (clone $query)->count(),
            'members' => (clone $query)
                ->with('owner:id,name')
                ->orderBy('first_name')
                ->limit($limit)
                ->get(['id', 'first_name', 'last_name', 'email', 'city', 'owner_id'])
                ->map(fn (Contact $contact) => [
                    'id' => $contact->id,
                    'label' => trim("{$contact->first_name} {$contact->last_name}"),
                    'detail' => $contact->email ?? $contact->city ?? '—',
                    'owner' => $contact->owner?->name,
                ])
                ->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{count: int, members: array<int, array<string, mixed>>}
     */
    protected function previewDeals(Workspace $workspace, array $filters, int $limit): array
    {
        $query = $this->applyToDeals(Deal::query()->forWorkspace($workspace), $filters);

        return [
            'count' => (clone $query)->count(),
            'members' => (clone $query)
                ->with(['owner:id,name', 'stage:id,name'])
                ->orderBy('title')
                ->limit($limit)
                ->get(['id', 'title', 'amount_cents', 'owner_id', 'stage_id'])
                ->map(fn (Deal $deal) => [
                    'id' => $deal->id,
                    'label' => $deal->title,
                    'detail' => $deal->stage?->name ?? '—',
                    'owner' => $deal->owner?->name,
                ])
                ->all(),
        ];
    }

    /**
     * @param  Builder<Model>  $query
     */
    protected function applyLastActivity(Builder $query, mixed $window): void
    {
        if (! filled($window)) {
            return;
        }

        if ($window === 'none') {
            $query->whereNull('last_activity_at');

            return;
        }

        $days = match ((string) $window) {
            '7d' => 7,
            '30d' => 30,
            default => null,
        };

        if ($days) {
            $query->where('last_activity_at', '>=', now()->subDays($days));
        }
    }

    /**
     * @param  Builder<Model>  $query
     */
    protected function applyCreated(Builder $query, mixed $window): void
    {
        if (! filled($window)) {
            return;
        }

        $from = match ((string) $window) {
            'today' => now()->startOfDay(),
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            default => null,
        };

        if ($from) {
            $query->where('created_at', '>=', $from);
        }
    }

    /**
     * @param  Builder<Deal>  $query
     */
    protected function applyDealStatus(Builder $query, mixed $status): void
    {
        if (! filled($status)) {
            return;
        }

        match ((string) $status) {
            'open' => $query->whereHas('stage', fn (Builder $stage) => $stage->where('is_won', false)->where('is_lost', false)),
            'won' => $query->whereHas('stage', fn (Builder $stage) => $stage->where('is_won', true)),
            'lost' => $query->whereHas('stage', fn (Builder $stage) => $stage->where('is_lost', true)),
            default => null,
        };
    }

    /**
     * @param  Builder<Company>  $query
     */
    protected function applyCompanyLastActivity(Builder $query, mixed $window): void
    {
        if (! filled($window)) {
            return;
        }

        if ($window === 'none') {
            $query->whereDoesntHave('contacts', fn (Builder $contact) => $contact->whereNotNull('last_activity_at'))
                ->whereDoesntHave('deals', fn (Builder $deal) => $deal->whereNotNull('last_activity_at'));

            return;
        }

        $days = match ((string) $window) {
            '7d' => 7,
            '30d' => 30,
            default => null,
        };

        if (! $days) {
            return;
        }

        $since = now()->subDays($days);

        $query->where(function (Builder $inner) use ($since) {
            $inner->whereHas('contacts', fn (Builder $contact) => $contact->where('last_activity_at', '>=', $since))
                ->orWhereHas('deals', fn (Builder $deal) => $deal->where('last_activity_at', '>=', $since));
        });
    }

    /**
     * @param  Builder<Company>  $query
     */
    protected function applyCompanyDealStatus(Builder $query, mixed $status): void
    {
        if (! filled($status)) {
            return;
        }

        match ((string) $status) {
            'open' => $query->whereHas('deals.stage', fn (Builder $stage) => $stage->where('is_won', false)->where('is_lost', false)),
            'won' => $query->whereHas('deals.stage', fn (Builder $stage) => $stage->where('is_won', true)),
            'lost' => $query->whereHas('deals.stage', fn (Builder $stage) => $stage->where('is_lost', true)),
            default => $query->whereHas('contacts.leads', fn (Builder $lead) => $lead->where('status', $status)),
        };
    }
}
