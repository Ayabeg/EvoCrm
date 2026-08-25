<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\RecordLayout;
use App\Models\SavedFilter;
use App\Models\User;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\PipelineManager;

it('shows workspace shared saved views to teammates', function () {
    $admin = User::factory()->create(['role' => WorkspaceRole::Admin]);
    $member = User::factory()->create([
        'workspace_id' => $admin->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    SavedFilter::query()->create([
        'workspace_id' => $admin->workspace_id,
        'user_id' => $admin->id,
        'name' => 'Team Alger',
        'entity' => 'contact',
        'visibility' => 'workspace',
        'filters' => ['wilaya' => 'Alger'],
    ]);

    SavedFilter::query()->create([
        'workspace_id' => $admin->workspace_id,
        'user_id' => $admin->id,
        'name' => 'Private view',
        'entity' => 'contact',
        'visibility' => 'private',
        'filters' => ['city' => 'Oran'],
    ]);

    $this->actingAs($member)
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('savedFilters', 1)
            ->where('savedFilters.0.name', 'Team Alger')
            ->where('savedFilters.0.visibility', 'workspace')
        );
});

it('lets admins publish workspace default views', function () {
    $admin = User::factory()->create(['role' => WorkspaceRole::Admin]);

    $this->actingAs($admin)
        ->post('/crm/filters', [
            'name' => 'Default Alger',
            'entity' => 'contact',
            'wilaya' => 'Alger',
            'visibility' => 'workspace',
            'is_workspace_default' => true,
        ])
        ->assertRedirect();

    $saved = SavedFilter::query()->where('name', 'Default Alger')->first();

    expect($saved)->not->toBeNull()
        ->and($saved->visibility)->toBe('workspace')
        ->and($saved->is_workspace_default)->toBeTrue();
});

it('applies contains and neq filter group operators', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $filter = app(CrmFilter::class);

    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'email' => 'alice@example.com',
        'wilaya' => 'Alger',
    ]);
    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'email' => 'bob@example.com',
        'wilaya' => 'Oran',
    ]);

    $containsFilters = [
        'filter_groups' => [
            'logic' => 'and',
            'groups' => [
                [
                    'logic' => 'and',
                    'rules' => [
                        ['field' => 'email', 'operator' => 'contains', 'value' => 'alice'],
                    ],
                ],
            ],
        ],
    ];

    $neqFilters = [
        'filter_groups' => [
            'logic' => 'and',
            'groups' => [
                [
                    'logic' => 'and',
                    'rules' => [
                        ['field' => 'wilaya', 'operator' => 'neq', 'value' => 'Alger'],
                    ],
                ],
            ],
        ],
    ];

    expect($filter->count($workspace, 'contact', $containsFilters))->toBe(1)
        ->and($filter->count($workspace, 'contact', $neqFilters))->toBe(1);
});

it('shows team visibility saved views to teammates', function () {
    $admin = User::factory()->create(['role' => WorkspaceRole::Admin]);
    $member = User::factory()->create([
        'workspace_id' => $admin->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    SavedFilter::query()->create([
        'workspace_id' => $admin->workspace_id,
        'user_id' => $admin->id,
        'name' => 'Team Oran',
        'entity' => 'contact',
        'visibility' => 'team',
        'filters' => ['wilaya' => 'Oran'],
    ]);

    $this->actingAs($member)
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('savedFilters', 1)
            ->where('savedFilters.0.name', 'Team Oran')
            ->where('savedFilters.0.visibility', 'team')
        );
});

it('applies in before and after filter operators', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $filter = app(CrmFilter::class);

    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'wilaya' => 'Alger',
        'created_at' => now()->subDays(10),
    ]);
    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'wilaya' => 'Oran',
        'created_at' => now()->subDays(2),
    ]);

    $inFilters = [
        'filter_groups' => [
            'logic' => 'and',
            'groups' => [[
                'logic' => 'and',
                'rules' => [['field' => 'wilaya', 'operator' => 'in', 'value' => 'Alger,Oran']],
            ]],
        ],
    ];

    expect($filter->count($workspace, 'contact', $inFilters))->toBe(2);
});

it('exports deals as csv', function () {
    $user = User::factory()->create();
    Deal::factory()->create(['workspace_id' => $user->workspace_id, 'title' => 'Export me']);

    $response = $this->actingAs($user)->get('/crm/deals/export');

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('text/csv');
});

it('lets admins create reorder and delete pipeline stages', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $manager = app(PipelineManager::class);

    $stage = $manager->createStage($pipeline, 'Discovery', 25);
    expect($stage->name)->toBe('Discovery')
        ->and($stage->probability)->toBe(25);

    $manager->updateStage($stage, ['name' => 'Qualified', 'probability' => 40]);
    expect($stage->fresh()->name)->toBe('Qualified')
        ->and($stage->fresh()->probability)->toBe(40);

    $stages = $pipeline->fresh()->stages()->orderBy('position')->pluck('id')->all();
    $reversed = array_reverse($stages);
    $manager->reorderStages($pipeline, $reversed);

    expect($pipeline->fresh()->stages()->orderBy('position')->pluck('id')->all())->toBe($reversed);

    $this->actingAs($user)
        ->post("/settings/pipelines/{$pipeline->id}/stages", [
            'name' => 'Pilot',
            'probability' => 60,
        ])
        ->assertRedirect();

    expect($pipeline->fresh()->stages()->where('name', 'Pilot')->exists())->toBeTrue();
});

it('persists record layouts per user on the server', function () {
    $user = User::factory()->create();

    $layout = [
        'cards' => [
            ['id' => 'timeline', 'visible' => true, 'order' => 0],
            ['id' => 'deals', 'visible' => false, 'order' => 1],
        ],
    ];

    $this->actingAs($user)
        ->putJson('/crm/record-layouts/contact', ['layout' => $layout])
        ->assertOk()
        ->assertJsonPath('layout.cards.0.id', 'timeline');

    $this->actingAs($user)
        ->getJson('/crm/record-layouts/contact')
        ->assertOk()
        ->assertJsonPath('layout.cards.1.visible', false);

    expect(RecordLayout::query()
        ->where('user_id', $user->id)
        ->where('entity', 'contact')
        ->exists())->toBeTrue();
});
