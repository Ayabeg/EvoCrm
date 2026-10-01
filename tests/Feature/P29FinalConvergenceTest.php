<?php

/**
 * P29 — Final functional convergence.
 * Prove one product after P00–P28. No V00. No new capabilities.
 */
use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Mailbox;
use App\Models\Quote;
use App\Models\User;
use App\Services\Ai\AskEvoContextRequest;
use App\Services\Ai\AskEvoContextResolver;
use App\Services\Ai\AskEvoLogger;
use App\Services\Crm\WorkflowExecutionRedactor;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;

it('locks the P29 audit, freeze law, and documented P27/P28 residue', function () {
    $audit = File::get(base_path('docs/release/P29-FINAL-AUDIT.md'));
    $header = File::get(resource_path('js/components/app-header.tsx'));
    $headerLayout = File::get(resource_path('js/layouts/app/app-header-layout.tsx'));
    $appLayout = File::get(resource_path('js/layouts/app-layout.tsx'));

    expect($audit)->toContain('AUTHORITATIVE BASE')
        ->and($audit)->toContain('fc57d94c379968f5a987075aeb426acf0b152180')
        ->and($audit)->toContain('READY_FOR_CONTABO')
        ->and($audit)->toContain('MERGE READY')
        ->and($audit)->toContain('P00–P29 FROZEN')
        ->and($audit)->toContain('READY FOR VISUAL PROGRAM')
        ->and($audit)->toContain('Do not start V00')
        ->and($audit)->not->toContain('START V00')
        ->and(is_dir(base_path('docs/visual/V00')))->toBeFalse();

    expect($header)->toContain('Delete in P28 after zero imports and tests allow')
        ->and($headerLayout)->toContain('Delete in P28 after zero imports and tests allow')
        ->and($appLayout)->toContain('app-sidebar-layout')
        ->and($appLayout)->not->toContain('app-header-layout');

    expect(File::exists(resource_path('js/components/nav-main.tsx')))->toBeFalse()
        ->and(File::exists(app_path('Http/Controllers/Crm/LeadBoardController.php')))->toBeFalse();
});

