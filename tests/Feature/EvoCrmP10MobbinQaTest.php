<?php

use App\Models\Contact;
use App\Models\Lead;
use App\Models\User;

it('§9.1 home is guided left and activity feed right', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));

    expect($home)->toContain('data-home-guided')
        ->and($home)->toContain('GuidedActions')
        ->and($home)->toContain('CaughtUpStrip')
        ->and($home)->toContain('ActivityFeed')
        ->and($home)->toContain('lg:grid-cols-12')
        ->and($home)->not->toContain('Breeze')
        ->and($home)->not->toContain('Einstein');
});

it('§9.2 deals list has saved views, chips, and Create deal', function () {
    $index = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $toolbar = file_get_contents(resource_path('js/components/crm/list-toolbar.tsx'));
    $config = file_get_contents(app_path('Support/ListViewConfig.php'));

    expect($index)->toContain('primaryLabel="Create deal"')
        ->and($index)->toContain('DealLayoutToggle')
        ->and($index)->toContain('CrmListShell')
        ->and($toolbar)->toContain('SavedViewTabs')
        ->and($toolbar)->toContain('CrmActiveFilters')
        ->and($config)->toContain("'id' => 'health'")
        ->and($config)->toContain("'id' => 'next_step'");
});

it('§9.3 deals board has inactivity line and weighted footer', function () {
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));
    $pipelineBoard = file_get_contents(resource_path('js/pages/crm/deals/deal-pipeline-board.tsx'));
    $forecast = file_get_contents(resource_path('js/components/crm/deal-forecast-bar.tsx'));
    $kanban = file_get_contents(resource_path('js/components/crm/pipeline-kanban.tsx'));

    expect($pipelineBoard)->toContain('No activity for')
        ->and($board)->toContain('mark_inactive')
        ->and($board)->toContain('Create deal')
        ->and($forecast)->toContain('Weighted')
        ->and($kanban)->toContain('PipelineKanbanFooter');
});

it('§9.4 contact record is 3-pane with Ask Evo', function () {
    $contact = file_get_contents(resource_path('js/pages/crm/contacts/show.tsx'));
    $tabs = file_get_contents(resource_path('js/components/crm/record-activity.ts'));
    $ask = file_get_contents(resource_path('js/components/crm/ask-evo-panel.tsx'));

    expect($contact)->toContain('RecordShell')
        ->and($contact)->toContain('AskEvoPanel')
        ->and($tabs)->toContain("label: 'Overview'")
        ->and($tabs)->toContain("label: 'Activities'")
        ->and($tabs)->toContain("label: 'Intelligence'")
        ->and($ask)->toContain('ask-evo-rail')
        ->and($ask)->toContain('This record')
        ->and($contact)->not->toContain('Breeze')
        ->and($contact)->not->toContain('Slack');
});

it('§9.5 lead record has Path and Convert', function () {
    $lead = file_get_contents(resource_path('js/pages/crm/leads/show.tsx'));
    $path = file_get_contents(resource_path('js/components/crm/record-path.tsx'));
    $convert = file_get_contents(resource_path('js/components/crm/lead-conversion-dialog.tsx'));

    expect($lead)->toContain('RecordPath')
        ->and($lead)->toContain('LeadConversionDialog')
        ->and($path)->toContain('Mark Status as Complete')
        ->and($convert)->toContain('Convert lead to deal');
});

it('§9.6 sequence editor is a vertical step timeline', function () {
    $editor = file_get_contents(resource_path('js/components/outbound/sequence-step-editor.tsx'));

    expect($editor)->toContain('sequence-step-editor')
        ->and($editor)->toContain('Automated email')
        ->and($editor)->toContain('WhatsApp template')
        ->and($editor)->toContain('Call task')
        ->and($editor)->not->toContain('LinkedIn');
});

it('§9.7 anti-patterns stay out of the product', function () {
    $files = [
        resource_path('js/pages/home.tsx'),
        resource_path('js/pages/crm/contacts/show.tsx'),
        resource_path('js/pages/crm/leads/show.tsx'),
        resource_path('js/components/crm/ask-evo-panel.tsx'),
        resource_path('js/components/app-sidebar.tsx'),
        resource_path('js/components/outbound/sequence-step-editor.tsx'),
        base_path('routes/web.php'),
    ];

    foreach ($files as $path) {
        $src = file_get_contents($path);

        expect($src)->not->toContain('Breeze')
            ->and($src)->not->toContain('Copilot')
            ->and($src)->not->toContain('Einstein')
            ->and($src)->not->toContain('#0176D3')
            ->and($src)->not->toContain('#00A4BD');
    }

    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));
    $routes = file_get_contents(base_path('routes/web.php'));
    $ask = file_get_contents(resource_path('js/components/crm/ask-evo-panel.tsx'));

    expect($rail)->not->toContain('Lead board')
        ->and($rail)->not->toContain("href: '/leads'")
        ->and($routes)->toContain("Route::redirect('/leads', '/crm/deals/board')")
        ->and($ask)->not->toContain('Slack');
});

it('serves the live surfaces the Mobbin checklist names', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $user->id,
    ]);
    $lead = Lead::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'title' => 'QA intake',
        'status' => 'new',
        'source' => 'manual',
    ]);

    $this->actingAs($user)->get('/dashboard')->assertOk()
        ->assertInertia(fn ($page) => $page->component('home')->has('guidedActions')->has('activityFeed'));
    $this->actingAs($user)->get('/crm/deals')->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/index')->has('listView.columnDefs'));
    $this->actingAs($user)->get('/crm/deals/board')->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/board'));
    $this->actingAs($user)->get("/crm/contacts/{$contact->id}")->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/contacts/show')->has('askEvo.summary'));
    $this->actingAs($user)->get("/crm/leads/{$lead->id}")->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/leads/show'));
    $this->actingAs($user)->get('/leads')->assertRedirect('/crm/deals/board');
});

it('keeps the written QA checklist in lockstep with §9', function () {
    $checklist = file_get_contents(base_path('docs/evocrm-qa-checklist.md'));
    $plan = file_get_contents(base_path('docs/evocrm-plan.md'));

    expect($checklist)->toContain('1f571c85-2b3e-4f10-8125-f6aac6e49748')
        ->and($checklist)->toContain('9e67fda1-7a17-4149-91cf-6097a5c22e2d')
        ->and($checklist)->toContain('35b26dbf-8d2b-4f6c-a789-738b02d927b1')
        ->and($checklist)->toContain('f215a882-8c79-4bf8-8483-4d8ae465c3c1')
        ->and($checklist)->toContain('6443cff9-7eab-42f5-b620-1af1a9385cc6')
        ->and($checklist)->toContain('0a34649c-a49d-475b-9a2a-9da4128bc112')
        ->and($checklist)->toContain('DONE')
        ->and($plan)->toContain('EvoCrmP10MobbinQaTest');
});
