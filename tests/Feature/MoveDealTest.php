<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('moves a deal on the HTTP board endpoint', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'HTTP move',
        'amount_cents' => 1000,
        'currency' => 'DZD',
    ]);

    $qualified = $pipeline->stageBySlug('qualified');

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $qualified->id])
        ->assertRedirect();

    expect($deal->fresh()->stage_id)->toBe($qualified->id);
});
