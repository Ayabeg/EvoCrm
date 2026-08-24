<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('filters the contacts list to the current user on the My saved view', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);

    $mine = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $user->id,
        'first_name' => 'Mine',
    ]);
    Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $other->id,
        'first_name' => 'Theirs',
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts?view=my')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/hub')
            ->has('contacts', 1)
            ->where('contacts.0.id', $mine->id)
            ->where('activeFilters.view', 'my')
            ->where('activeFilters.owner', (string) $user->id)
        );
});

it('filters the deals list to the current user on the My saved view', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    $mine = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'owner_id' => $user->id,
        'title' => 'My deal',
        'currency' => 'DZD',
    ]);
    Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'owner_id' => $other->id,
        'title' => 'Their deal',
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get('/crm/deals?view=my')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/hub')
            ->has('deals', 1)
            ->where('deals.0.id', $mine->id)
            ->where('activeFilters.view', 'my')
        );
});
