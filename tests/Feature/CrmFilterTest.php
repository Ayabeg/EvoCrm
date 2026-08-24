<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\SavedFilter;
use App\Models\User;
use App\Services\Crm\CrmFilter;

it('filters contacts by wilaya, unanswered, and unassigned', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $alger = Company::factory()->create(['workspace_id' => $workspace->id, 'city' => 'Alger', 'wilaya' => 'Alger']);
    $oran = Company::factory()->create(['workspace_id' => $workspace->id, 'city' => 'Oran', 'wilaya' => 'Oran']);

    $kept = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'company_id' => $alger->id,
        'city' => 'Alger',
        'wilaya' => 'Alger',
        'owner_id' => null,
        'unanswered' => true,
    ]);
    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'company_id' => $oran->id,
        'city' => 'Oran',
        'wilaya' => 'Oran',
        'owner_id' => $user->id,
        'unanswered' => false,
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts?wilaya=Alger&unanswered=1&unassigned=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->has('contacts', 1)
            ->where('contacts.0.id', $kept->id)
            ->has('listView.columnDefs')
            ->has('recordCount')
        );
});

it('saves a reusable list filter', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/filters', [
            'name' => 'Unanswered Alger',
            'entity' => 'contact',
            'city' => 'Alger',
            'unanswered' => true,
        ])
        ->assertRedirect();

    expect(SavedFilter::query()->where('name', 'Unanswered Alger')->exists())->toBeTrue();
});

it('saves filter groups and columns on a list view', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/filters', [
            'name' => 'Grouped view',
            'entity' => 'deal',
            'filter_groups' => json_encode([
                'logic' => 'and',
                'groups' => [
                    [
                        'logic' => 'or',
                        'rules' => [
                            ['field' => 'unassigned', 'operator' => 'is_true'],
                        ],
                    ],
                ],
            ]),
            'columns' => json_encode([
                ['id' => 'title', 'visible' => true, 'order' => 0],
                ['id' => 'amount', 'visible' => true, 'order' => 1],
            ]),
            'sort' => json_encode(['field' => 'amount', 'direction' => 'desc']),
        ])
        ->assertRedirect();

    $saved = SavedFilter::query()->where('name', 'Grouped view')->first();

    expect($saved)->not->toBeNull()
        ->and($saved->filters['filter_groups']['groups'][0]['rules'][0]['field'])->toBe('unassigned')
        ->and($saved->columns)->toBeArray()
        ->and($saved->sort['field'])->toBe('amount');
});

it('applies filter groups via CrmFilter', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $filter = app(CrmFilter::class);

    Deal::factory()->create(['workspace_id' => $workspace->id, 'owner_id' => null, 'title' => 'Open A']);
    Deal::factory()->create(['workspace_id' => $workspace->id, 'owner_id' => $user->id, 'title' => 'Owned']);

    $filters = [
        'filter_groups' => [
            'logic' => 'and',
            'groups' => [
                [
                    'logic' => 'and',
                    'rules' => [
                        ['field' => 'unassigned', 'operator' => 'is_true'],
                    ],
                ],
            ],
        ],
    ];

    expect($filter->count($workspace, 'deal', $filters))->toBe(1);
});

it('returns record counts on saved filters', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    Contact::factory()->count(2)->create(['workspace_id' => $workspace->id, 'city' => 'Alger']);
    Contact::factory()->create(['workspace_id' => $workspace->id, 'city' => 'Oran']);

    SavedFilter::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => $user->id,
        'name' => 'Alger contacts',
        'entity' => 'contact',
        'filters' => ['city' => 'Alger'],
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('savedFilters.0.record_count', 2)
        );
});
