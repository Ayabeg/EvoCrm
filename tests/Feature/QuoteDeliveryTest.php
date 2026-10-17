<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Mailbox;
use App\Models\Order;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

function quotedDeal(User $user): Deal
{
    $pipeline = $user->workspace->defaultPipeline();

    return Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create([
            'workspace_id' => $user->workspace_id,
            'email' => 'buyer@clinic.dz',
        ])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => 'Quoted clinic deal',
        'amount_cents' => 1_800_000,
        'currency' => 'DZD',
    ]);
}

it('emails an immutable quote snapshot and records the send', function () {
    Mail::fake();
    $user = User::factory()->create();
    Mailbox::factory()->create(['workspace_id' => $user->workspace_id]);
    $deal = quotedDeal($user);

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/quotes", [
            'notes' => 'Valid 14 days',
            'items' => [
                ['name' => 'EvoSales workspace', 'quantity' => 1, 'unit_dzd' => 180000],
            ],
        ])
        ->assertRedirect();

    $quote = Quote::query()->where('deal_id', $deal->id)->sole();

    $this->actingAs($user)
        ->get("/crm/quotes/{$quote->id}/preview")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');

    $this->actingAs($user)
        ->post("/crm/quotes/{$quote->id}/send")
        ->assertRedirect();

    $quote->refresh();
    expect($quote->status)->toBe('sent')
        ->and($quote->sent_at)->not->toBeNull()
        ->and($quote->snapshot_html)->toContain('EvoSales workspace')
        ->and($quote->snapshot['total_cents'])->toBe(18_000_000)
        ->and($quote->public_token)->not->toBeNull()
        ->and(Activity::query()->where('type', 'quote_sent')->where('deal_id', $deal->id)->exists())->toBeTrue();

    Mail::assertSentCount(1);

    $this->actingAs($user)
        ->put("/crm/quotes/{$quote->id}", [
            'notes' => 'changed after send',
        ])
        ->assertStatus(422);

    expect($quote->fresh()->notes)->toBe('Valid 14 days')
        ->and($quote->fresh()->snapshot['items'][0]['name'])->toBe('EvoSales workspace');

    $quote->forceFill([
        'public_token' => 'paid-order-token',
        'token_expires_at' => now()->addDay(),
    ])->save();

    $this->post('/q/paid-order-token/accept')->assertRedirect();

    $this->actingAs($user)
        ->post("/crm/quotes/{$quote->id}/mark-paid")
        ->assertRedirect();

    expect(Order::query()->where('quote_id', $quote->id)->value('status'))->toBe(Order::STATUS_PAID)
        ->and(Order::query()->where('quote_id', $quote->id)->value('paid_at'))->not->toBeNull();
});
