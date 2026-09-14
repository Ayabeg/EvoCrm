<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Support\Facades\Route;

/**
 * P03C — URL / query state ownership.
 * Canonical query contract. URL is source of truth. No competing React mirror.
 */

it('defines an explicit canonical list query contract with domain adapters', function () {
    $types = file_get_contents(resource_path('js/lib/list-query/types.ts'));
    $adapters = file_get_contents(resource_path('js/lib/list-query/adapters.ts'));
    $patch = file_get_contents(resource_path('js/lib/list-query/patch.ts'));
    $contract = file_get_contents(resource_path('js/lib/list-query/list-query-contract.ts'));

    expect($types)->toContain('export type CanonicalListQuery')
        ->and($types)->toContain('search: ListQuerySearch')
        ->and($types)->toContain('page: ListQueryPage')
        ->and($types)->toContain('savedViewId: ListQuerySavedViewId')
        ->and($types)->toContain('filterGroups:')
        ->and($types)->toContain('export type DomainListParams')
        ->and($types)->toContain("searchParam: 'q'")
        ->and($types)->not->toContain('Record<string, any>')
        ->and($types)->not->toContain('Record<string,any>');

    expect($adapters)->toContain("object: 'contact'")
        ->and($adapters)->toContain("object: 'company'")
        ->and($adapters)->toContain("object: 'deal'")
        ->and($adapters)->toContain("object: 'quote'")
        ->and($adapters)->toContain("object: 'lead'")
        ->and($adapters)->toContain("supportsQuery: false");

    expect($patch)->toContain('Meaningful changes reset page')
        ->and($patch)->toContain('Page-only patches keep search');

    expect($contract)->toContain('search preserves unrelated')
        ->and($contract)->toContain('search clear')
        ->and($contract)->toContain('filter preserves')
        ->and($contract)->toContain('filter clear')
        ->and($contract)->toContain('meaningful change resets page')
        ->and($contract)->toContain('page nav preserves search/filters/sort/view')
        ->and($contract)->toContain('sort preserves filters/search')
        ->and($contract)->toContain('saved-view change')
        ->and($contract)->toContain('unrelated permitted keys not destroyed')
        ->and($contract)->toContain('contacts request shape')
        ->and($contract)->toContain('companies request shape')
        ->and($contract)->toContain('deals request shape')
        ->and($contract)->toContain('quotes request shape')
        ->and($contract)->toContain('leads emit no list query');
});

it('treats URL and Inertia props as the list query source of truth', function () {
    $bar = file_get_contents(resource_path('js/ds/workspace/FilterBar.tsx'));
    $views = file_get_contents(resource_path('js/ds/workspace/SavedViews.tsx'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $navigate = file_get_contents(resource_path('js/lib/list-query/navigate.ts'));

    expect($bar)->toContain('fromActiveFilters(')
        ->and($bar)->toContain('navigateListQuery(')
        ->and($bar)->toContain('key={`q:${searchKey}`}')
        ->and($bar)->toContain('value={String(current.filters[field.id as ListQueryFilterKey] ?? \'\')}')
        ->and($bar)->not->toContain('useEffect')
        ->and($bar)->not->toContain('searchParams.set')
        ->and($bar)->not->toContain('history.replaceState');

    expect($views)->toContain('listQueryHref(')
        ->and($views)->toContain('applySavedFilter(')
        ->and($views)->toContain('<Link')
        ->and($views)->not->toContain('router.get')
        ->and($views)->not->toContain('onClick={() => onViewChange');

    expect($shell)->toContain('navigateListQuery(')
        ->and($shell)->toContain('Do not router.get here')
        ->and($shell)->toContain('viewHref(')
        ->and($shell)->toContain('crmListHref(')
        ->and($shell)->toContain('preserveState: true')
        ->and($shell)->not->toContain('router.get(');

    expect($workspace)->toContain('listPageHref')
        ->and($workspace)->toContain('fromActiveFilters(')
        ->and($workspace)->not->toContain('searchParams.set')
        ->and($workspace)->not->toContain('history.replaceState');

    expect($navigate)->toContain('router.get(href, {}, {')
        ->and($navigate)->toContain('preserveState: options.preserveState ?? true')
        ->and($navigate)->toContain('One user action → one Inertia GET');
});

it('does not clear P03B selection on query change and leaves columns and board routes alone', function () {
    $selection = file_get_contents(resource_path('js/ds/workspace/selection.ts'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $toggle = file_get_contents(resource_path('js/components/crm/deal-layout-toggle.tsx'));
    $queryLib = file_get_contents(resource_path('js/lib/list-query/types.ts'));

    expect($selection)->toContain('useWorkspaceSelection')
        ->and($contacts)->not->toContain('clearSelection()')
        ->and($deals)->not->toContain('clearSelection()')
        ->and($shell)->not->toContain('clearSelection');

    expect($shell)->toContain('useState<ListViewColumn[]>')
        ->and($shell)->toContain('setColumns(listView?.columns ?? [])');

    expect($toggle)->toContain('const listHref = `/crm/deals${query}`')
        ->and($toggle)->toContain('const boardHref = `/crm/deals/board${query}`')
        ->and($deals)->toContain('DealLayoutToggle')
        ->and($deals)->not->toContain('onModeChange');

    expect($queryLib)->not->toContain('columns:');
});

it('keeps existing backend request params for Contacts Companies Leads Deals and Quotes', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Acme Clinic']);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinic fit-out',
        'currency' => 'DZD',
    ]);
    Quote::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'total_cents' => 0,
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts?q=Amel&owner='.$user->id.'&created=7d&page=1&view=all')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->where('activeFilters.q', 'Amel')
            ->where('activeFilters.owner', (string) $user->id)
            ->where('activeFilters.created', '7d')
            ->where('activeFilters.view', 'all')
            ->has('paginator')
        );

    $this->actingAs($user)
        ->get('/crm/companies?q=Acme&city=Oran&view=all')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/companies/index')
            ->where('activeFilters.q', 'Acme')
            ->has('activeFilters.view')
        );

    $this->actingAs($user)
        ->get('/crm/deals?q=Clinic&stage=new&pipeline='.$pipeline->id.'&view=all')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->where('activeFilters.q', 'Clinic')
            ->where('activeFilters.stage', 'new')
            ->where('pipeline.id', $pipeline->id)
        );

    $this->actingAs($user)
        ->get('/crm/quotes?q=Clinic&status=draft&owner='.$user->id.'&created=30d&view=all')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->where('activeFilters.q', 'Clinic')
            ->where('activeFilters.status', 'draft')
            ->where('activeFilters.owner', (string) $user->id)
            ->where('activeFilters.created', '30d')
        );

    $this->actingAs($user)
        ->get('/crm/leads?q=ignored')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/index')
            ->has('leads')
            ->missing('activeFilters')
        );
});

it('does not change list routes for the five CRM objects', function () {
    expect(Route::getRoutes()->getByName('crm.contacts.index')?->uri())->toBe('crm/contacts')
        ->and(Route::getRoutes()->getByName('crm.companies.index')?->uri())->toBe('crm/companies')
        ->and(Route::getRoutes()->getByName('crm.leads.index')?->uri())->toBe('crm/leads')
        ->and(Route::getRoutes()->getByName('crm.deals.index')?->uri())->toBe('crm/deals')
        ->and(Route::getRoutes()->getByName('crm.deals.board')?->uri())->toBe('crm/deals/board')
        ->and(Route::getRoutes()->getByName('crm.quotes.index')?->uri())->toBe('crm/quotes');
});
