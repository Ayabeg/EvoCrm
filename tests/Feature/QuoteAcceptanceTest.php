<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Quote;
use App\Models\User;
use App\Services\Crm\QuoteDocument;

function publicQuote(User $user, array $overrides = []): Quote
{
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => 'Acceptable deal',
        'amount_cents' => 500_000,
        'currency' => 'DZD',
    ]);

    $quote = Quote::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'sent',
        'currency' => 'DZD',
        'total_cents' => 500_000,
        'public_token' => $overrides['public_token'] ?? 'token-one',
        'token_expires_at' => $overrides['token_expires_at'] ?? now()->addDay(),
        'revoked_at' => $overrides['revoked_at'] ?? null,
        'sent_at' => now(),
    ]);

    app(QuoteDocument::class)->freeze($quote);

    return $quote->fresh();
}

it('lets a customer accept a quote without signing in', function () {
    $user = User::factory()->create();
    $quote = publicQuote($user, ['public_token' => 'accept-me']);

    $this->get('/q/accept-me')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/quote')
            ->where('quote.id', $quote->id)
            ->where('quote.status', 'sent')
        );

    $this->post('/q/accept-me/accept')->assertRedirect();

    expect($quote->fresh()->status)->toBe('accepted')
        ->and($quote->fresh()->accepted_at)->not->toBeNull()
        ->and(Activity::query()->where('type', 'quote_accepted')->where('deal_id', $quote->deal_id)->exists())->toBeTrue();

    $this->post('/q/accept-me/accept')->assertRedirect();
    expect(Quote::query()->where('id', $quote->id)->whereNotNull('accepted_at')->count())->toBe(1);
});

it('rejects expired revoked and foreign quote tokens', function () {
    $user = User::factory()->create();
    publicQuote($user, [
        'public_token' => 'expired-token',
        'token_expires_at' => now()->subMinute(),
    ]);
    publicQuote($user, [
        'public_token' => 'revoked-token',
        'revoked_at' => now(),
    ]);
    $valid = publicQuote($user, ['public_token' => 'valid-token']);

    $this->get('/q/expired-token')->assertNotFound();
    $this->get('/q/revoked-token')->assertNotFound();
    $this->get('/q/missing-token')->assertNotFound();
    $this->post('/q/valid-token/accept')->assertRedirect();
    expect($valid->fresh()->accepted_at)->not->toBeNull();
});
