<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('rebuilds the contacts list as a HubSpot-dense workspace on the Wave 0 shell', function () {
    $index = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $table = file_get_contents(resource_path('js/evo/data/crm-list/table.tsx')).file_get_contents(resource_path('js/evo/data/crm-list/cells.tsx'));
    $query = file_get_contents(resource_path('js/components/crm/list-query.ts'));
    $config = file_get_contents(app_path('Support/ListViewConfig.php'));

    expect($index)->toContain('data-crm="contacts-workspace"')
        ->and($index)->toContain('CrmListShell')
        ->and($index)->toContain('resultMode="shared-table"')
        ->and($index)->toContain('primaryLabel="Create contact"')
        ->and($index)->toContain('contactEmptyState')
        ->and($index)->toContain('hasActiveListFilters')
        ->and($index)->toContain('onCreate=')
        ->and($index)->not->toContain('CrmShell')
        ->and($index)->not->toContain('chrome="workspace"')
        ->and($index)->not->toContain('RoomShell')
        ->and($index)->not->toContain('HubSpot')
        ->and($index)->not->toContain('Breeze')
        ->and($index)->not->toContain('#00A4BD')
        ->and($index)->not->toContain('#0176D3');

    $identity = file_get_contents(resource_path('js/pages/crm/contacts/contact-columns.tsx'));

    expect($table)->toContain('ContactNameCell')
        ->and($table)->toContain('lead_status');

    expect($identity)->toContain('ContactIdentityCell')
        ->and($identity)->toContain('contactInitials');

    expect($query)->toContain('filters.q')
        ->and($query)->toContain('query !== \'\'');

    expect($config)->toContain("['id' => 'lead_status', 'label' => 'Lead status', 'defaultVisible' => true]");
});

it('rebuilds the contact record as a 3-pane hub with identity on the left', function () {
    $show = file_get_contents(resource_path('js/pages/crm/contacts/show.tsx'));

    expect($show)->toContain('data-crm="contacts-record"')
        ->and($show)->toContain('RecordPageFrame')
        ->and($show)->toContain('RecordIdentity')
        ->and($show)->toContain('RecordActions')
        ->and($show)->toContain('RecordShell')
        ->and($show)->toContain('RecordActivityPanel')
        ->and($show)->toContain('AskEvoPanel')
        ->and($show)->toContain('AskEvoTrigger')
        ->and($show)->toContain('DeskThreadCard')
        ->and($show)->toContain('whatsappHref')
        ->and($show)->toContain('TicketsRelatedCard')
        ->and($show)->toContain('title="Company"')
        ->and($show)->toContain('title="Deals"')
        ->and($show)->toContain('centerLabel="Activity"')
        ->and($show)->toContain('No company linked')
        ->and($show)->toContain('No deals yet')
        ->and($show)->not->toContain('Breeze')
        ->and($show)->not->toContain('HubSpot')
        ->and($show)->not->toContain('Slack')
        ->and($show)->not->toContain('Copilot')
        ->and($show)->not->toContain('Help Desk')
        ->and($show)->not->toContain('Cases')
        ->and($show)->not->toContain('#00A4BD')
        ->and($show)->not->toContain('#0176D3');
});

it('serves the live contacts list and record with existing props', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
        'lead_status' => 'open',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinic fit-out',
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->has('contacts')
            ->has('listView.columnDefs')
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->contains(
                fn ($def) => ($def['id'] ?? '') === 'lead_status'
            ))
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('recordCount')
            ->has('paginator')
        );

    $this->actingAs($user)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/show')
            ->where('contact.lead_status', 'open')
            ->has('associations.company')
            ->has('associations.deals', 1)
            ->has('timeline')
            ->has('askEvo.summary')
        );
});
