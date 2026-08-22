<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('stores deal amount in DZD and records a stage change on the timeline', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);
    $pipeline = $workspace->defaultPipeline();

    $this->actingAs($user)
        ->post('/crm/deals', [
            'contact_id' => $contact->id,
            'title' => 'Clinic hub',
            'amount_dzd' => 180000,
        ])
        ->assertRedirect();

    $deal = Deal::query()->where('title', 'Clinic hub')->first();
    expect($deal->amount_cents)->toBe(18_000_000)
        ->and($deal->currency)->toBe('DZD');

    $qualified = $pipeline->stageBySlug('qualified');

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $qualified->id])
        ->assertRedirect();

    expect($deal->fresh()->stage->slug)->toBe('qualified')
        ->and(Activity::query()->where('deal_id', $deal->id)->where('type', 'stage_change')->exists())->toBeTrue();
});
