<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Quote;
use App\Models\User;
use App\Services\Crm\QuoteTotals;

it('totals quote line items in DZD', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);
    $pipeline = $workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Quoted',
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/quotes", [
            'status' => 'draft',
            'items' => [
                ['name' => 'Workspace', 'quantity' => 1, 'unit_dzd' => 180000],
                ['name' => 'Onboarding', 'quantity' => 2, 'unit_dzd' => 20000],
            ],
        ])
        ->assertRedirect();

    $quote = Quote::query()->where('deal_id', $deal->id)->first();

    expect($quote->total_cents)->toBe(22_000_000)
        ->and($quote->items)->toHaveCount(2)
        ->and(app(QuoteTotals::class)->recount($quote)->total_cents)->toBe(22_000_000);
});
