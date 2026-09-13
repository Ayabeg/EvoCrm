<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('can move a deal stage with an ApiV1 token', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'API move',
        'amount_cents' => 250000,
        'currency' => 'DZD',
    ]);

    $qualified = $pipeline->stageBySlug('qualified');

    $this->withToken(apiToken($user))
        ->postJson("/api/v1/deals/{$deal->id}/move", ['stage_id' => $qualified->id])
        ->assertOk()
        ->assertJsonPath('data.id', $deal->id)
        ->assertJsonPath('data.stage_id', $qualified->id)
        ->assertJsonPath('data.stage.slug', 'qualified');

    expect($deal->fresh()->stage_id)->toBe($qualified->id);
});

it('cannot move a deal that belongs to another workspace via ApiV1', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $pipeline = $other->workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $other->workspace_id]);

    $deal = Deal::query()->create([
        'workspace_id' => $other->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Foreign deal',
        'amount_cents' => 1000,
        'currency' => 'DZD',
    ]);

    $this->withToken(apiToken($user))
        ->postJson("/api/v1/deals/{$deal->id}/move", [
            'stage_id' => $pipeline->stageBySlug('qualified')->id,
        ])
        ->assertNotFound();

    expect($deal->fresh()->stage_id)->toBe($pipeline->stageBySlug('new')->id);
});
