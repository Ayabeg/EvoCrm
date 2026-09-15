<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('rebuilds the deals list as a HubSpot-dense workspace on the Wave 0 shell', function () {
    $index = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $config = file_get_contents(app_path('Support/ListViewConfig.php'));

    expect($index)->toContain('data-crm="deals-workspace"')
        ->and($index)->toContain('CrmListShell')
        ->and($index)->toContain('resultMode="shared-table"')
        ->and($index)->toContain('primaryLabel="Create deal"')
        ->and($index)->toContain('onCreate=')
        ->and($index)->toContain('DealLayoutToggle')
        ->and($index)->toContain('dealEmptyState')
        ->and($index)->toContain('hasActiveListFilters')
        ->and($index)->not->toContain('ListViewTable')
        ->and($index)->not->toContain('CrmEmptyState')
        ->and($index)->not->toContain('CrmShell')
        ->and($index)->not->toContain('chrome="workspace"')
        ->and($index)->not->toContain('RoomShell')
        ->and($index)->not->toContain('HubSpot')
        ->and($index)->not->toContain('Breeze')
        ->and($index)->not->toContain('#00A4BD')
        ->and($index)->not->toContain('#0176D3');

    expect($table)->toContain('DealNameCell')
        ->and($table)->toContain("column.id === 'amount'")
        ->and($table)->toContain("entity === 'deal'");

    expect($config)->toContain("['id' => 'title', 'label' => 'Deal name', 'defaultVisible' => true]")
        ->and($config)->toContain("['id' => 'stage', 'label' => 'Stage', 'defaultVisible' => true]")
        ->and($config)->toContain("['id' => 'amount', 'label' => 'Amount', 'defaultVisible' => true]")
        ->and($config)->toContain("['id' => 'close_date', 'label' => 'Close date', 'defaultVisible' => true]")
        ->and($config)->toContain("['id' => 'owner', 'label' => 'Owner', 'defaultVisible' => true]")
        ->and($config)->toContain("['id' => 'company', 'label' => 'Company', 'defaultVisible' => true]")
        ->and($config)->toContain("['id' => 'contact', 'label' => 'Contact', 'defaultVisible' => true]")
        ->and($config)->toContain("'id' => 'health'")
        ->and($config)->toContain("'id' => 'next_step'");
});

it('rebuilds the pipeline board cards and columns to HubSpot density', function () {
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));
    $kanban = file_get_contents(resource_path('js/components/crm/pipeline-kanban.tsx'));

    $pipelineBoard = file_get_contents(resource_path('js/pages/crm/deals/deal-pipeline-board.tsx'));

    expect($board)->toContain('data-crm="deals-board"')
        ->and($board)->toContain('DealPipelineBoard')
        ->and($board)->toContain('DealLayoutToggle')
        ->and($board)->toContain('Create deal')
        ->and($board)->toContain('No deals in this pipeline')
        ->and($pipelineBoard)->toContain('/crm/deals/')
        ->and($pipelineBoard)->toContain('/move')
        ->and($pipelineBoard)->toContain('No activity for')
        ->and($pipelineBoard)->toContain('PipelineKanbanFooter')
        ->and($board)->not->toContain('CrmShell')
        ->and($board)->not->toContain('chrome="workspace"')
        ->and($board)->not->toContain('HubSpot')
        ->and($board)->not->toContain('#00A4BD')
        ->and($board)->not->toContain('#0176D3');

    expect($kanban)->toContain('uppercase')
        ->and($kanban)->toContain('Total:')
        ->and($kanban)->toContain('Weighted:')
        ->and($kanban)->toContain('bg-white')
        ->and($kanban)->toContain('No deals');
});

it('rebuilds the deal record as a 3-pane hub with identity on the left', function () {
    $show = file_get_contents(resource_path('js/pages/crm/deals/show.tsx'));

    expect($show)->toContain('data-crm="deals-record"')
        ->and($show)->toContain('RecordPageFrame')
        ->and($show)->toContain('RecordIdentity')
        ->and($show)->toContain('RecordActions')
        ->and($show)->toContain('RecordShell')
        ->and($show)->toContain('RecordActivityPanel')
        ->and($show)->toContain('AskEvoPanel')
        ->and($show)->toContain('AskEvoTrigger')
        ->and($show)->toContain('centerLabel="Activity"')
        ->and($show)->toContain('title="Contact"')
        ->and($show)->toContain('title="Company"')
        ->and($show)->toContain('title="Quotes"')
        ->and($show)->toContain('No contact linked')
        ->and($show)->toContain('No company linked')
        ->and($show)->toContain('No quotes yet')
        ->and($show)->toContain('/crm/deals/')
        ->and($show)->toContain('/move')
        ->and($show)->not->toContain('Breeze')
        ->and($show)->not->toContain('HubSpot')
        ->and($show)->not->toContain('Slack')
        ->and($show)->not->toContain('Copilot')
        ->and($show)->not->toContain('#00A4BD')
        ->and($show)->not->toContain('#0176D3');
});

it('serves the live deals list, board, and record with existing props', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'Samir',
        'last_name' => 'Benali',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinic fit-out',
        'amount_cents' => 650_000_00,
        'currency' => 'DZD',
        'close_date' => '2026-08-20',
    ]);

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->has('deals')
            ->has('listView.columnDefs')
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->contains(
                fn ($def) => ($def['id'] ?? '') === 'company' && ($def['defaultVisible'] ?? false)
            ) && collect($defs)->contains(
                fn ($def) => ($def['id'] ?? '') === 'contact' && ($def['defaultVisible'] ?? false)
            ) && collect($defs)->contains(
                fn ($def) => ($def['id'] ?? '') === 'stage'
            ))
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('recordCount')
            ->has('paginator')
            ->has('pipeline')
            ->has('stages')
        );

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/board')
            ->has('stages')
            ->has('deals')
            ->has('forecast')
            ->has('pipeline')
        );

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/show')
            ->where('deal.title', 'Clinic fit-out')
            ->has('associations.contact')
            ->has('associations.company')
            ->has('associations.quotes')
            ->has('timeline')
            ->has('stages')
            ->has('askEvo.summary')
        );
});
