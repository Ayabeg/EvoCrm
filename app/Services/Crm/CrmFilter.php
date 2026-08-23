<?php

namespace App\Services\Crm;

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

        return [
            'stage' => $request->input('stage', $fromSaved['stage'] ?? null),
            'owner' => $request->input('owner', $fromSaved['owner'] ?? null),
            'city' => $request->input('city', $fromSaved['city'] ?? null),
            'wilaya' => $request->input('wilaya', $fromSaved['wilaya'] ?? null),
            'last_activity' => $request->input('last_activity', $fromSaved['last_activity'] ?? null),
            'unanswered' => $request->boolean('unanswered') || (($fromSaved['unanswered'] ?? null) === true || ($fromSaved['unanswered'] ?? null) === '1'),
            'unassigned' => $request->boolean('unassigned') || (($fromSaved['unassigned'] ?? null) === true || ($fromSaved['unassigned'] ?? null) === '1'),
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

        return $query;
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
}
