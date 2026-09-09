<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\Deal;
use App\Models\SavedFilter;
use App\Models\Ticket;
use App\Models\Workspace;
use App\Support\ListViewConfig;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class CrmFilter
{
    /**
     * @return array<string, mixed>
     */
    public function fromSaved(SavedFilter $saved): array
    {
        $fromSaved = $saved->filters ?? [];

        return [
            'stage' => $fromSaved['stage'] ?? null,
            'owner' => $fromSaved['owner'] ?? null,
            'city' => $fromSaved['city'] ?? null,
            'wilaya' => $fromSaved['wilaya'] ?? null,
            'last_activity' => $fromSaved['last_activity'] ?? null,
            'created' => $fromSaved['created'] ?? null,
            'status' => $fromSaved['status'] ?? null,
            'unanswered' => ($fromSaved['unanswered'] ?? null) === true || ($fromSaved['unanswered'] ?? null) === '1',
            'unassigned' => ($fromSaved['unassigned'] ?? null) === true || ($fromSaved['unassigned'] ?? null) === '1',
            'deal_stage' => $fromSaved['deal_stage'] ?? null,
            'has_open_deal' => ($fromSaved['has_open_deal'] ?? null) === true || ($fromSaved['has_open_deal'] ?? null) === '1',
            'view' => $fromSaved['view'] ?? 'all',
            'filter_id' => $saved->id,
            'filter_groups' => $this->parseFilterGroups(null, $fromSaved['filter_groups'] ?? null),
            'columns' => $saved->resolvedColumns(),
            'sort' => $saved->resolvedSort(),
        ];
    }

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

        $filterGroups = $this->parseFilterGroups($request->input('filter_groups'), $fromSaved['filter_groups'] ?? null);

        return [
            'stage' => $request->input('stage', $fromSaved['stage'] ?? null),
            'q' => $request->string('q')->toString() ?: ($fromSaved['q'] ?? null),
            'owner' => $owner,
            'city' => $request->input('city', $fromSaved['city'] ?? null),
            'wilaya' => $request->input('wilaya', $fromSaved['wilaya'] ?? null),
            'last_activity' => $request->input('last_activity', $fromSaved['last_activity'] ?? null),
            'created' => $request->input('created', $fromSaved['created'] ?? null),
            'status' => $request->input('status', $fromSaved['status'] ?? null),
            'unanswered' => $request->boolean('unanswered') || (($fromSaved['unanswered'] ?? null) === true || ($fromSaved['unanswered'] ?? null) === '1'),
            'unassigned' => $request->boolean('unassigned') || (($fromSaved['unassigned'] ?? null) === true || ($fromSaved['unassigned'] ?? null) === '1'),
            'enrolled_in_sequence' => $request->input('enrolled_in_sequence', $fromSaved['enrolled_in_sequence'] ?? null),
            'email_replied' => $request->boolean('email_replied') || (($fromSaved['email_replied'] ?? null) === true || ($fromSaved['email_replied'] ?? null) === '1'),
            'email_opened' => $request->boolean('email_opened') || (($fromSaved['email_opened'] ?? null) === true || ($fromSaved['email_opened'] ?? null) === '1'),
            'deal_stage' => $request->input('deal_stage', $fromSaved['deal_stage'] ?? null),
            'has_open_deal' => $request->boolean('has_open_deal') || (($fromSaved['has_open_deal'] ?? null) === true || ($fromSaved['has_open_deal'] ?? null) === '1'),
            'view' => $view,
            'filter_id' => $saved?->id,
            'filter_groups' => $filterGroups,
            'columns' => $saved?->resolvedColumns() ?? ListViewConfig::normalizeColumns($entity, null),
            'sort' => $saved?->resolvedSort() ?? ListViewConfig::defaultSort($entity),
        ];
    }

    /**
     * @param  Builder<Contact|Deal|Company>  $query
     * @param  array<string, mixed>  $filters
     */
    public function apply(string $entity, Builder $query, array $filters): Builder
    {
        if ($this->hasFilterGroups($filters)) {
            return $this->applyFilterGroups($entity, $query, $filters['filter_groups']);
        }

        return match ($entity) {
            'contact' => $this->applyToContacts($query, $filters),
            'deal' => $this->applyToDeals($query, $filters),
            'company' => $this->applyToCompanies($query, $filters),
            default => $query,
        };
    }

    /**
     * @param  Builder<Contact|Deal|Company>  $query
     * @param  array<string, mixed>  $filters
     */
    public function applySort(string $entity, Builder $query, array $filters): Builder
    {
        $sort = $filters['sort'] ?? null;
        if (! is_array($sort) || ! filled($sort['field'] ?? null)) {
            return $query;
        }

        $field = (string) $sort['field'];
        $direction = ($sort['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return match ($entity) {
            'contact' => $this->applyContactSort($query, $field, $direction),
            'deal' => $this->applyDealSort($query, $field, $direction),
            'company' => $this->applyCompanySort($query, $field, $direction),
            default => $query,
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    /**
     * HubSpot list pages show 25 rows per page.
     *
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return array{0: \Illuminate\Database\Eloquent\Collection<int, TModel>, 1: array{page: int, per_page: int, total: int, last_page: int}}
     */
    public function paginate(Builder $query, Request $request, int $perPage = 25): array
    {
        $page = max(1, $request->integer('page') ?: 1);
        $total = (clone $query)->count();
        $lastPage = max(1, (int) ceil($total / max(1, $perPage)));

        if ($page > $lastPage) {
            $page = $lastPage;
        }

        return [
            $query->forPage($page, $perPage)->get(),
            [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $lastPage,
            ],
        ];
    }

    public function count(Workspace $workspace, string $entity, array $filters): int
    {
        $query = match ($entity) {
            'contact' => Contact::query()->forWorkspace($workspace),
            'deal' => Deal::query()->forWorkspace($workspace),
            'company' => Company::query()->forWorkspace($workspace),
            'ticket' => Ticket::query()->forWorkspace($workspace),
            default => null,
        };

        if (! $query) {
            return 0;
        }

        return $this->apply($entity, $query, $filters)->count();
    }

    /**
     * @param  array<string, mixed>  $filterGroups
     * @param  Builder<Contact|Deal|Company>  $query
     */
    public function applyFilterGroups(string $entity, Builder $query, array $filterGroups): Builder
    {
        $groups = $filterGroups['groups'] ?? [];
        if ($groups === []) {
            return $query;
        }

        $topLogic = ($filterGroups['logic'] ?? 'and') === 'or' ? 'orWhere' : 'where';

        $query->{$topLogic}(function (Builder $outer) use ($entity, $groups, $topLogic): void {
            foreach ($groups as $index => $group) {
                $groupLogic = ($group['logic'] ?? 'and') === 'or' ? 'orWhere' : 'where';
                $method = $index === 0 && $topLogic === 'where' ? 'where' : $groupLogic;

                $outer->{$method}(function (Builder $inner) use ($entity, $group): void {
                    $rules = $group['rules'] ?? [];
                    foreach ($rules as $ruleIndex => $rule) {
                        $this->applyRule($entity, $inner, $rule, $ruleIndex, $group['logic'] ?? 'and');
                    }
                });
            }
        });

        return $query;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    protected function hasFilterGroups(array $filters): bool
    {
        $groups = $filters['filter_groups']['groups'] ?? [];

        return is_array($groups) && collect($groups)->contains(fn (array $group) => ! empty($group['rules']));
    }

    /**
     * @param  Builder<Contact|Deal|Company>  $query
     * @param  array<string, mixed>  $rule
     */
    protected function applyRule(string $entity, Builder $query, array $rule, int $index, string $groupLogic): void
    {
        $field = (string) ($rule['field'] ?? '');
        $operator = (string) ($rule['operator'] ?? 'eq');
        $value = $rule['value'] ?? null;

        if ($field === '') {
            return;
        }

        $method = $index === 0 ? 'where' : (($groupLogic === 'or') ? 'orWhere' : 'where');

        $query->{$method}(function (Builder $inner) use ($entity, $field, $operator, $value): void {
            if (str_starts_with($field, 'custom:')) {
                $this->applyCustomAttributeRule($entity, $inner, substr($field, 7), $operator, $value);

                return;
            }

            $flat = $this->ruleToFlatFilter($field, $operator, $value);
            if ($flat !== null) {
                match ($entity) {
                    'contact' => $this->applyToContacts($inner, $flat),
                    'deal' => $this->applyToDeals($inner, $flat),
                    'company' => $this->applyToCompanies($inner, $flat),
                    default => null,
                };

                return;
            }

            $this->applyDirectRule($entity, $inner, $field, $operator, $value);
        });
    }

    /**
     * @param  Builder<Contact|Deal|Company>  $query
     */
    protected function applyDirectRule(string $entity, Builder $query, string $field, string $operator, mixed $value): void
    {
        if ($operator === 'contains' && filled($value)) {
            $like = '%'.addcslashes((string) $value, '%_').'%';
            match ($entity) {
                'contact' => $this->applyContactTextContains($query, $field, $like),
                'deal' => $this->applyDealTextContains($query, $field, $like),
                'company' => $this->applyCompanyTextContains($query, $field, $like),
                default => null,
            };

            return;
        }

        if ($operator === 'neq' && filled($value)) {
            $flat = [$field => $value];
            match ($entity) {
                'contact' => $this->applyContactNegation($query, $flat),
                'deal' => $this->applyDealNegation($query, $flat),
                'company' => $this->applyCompanyNegation($query, $flat),
                default => null,
            };

            return;
        }

        if (in_array($operator, ['gt', 'gte', 'lt', 'lte'], true) && filled($value)) {
            $this->applyNumericOrDateComparison($entity, $query, $field, $operator, $value);

            return;
        }

        if ($operator === 'is_set') {
            $this->applyIsSet($entity, $query, $field, true);

            return;
        }

        if ($operator === 'is_not_set') {
            $this->applyIsSet($entity, $query, $field, false);
        }

        if ($operator === 'in') {
            if (is_string($value) && filled($value)) {
                $value = array_values(array_filter(array_map('trim', explode(',', $value)), fn ($item) => $item !== ''));
            }

            if (is_array($value) && $value !== []) {
                match ($entity) {
                    'contact' => $this->applyContactIn($query, $field, $value),
                    'deal' => $this->applyDealIn($query, $field, $value),
                    'company' => $this->applyCompanyIn($query, $field, $value),
                    default => null,
                };
            }

            return;
        }

        if (in_array($operator, ['before', 'after'], true) && filled($value)) {
            $sqlOp = $operator === 'before' ? '<' : '>';
            $column = match ($field) {
                'created', 'created_at' => 'created_at',
                'last_activity', 'last_activity_at' => 'last_activity_at',
                'close_date' => $entity === 'deal' ? 'close_date' : null,
                default => null,
            };

            if ($column && in_array($entity, ['contact', 'deal', 'company'], true)) {
                if ($column === 'close_date') {
                    $query->whereDate('close_date', $sqlOp, (string) $value);
                } else {
                    $query->where($column, $sqlOp, (string) $value);
                }
            }
        }
    }

    /**
     * @param  Builder<Contact|Deal|Company>  $query
     */
    protected function applyCustomAttributeRule(string $entity, Builder $query, string $key, string $operator, mixed $value): void
    {
        $definitionId = CustomAttributeDefinition::query()
            ->where('entity', $entity)
            ->where('key', $key)
            ->value('id');

        if (! $definitionId) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where(function (Builder $outer) use ($entity, $definitionId, $operator, $value): void {
            $sub = CustomAttributeValue::query()
                ->where('entity_type', $entity)
                ->where('definition_id', $definitionId);

            match ($operator) {
                'eq' => filled($value) ? $sub->where('value', (string) $value) : null,
                'neq' => filled($value) ? $sub->where('value', '!=', (string) $value) : null,
                'contains' => filled($value)
                    ? $sub->where('value', 'like', '%'.addcslashes((string) $value, '%_').'%')
                    : null,
                'is_set' => $sub->whereNotNull('value')->where('value', '!=', ''),
                'is_not_set' => null,
                default => null,
            };

            if ($operator === 'is_not_set') {
                $outer->whereNotIn($outer->getModel()->getTable().'.id', $sub->select('entity_id'));

                return;
            }

            if ($operator === 'is_set' || ($operator !== 'is_not_set' && filled($value))) {
                $outer->whereIn($outer->getModel()->getTable().'.id', $sub->select('entity_id'));
            }
        });
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function ruleToFlatFilter(string $field, string $operator, mixed $value): ?array
    {
        if ($operator === 'is_true') {
            return [$field => true];
        }

        if ($operator === 'is_false') {
            return [$field => false];
        }

        if ($operator === 'eq' && filled($value)) {
            return [$field => $value];
        }

        if ($operator === 'in' && is_array($value) && $value !== []) {
            return [$field.'__in' => $value];
        }

        if ($operator === 'eq' && ($field === 'unanswered' || $field === 'unassigned')) {
            return [$field => true];
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function parseFilterGroups(mixed $incoming, mixed $fallback): ?array
    {
        $raw = $incoming ?? $fallback;
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : null;
        }

        if (! is_array($raw)) {
            return null;
        }

        $groups = collect($raw['groups'] ?? [])
            ->filter(fn ($group) => is_array($group))
            ->map(function (array $group) {
                $rules = collect($group['rules'] ?? [])
                    ->filter(fn ($rule) => is_array($rule) && filled($rule['field'] ?? null))
                    ->values()
                    ->all();

                return [
                    'logic' => in_array($group['logic'] ?? '', ['or', 'and'], true) ? $group['logic'] : 'and',
                    'rules' => $rules,
                ];
            })
            ->filter(fn (array $group) => $group['rules'] !== [])
            ->values()
            ->all();

        if ($groups === []) {
            return null;
        }

        return [
            'logic' => in_array($raw['logic'] ?? '', ['or', 'and'], true) ? $raw['logic'] : 'and',
            'groups' => $groups,
        ];
    }

    /**
     * @param  Builder<Contact>  $query
     */
    protected function applyContactSort(Builder $query, string $field, string $direction): Builder
    {
        if ($field === 'name') {
            return $query->orderBy('first_name', $direction)->orderBy('last_name', $direction);
        }

        if ($field === 'company') {
            return $query->leftJoin('companies', 'contacts.company_id', '=', 'companies.id')
                ->orderBy('companies.name', $direction)
                ->select('contacts.*');
        }

        if (in_array($field, ['email', 'city', 'wilaya', 'created_at', 'last_activity_at'], true)) {
            return $query->orderBy($field, $direction);
        }

        return $query;
    }

    /**
     * @param  Builder<Deal>  $query
     */
    protected function applyDealSort(Builder $query, string $field, string $direction): Builder
    {
        if ($field === 'title') {
            return $query->orderBy('title', $direction);
        }

        if ($field === 'amount') {
            return $query->orderBy('amount_cents', $direction);
        }

        if ($field === 'close_date') {
            return $query->orderBy('close_date', $direction);
        }

        if (in_array($field, ['created_at', 'last_activity_at'], true)) {
            return $query->orderBy($field, $direction);
        }

        return $query;
    }

    /**
     * @param  Builder<Company>  $query
     */
    protected function applyCompanySort(Builder $query, string $field, string $direction): Builder
    {
        if (in_array($field, ['name', 'city', 'wilaya', 'created_at'], true)) {
            return $query->orderBy($field, $direction);
        }

        return $query;
    }

    /**
     * @param  Builder<Contact>  $query
     * @param  array<string, mixed>  $filters
     */
    public function applyToContacts(Builder $query, array $filters): Builder
    {
        $this->applySearch($query, 'contact', $filters['q'] ?? null);

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

        if (filled($filters['wilaya__in'] ?? null) && is_array($filters['wilaya__in'])) {
            $query->where(function (Builder $inner) use ($filters) {
                $inner->whereIn('wilaya', $filters['wilaya__in'])
                    ->orWhereHas('company', fn (Builder $company) => $company->whereIn('wilaya', $filters['wilaya__in']));
            });
        }

        if (filled($filters['city__in'] ?? null) && is_array($filters['city__in'])) {
            $query->where(function (Builder $inner) use ($filters) {
                $inner->whereIn('city', $filters['city__in'])
                    ->orWhereHas('company', fn (Builder $company) => $company->whereIn('city', $filters['city__in']));
            });
        }

        if (filled($filters['deal_stage'] ?? null)) {
            $query->whereHas('deals.stage', fn (Builder $stage) => $stage->where('slug', $filters['deal_stage']));
        }

        if (! empty($filters['has_open_deal'])) {
            $query->whereHas('deals.stage', fn (Builder $stage) => $stage->where('is_won', false)->where('is_lost', false));
        }

        if (! empty($filters['unanswered'])) {
            $query->where('unanswered', true);
        }

        if (isset($filters['unanswered']) && $filters['unanswered'] === false) {
            $query->where('unanswered', false);
        }

        $this->applyBehaviorFilters($query, $filters);

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
        $this->applySearch($query, 'deal', $filters['q'] ?? null);

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
        $this->applySearch($query, 'company', $filters['q'] ?? null);

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

        if (! empty($filters['has_open_deal'])) {
            $query->whereHas('deals.stage', fn (Builder $stage) => $stage->where('is_won', false)->where('is_lost', false));
        }

        return $query;
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
        $query = $this->apply('contact', Contact::query()->forWorkspace($workspace), $filters);

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
        $query = $this->apply('deal', Deal::query()->forWorkspace($workspace), $filters);

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
     * @param  Builder<Contact>  $query
     * @param  array<string, mixed>  $filters
     */
    protected function applyBehaviorFilters(Builder $query, array $filters): void
    {
        if (filled($filters['enrolled_in_sequence'] ?? null)) {
            $sequenceId = (int) $filters['enrolled_in_sequence'];
            $query->whereHas('enrollments', fn (Builder $enrollment) => $enrollment
                ->where('sequence_id', $sequenceId)
                ->whereIn('status', ['active', 'paused', 'finished']));
        }

        if (! empty($filters['email_replied'])) {
            $query->whereHas('outboundMessages', fn (Builder $message) => $message->whereNotNull('replied_at'));
        }

        if (! empty($filters['email_opened'])) {
            $query->whereHas('outboundMessages', fn (Builder $message) => $message->whereNotNull('opened_at'));
        }
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
    protected function applySearch(Builder $query, string $entity, mixed $q): void
    {
        $term = is_string($q) ? trim($q) : '';

        if ($term === '') {
            return;
        }

        $like = '%'.addcslashes($term, '%_\\').'%';

        match ($entity) {
            'deal' => $query->where('title', 'like', $like),
            'company' => $query->where('name', 'like', $like),
            default => $query->where(function (Builder $inner) use ($like): void {
                $inner->where('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhere('email', 'like', $like);
            }),
        };
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

    /**
     * @param  Builder<Contact>  $query
     */
    protected function applyContactTextContains(Builder $query, string $field, string $like): void
    {
        match ($field) {
            'email' => $query->where('email', 'like', $like),
            'city' => $query->where('city', 'like', $like),
            'wilaya' => $query->where('wilaya', 'like', $like),
            default => $query->where(function (Builder $inner) use ($like) {
                $inner->where('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhere('email', 'like', $like);
            }),
        };
    }

    /**
     * @param  Builder<Deal>  $query
     */
    protected function applyDealTextContains(Builder $query, string $field, string $like): void
    {
        if ($field === 'title') {
            $query->where('title', 'like', $like);
        }
    }

    /**
     * @param  Builder<Company>  $query
     */
    protected function applyCompanyTextContains(Builder $query, string $field, string $like): void
    {
        match ($field) {
            'name' => $query->where('name', 'like', $like),
            'city' => $query->where('city', 'like', $like),
            'wilaya' => $query->where('wilaya', 'like', $like),
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     * @param  Builder<Contact>  $query
     */
    protected function applyContactNegation(Builder $query, array $filters): void
    {
        if (filled($filters['owner'] ?? null) && ($filters['owner'] ?? '') !== 'unassigned') {
            $query->where('owner_id', '!=', $filters['owner']);
        }

        if (filled($filters['city'] ?? null)) {
            $query->where('city', '!=', $filters['city']);
        }

        if (filled($filters['wilaya'] ?? null)) {
            $query->where('wilaya', '!=', $filters['wilaya']);
        }

        if (filled($filters['status'] ?? null)) {
            $query->whereDoesntHave('leads', fn (Builder $lead) => $lead->where('status', $filters['status']));
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     * @param  Builder<Deal>  $query
     */
    protected function applyDealNegation(Builder $query, array $filters): void
    {
        if (filled($filters['stage'] ?? null)) {
            $query->whereDoesntHave('stage', fn (Builder $stage) => $stage->where('slug', $filters['stage']));
        }

        if (filled($filters['owner'] ?? null) && ($filters['owner'] ?? '') !== 'unassigned') {
            $query->where('owner_id', '!=', $filters['owner']);
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     * @param  Builder<Company>  $query
     */
    protected function applyCompanyNegation(Builder $query, array $filters): void
    {
        if (filled($filters['city'] ?? null)) {
            $query->where('city', '!=', $filters['city']);
        }

        if (filled($filters['wilaya'] ?? null)) {
            $query->where('wilaya', '!=', $filters['wilaya']);
        }
    }

    /**
     * @param  Builder<Contact|Deal|Company>  $query
     */
    protected function applyNumericOrDateComparison(string $entity, Builder $query, string $field, string $operator, mixed $value): void
    {
        $sqlOp = match ($operator) {
            'gt' => '>',
            'gte' => '>=',
            'lt' => '<',
            'lte' => '<=',
            default => '=',
        };

        if ($entity === 'deal' && $field === 'amount') {
            $cents = is_numeric($value) ? (int) round(((float) $value) * 100) : 0;
            $query->where('amount_cents', $sqlOp, $cents);

            return;
        }

        $column = match ($field) {
            'created' => 'created_at',
            'last_activity' => 'last_activity_at',
            'close_date' => 'close_date',
            default => null,
        };

        if (! $column || ! in_array($entity, ['contact', 'deal', 'company'], true)) {
            return;
        }

        if ($entity === 'deal' && $column === 'close_date') {
            $query->whereDate('close_date', $sqlOp, (string) $value);

            return;
        }

        if (in_array($column, ['created_at', 'last_activity_at'], true)) {
            $query->where($column, $sqlOp, (string) $value);
        }
    }

    /**
     * @param  Builder<Contact>  $query
     * @param  array<int, mixed>  $values
     */
    protected function applyContactIn(Builder $query, string $field, array $values): void
    {
        if ($field === 'wilaya') {
            $query->where(function (Builder $inner) use ($values) {
                $inner->whereIn('wilaya', $values)
                    ->orWhereHas('company', fn (Builder $company) => $company->whereIn('wilaya', $values));
            });

            return;
        }

        if (in_array($field, ['city', 'owner'], true)) {
            $column = $field === 'owner' ? 'owner_id' : $field;
            $query->whereIn($column, $values);
        }
    }

    /**
     * @param  Builder<Deal>  $query
     * @param  array<int, mixed>  $values
     */
    protected function applyDealIn(Builder $query, string $field, array $values): void
    {
        if ($field === 'stage') {
            $query->whereHas('stage', fn (Builder $stage) => $stage->whereIn('slug', $values));
        }

        if ($field === 'owner') {
            $query->whereIn('owner_id', $values);
        }
    }

    /**
     * @param  Builder<Company>  $query
     * @param  array<int, mixed>  $values
     */
    protected function applyCompanyIn(Builder $query, string $field, array $values): void
    {
        if (in_array($field, ['city', 'wilaya'], true)) {
            $query->whereIn($field, $values);
        }
    }

    /**
     * @param  Builder<Contact|Deal|Company>  $query
     */
    protected function applyIsSet(string $entity, Builder $query, string $field, bool $set): void
    {
        $column = match ($field) {
            'owner' => 'owner_id',
            'email' => 'email',
            'city' => 'city',
            'wilaya' => 'wilaya',
            'close_date' => $entity === 'deal' ? 'close_date' : null,
            default => null,
        };

        if (! $column) {
            return;
        }

        if ($set) {
            $query->whereNotNull($column)->where($column, '!=', '');
        } else {
            $query->where(function (Builder $inner) use ($column) {
                $inner->whereNull($column)->orWhere($column, '');
            });
        }
    }
}
