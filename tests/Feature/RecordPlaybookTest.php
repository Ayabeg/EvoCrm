<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Playbook;
use App\Models\User;

it('lets owners create a playbook and shows it on the matching record', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $contact = Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'first_name' => 'Amine',
    ]);

    $this->actingAs($owner)
        ->post('/settings/playbooks', [
            'entity' => 'contact',
            'name' => 'First Alger call',
            'body' => 'Confirm wilaya, then book a site visit.',
        ])
        ->assertRedirect();

    $playbook = Playbook::query()->where('name', 'First Alger call')->sole();

    $this->actingAs($owner)
        ->get('/settings/playbooks')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/playbooks')
            ->has('playbooks', 1)
            ->where('playbooks.0.name', 'First Alger call'));

    $this->actingAs($owner)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('playbooks', 1)
            ->where('playbooks.0.id', $playbook->id)
            ->where('playbooks.0.body', 'Confirm wilaya, then book a site visit.'));
});

it('shows deal playbooks on the deal record only', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $contact = Contact::factory()->create(['workspace_id' => $owner->workspace_id]);
    $pipeline = $owner->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $owner->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('demo')->id,
        'title' => 'Clinic demo',
        'amount_cents' => 250000,
        'currency' => 'DZD',
    ]);

    Playbook::query()->create([
        'workspace_id' => $owner->workspace_id,
        'entity' => 'deal',
        'name' => 'Demo script',
        'body' => 'Walk the pipeline, then ask for the quote.',
        'position' => 0,
    ]);
    Playbook::query()->create([
        'workspace_id' => $owner->workspace_id,
        'entity' => 'contact',
        'name' => 'Contact only',
        'body' => 'Do not show on deals.',
        'position' => 0,
    ]);

    $this->actingAs($owner)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('playbooks', 1)
            ->where('playbooks.0.name', 'Demo script'));
});

it('does not leak playbooks across workspaces and blocks members from settings', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);
    $other = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $foreign = Playbook::query()->create([
        'workspace_id' => $other->workspace_id,
        'entity' => 'contact',
        'name' => 'Other script',
        'body' => 'Secret',
        'position' => 0,
    ]);

    $this->actingAs($member)->get('/settings/playbooks')->assertForbidden();
    $this->actingAs($member)
        ->post('/settings/playbooks', [
            'entity' => 'contact',
            'name' => 'Blocked',
            'body' => 'No',
        ])
        ->assertForbidden();

    $this->actingAs($owner)
        ->get('/settings/playbooks')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('playbooks', 0));

    $this->actingAs($owner)
        ->put("/settings/playbooks/{$foreign->id}", [
            'entity' => 'contact',
            'name' => 'Hijack',
            'body' => 'No',
        ])
        ->assertNotFound();
});
