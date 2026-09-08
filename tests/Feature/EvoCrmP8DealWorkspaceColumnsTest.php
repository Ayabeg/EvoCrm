<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('exposes health and next step on the deals list contract', function () {
    $config = file_get_contents(app_path('Support/ListViewConfig.php'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));

    expect($config)->toContain("'id' => 'health'")
        ->and($config)->toContain("'id' => 'next_step'")
        ->and($table)->toContain("case 'health'")
        ->and($table)->toContain("case 'next_step'");
});

it('returns health score and next meeting on the deals index', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Workspace column deal',
        'amount_cents' => 250_000,
        'currency' => 'DZD',
        'last_activity_at' => now(),
    ]);

    Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $deal->id,
        'contact_id' => $contact->id,
        'type' => 'meeting',
        'subject' => 'Discovery call',
        'due_at' => now('Africa/Algiers')->addDay()->setTime(10, 0),
        'done' => false,
        'owner_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->has('deals', 1)
            ->where('deals.0.title', 'Workspace column deal')
            ->where('deals.0.health.score', fn ($score) => is_int($score) && $score >= 0)
            ->where('deals.0.health.label', fn ($label) => is_string($label) && $label !== '')
            ->where('deals.0.next_step', fn ($step) => is_string($step) && str_contains($step, 'Discovery call'))
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->contains(fn ($def) => ($def['id'] ?? '') === 'health')
                && collect($defs)->contains(fn ($def) => ($def['id'] ?? '') === 'next_step'))
        );
});