it('keeps one-product wiring frozen across list, peek, command, inbox, activation, and Ask Evo', function () {
    $contacts = File::get(resource_path('js/pages/crm/contacts/index.tsx'));
    $companies = File::get(resource_path('js/pages/crm/companies/index.tsx'));
    $leads = File::get(resource_path('js/pages/crm/leads/index.tsx'));
    $deals = File::get(resource_path('js/pages/crm/deals/index.tsx'));
    $quotes = File::get(resource_path('js/pages/crm/quotes/index.tsx'));
    $shell = File::get(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = File::get(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $qrd = File::get(resource_path('js/ds/workspace/QuickRecordDrawer.tsx'));
    $command = File::get(resource_path('js/components/crm/command-palette.tsx'));
    $inbox = File::get(resource_path('js/pages/desk/inbox.tsx'));
    $activation = File::get(app_path('Enums/ActivationStepId.php'));
    $ask = File::get(app_path('Services/Ai/AskEvoContextResolver.php'));
    $logger = File::get(app_path('Services/Ai/AskEvoLogger.php'));
    $overflow = File::get(resource_path('js/lib/responsive.ts'));
    $motion = File::get(resource_path('js/lib/motion.ts'));

    expect($contacts)->toContain('CrmListShell')
        ->and($companies)->toContain('CrmListShell')
        ->and($leads)->toContain('CrmListShell')
        ->and($deals)->toContain('CrmListShell')
        ->and($quotes)->toContain('CrmListShell')
        ->and($shell)->toContain('DataWorkspace')
        ->and($workspace)->toContain('data-crm="list-workspace"')
        ->and($workspace)->not->toContain('rows={[]}');

    expect($qrd)->toContain('onEscapeKeyDown')
        ->and($command)->toContain("from '@/evo/patterns/command-palette'")
        ->and($command)->not->toContain("from '@/components/aurora/command-palette'")
        ->and($command)->not->toContain('CommandPaletteV2');

    expect($inbox)->toContain('data-inbox="native"')
        ->and($inbox)->toContain('data-inbox="embed"');

    expect($activation)->toContain('add_crm_data')
        ->and($activation)->toContain('first_deal')
        ->and($activation)->toContain('first_activity')
        ->and($ask)->toContain('findAuthorized')
        ->and($logger)->toContain("'question_chars'")
        ->and($logger)->not->toContain('question_text')
        ->and($overflow)->toContain('PAGE_OVERFLOW_CLASS')
        ->and($motion)->toContain('P27_DRAWER_MS');
});

it('proves the compact CRM loop, isolation, activation CORE, settings save, and logout persistence', function () {
    Mail::fake();

    $this->get('/dashboard')->assertRedirect();

    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $stranger = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $foreign = Contact::factory()->create([
        'workspace_id' => $stranger->workspace_id,
        'first_name' => 'Foreign',
        'last_name' => 'Leak',
        'email' => 'foreign.leak@example.test',
    ]);

    $this->post(route('login.store'), [
        'email' => $owner->email,
        'password' => 'password',
    ])->assertRedirect(route('dashboard', absolute: false));

    $this->actingAs($owner)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->where('activation.activated', false)
            ->where('evoSearchIndex', []));

    $this->actingAs($owner)
        ->from('/crm/companies')
        ->post('/crm/companies', ['name' => 'P29 Clinic'])
        ->assertRedirect();

    $company = Company::query()->forWorkspace($owner->workspace)->where('name', 'P29 Clinic')->first();
    expect($company)->not->toBeNull();

    $this->actingAs($owner)
        ->from('/crm/contacts')
        ->post('/crm/contacts', [
            'first_name' => 'Lina',
            'last_name' => 'Hadj',
            'email' => 'lina.p29@evotechly.dz',
            'phone' => '0550199029',
            'company_id' => $company->id,
        ])
        ->assertRedirect();

    $contact = Contact::query()->forWorkspace($owner->workspace)->where('email', 'lina.p29@evotechly.dz')->first();
    expect($contact)->not->toBeNull()
        ->and($contact->phone_e164)->toStartWith('+213')
        ->and($contact->company_id)->toBe($company->id);

    $this->actingAs($owner)
        ->from('/crm/leads')
        ->post('/crm/leads', [
            'contact_id' => $contact->id,
            'title' => 'P29 inbound',
            'source' => 'manual',
        ])
        ->assertRedirect();

    $lead = Lead::query()->forWorkspace($owner->workspace)->where('title', 'P29 inbound')->first();
    expect($lead)->not->toBeNull();

    $this->actingAs($owner)
        ->from('/crm/deals')
        ->post('/crm/deals', [
            'title' => 'P29 retain',
            'contact_id' => $contact->id,
            'amount_dzd' => 180000,
        ])
        ->assertRedirect();

    $deal = Deal::query()->forWorkspace($owner->workspace)->where('title', 'P29 retain')->first();
    expect($deal)->not->toBeNull();

    $qualified = $owner->workspace->defaultPipeline()->stageBySlug('qualified');
    $this->actingAs($owner)
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $qualified->id])
        ->assertRedirect();
    expect($deal->fresh()->stage_id)->toBe($qualified->id);

    $this->actingAs($owner)
        ->post("/crm/leads/{$lead->id}/qualify", [
            'mode' => 'link',
            'deal_id' => $deal->id,
        ])
        ->assertRedirect();
    expect($deal->fresh()->lead_id)->toBe($lead->id)
        ->and($lead->fresh()->status)->toBe('qualified');

    $this->actingAs($owner)
        ->post('/crm/activities', [
            'type' => 'task',
            'subject' => 'P29 follow up',
            'body' => 'Before 17h',
            'due_at' => now('Africa/Algiers')->setTime(12, 0)->toDateTimeString(),
            'contact_id' => $contact->id,
            'deal_id' => $deal->id,
            'owner_id' => $owner->id,
        ])
        ->assertRedirect();

    expect(Activity::query()->forWorkspace($owner->workspace)->where('subject', 'P29 follow up')->exists())->toBeTrue();

    Mailbox::factory()->create(['workspace_id' => $owner->workspace_id]);
    $this->actingAs($owner)
        ->post("/crm/deals/{$deal->id}/quotes", [
            'status' => 'draft',
            'items' => [
                ['name' => 'Workspace', 'quantity' => 1, 'unit_dzd' => 180000],
            ],
        ])
        ->assertRedirect();

    $quote = Quote::query()->where('deal_id', $deal->id)->first();
    expect($quote)->not->toBeNull();

    $this->actingAs($owner)
        ->post("/crm/quotes/{$quote->id}/send")
        ->assertRedirect();
    expect($quote->fresh()->status)->toBe('sent');
    Mail::assertSentCount(1);

    $this->actingAs($owner)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.activated', true)
            ->where('activation.progress.completed', fn ($n) => (int) $n >= 3)
            ->where('work.items', fn ($items) => collect($items)->pluck('subject')->contains('P29 follow up'))
            ->where('recent.items', fn ($items) => collect($items)->pluck('subject')->contains('P29 follow up')));

    foreach (['contact' => $contact->id, 'company' => $company->id, 'lead' => $lead->id, 'deal' => $deal->id, 'quote' => $quote->id] as $type => $id) {
        $this->actingAs($owner)
            ->getJson("/crm/records/{$type}/{$id}/peek")
            ->assertOk();
    }

    $this->actingAs($owner)->get("/crm/contacts/{$contact->id}")->assertOk();
    $this->actingAs($owner)->get("/crm/companies/{$company->id}")->assertOk();
    $this->actingAs($owner)->get("/crm/leads/{$lead->id}")->assertOk();
    $this->actingAs($owner)->get("/crm/deals/{$deal->id}")->assertOk();
    $this->actingAs($owner)->get("/crm/quotes/{$quote->id}")->assertOk();
    $this->actingAs($owner)->get('/crm/deals/board')->assertOk();
    $this->actingAs($owner)->get('/inbox')->assertOk();
    $this->actingAs($owner)->get('/crm/activities')->assertOk();

    $this->actingAs($owner)->get("/crm/contacts/{$foreign->id}")->assertNotFound();
    $this->actingAs($owner)->getJson("/crm/records/contact/{$foreign->id}/peek")->assertNotFound();

    $context = app(AskEvoContextResolver::class)->resolve($owner, AskEvoContextRequest::fromInput([
        'page' => 'contact',
        'entity_type' => 'contact',
        'entity_id' => $foreign->id,
    ]));
    expect($context->available())->toBeFalse()
        ->and($context->unavailableCode)->toBe('unauthorized')
        ->and(json_encode($context->facts))->not->toContain('foreign.leak@example.test');

    $hits = $this->actingAs($owner)
        ->getJson('/crm/command/search?q=Foreign')
        ->assertOk()
        ->json('hits');
    expect(json_encode($hits))->not->toContain('Foreign Leak')
        ->and(json_encode($hits))->not->toContain('foreign.leak@example.test');

    $this->actingAs($member)
        ->put('/settings/workspace', ['simple_mode' => false])
        ->assertForbidden();
    $this->actingAs($member)
        ->post('/settings/pipelines', ['name' => 'Blocked'])
        ->assertForbidden();

    $this->actingAs($owner)
        ->from('/settings/workspace')
        ->put('/settings/workspace', ['simple_mode' => false])
        ->assertRedirect('/settings/workspace');
    expect($owner->workspace->fresh()->simple_mode)->toBeFalse();

    $this->actingAs($owner)
        ->get('/settings/workspace')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('simple_mode', false));

    $manager = app(WebhookEndpointManager::class);
    $endpoint = $manager->forWorkspace($owner->workspace, WebhookEndpointManager::PROVIDER_META_LEADS);
    $meta = $this->actingAs($owner)->get('/settings/meta');
    $meta->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('webhook_callback.masked_url', fn (mixed $url): bool => is_string($url) && ! str_contains($url, $endpoint->key)));
    expect(str_contains($meta->getContent(), $endpoint->key))->toBeFalse();

    $this->post(route('logout'))->assertRedirect();
    $this->get('/dashboard')->assertRedirect();

    $this->post(route('login.store'), [
        'email' => $owner->email,
        'password' => 'password',
    ])->assertRedirect(route('dashboard', absolute: false));

    $this->actingAs($owner)->get("/crm/contacts/{$contact->id}")->assertOk();
    $this->actingAs($owner)->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('deal.stage_id', $qualified->id));
});

it('keeps logging and workflow redaction on the frozen secret allowlists', function () {
    $logger = File::get(app_path('Services/Ai/AskEvoLogger.php'));
    $redactor = new WorkflowExecutionRedactor;

    expect($logger)->toContain("'workspace_id'")
        ->and($logger)->toContain("'outcome'")
        ->and($logger)->not->toContain('access_token')
        ->and(class_exists(AskEvoLogger::class))->toBeTrue();

    $error = $redactor->redactError('failed token=abcd Authorization: Bearer xyz');
    expect($error)->not->toContain('token=abcd')
        ->and($error)->not->toContain('Bearer xyz');
});
