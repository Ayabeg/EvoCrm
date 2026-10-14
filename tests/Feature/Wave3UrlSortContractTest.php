<?php

use App\Models\Contact;
use App\Models\SavedFilter;
use App\Models\User;

it('ignores an invalid Contacts sort field and leaves url_sort empty', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/crm/contacts?sort=not_a_column&direction=asc')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.sort.field', 'created_at')
            ->where('activeFilters.sort.direction', 'desc')
            ->where('activeFilters.url_sort', null)
            ->where('activeFilters.url_direction', null)
        );
});

it('ignores an invalid sort direction and falls back to desc', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/crm/contacts?sort=name&direction=up')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.sort.field', 'name')
            ->where('activeFilters.sort.direction', 'desc')
            ->where('activeFilters.url_sort', 'name')
            ->where('activeFilters.url_direction', 'desc')
        );
});

it('ignores array-shaped sort[] query values', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/crm/contacts?sort[]=name&direction=asc')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.sort.field', 'created_at')
            ->where('activeFilters.url_sort', null)
            ->where('activeFilters.url_direction', null)
        );
});

it('ignores injection-shaped sort values', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/crm/contacts?sort=name;%20DROP%20TABLE%20contacts&direction=asc')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.sort.field', 'created_at')
            ->where('activeFilters.url_sort', null)
        );

    $this->actingAs($user)
        ->get('/crm/contacts?sort=created_at%20OR%201=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.sort.field', 'created_at')
            ->where('activeFilters.url_sort', null)
        );
});

it('lets a URL sort override a saved-view sort when both are present', function () {
    $user = User::factory()->create();

    $saved = SavedFilter::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'name' => 'Newest first',
        'entity' => 'contact',
        'filters' => [],
        'sort' => ['field' => 'created_at', 'direction' => 'desc'],
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts?filter_id='.$saved->id.'&sort=name&direction=asc')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.filter_id', $saved->id)
            ->where('activeFilters.sort.field', 'name')
            ->where('activeFilters.sort.direction', 'asc')
            ->where('activeFilters.url_sort', 'name')
            ->where('activeFilters.url_direction', 'asc')
        );
});

it('keeps URL sort on later Contacts pages so pagination links can reconstruct it', function () {
    $user = User::factory()->create();

    Contact::factory()->count(26)->create([
        'workspace_id' => $user->workspace_id,
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts?sort=name&direction=asc&page=2')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.sort.field', 'name')
            ->where('activeFilters.sort.direction', 'asc')
            ->where('activeFilters.url_sort', 'name')
            ->where('activeFilters.url_direction', 'asc')
            ->where('paginator.page', 2)
        );
});

it('returns 200 when quote or lead lists receive ?sort=subject', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/crm/quotes?sort=subject&direction=asc')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->where('activeFilters.sort.field', 'created_at')
            ->where('activeFilters.url_sort', null)
        );

    $this->actingAs($user)
        ->get('/crm/leads?sort=subject&direction=asc')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/index')
            ->where('activeFilters.sort.field', 'created_at')
            ->where('activeFilters.url_sort', null)
        );
});

it('source-locks url_sort through fromActiveFilters, listPageHref, FilterBar, and AdvancedFilterDrawer', function () {
    $serialize = file_get_contents(resource_path('js/lib/list-query/serialize.ts'));
    $listQuery = file_get_contents(resource_path('js/components/crm/list-query.ts'));
    $bar = file_get_contents(resource_path('js/ds/workspace/FilterBar.tsx'));
    $drawer = file_get_contents(resource_path('js/ds/workspace/AdvancedFilterDrawer.tsx'));
    $surface = file_get_contents(resource_path('js/ds/workspace/surface.ts'));

    expect($serialize)
        ->toContain('url_sort?: unknown')
        ->toContain('url_direction?: unknown')
        ->toContain('filters.url_sort ?? filters.sort')
        ->toContain('filters.url_direction ?? filters.direction');

    expect($listQuery)
        ->toContain('export function listPageHref')
        ->toContain('hrefFromActiveFilters(');

    expect($surface)
        ->toContain('return listPageHref(basePath, filters, page, extraQuery)');

    expect($bar)
        ->toContain('fromActiveFilters(filters, extraQuery)')
        ->toContain('navigateListQuery(basePath, current,');

    expect($drawer)
        ->toContain('fromActiveFilters(filters, extraQuery)')
        ->toContain('name="sort"')
        ->toContain('name="direction"')
        ->toContain('current.sort.field')
        ->toContain('current.sort.direction');
});
