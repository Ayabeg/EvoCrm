<?php

use App\Models\Activity;
use App\Models\AuditEvent;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Integration;
use App\Models\Order;
use App\Models\Quote;
use App\Models\User;
use App\Services\Crm\QuoteDocument;
use App\Services\Crm\WorkflowRunner;
use Illuminate\Support\Facades\Http;

function publicQuote(User $user, array $overrides = []): Quote
{
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => $overrides['first_name'] ?? 'Karim',
        'phone' => $overrides['phone'] ?? '0550123456',
    ]);
    unset($overrides['first_name'], $overrides['phone']);

    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
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

function connectQuoteWhatsApp(User $user, string $provider = Integration::PROVIDER_WHATSAPP): Integration
{
    return Integration::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => $provider,
        'status' => 'connected',
        'access_token' => 'wa-token',
        'connected_at' => now(),
        'meta' => [
            'instance' => $provider === Integration::PROVIDER_WHATSAPP_BUSINESS
                ? 'evo-ws'.$user->workspace_id.'-waba'
                : 'evo-ws'.$user->workspace_id.'-wa',
            'state' => 'open',
        ],
    ]);
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
    expect(Order::query()->where('quote_id', $quote->id)->count())->toBe(1)
        ->and(Order::query()->where('quote_id', $quote->id)->value('status'))->toBe(Order::STATUS_PLACED);

    $this->post('/q/accept-me/accept')->assertRedirect();
    expect(Quote::query()->where('id', $quote->id)->whereNotNull('accepted_at')->count())->toBe(1);
    expect(Order::query()->where('quote_id', $quote->id)->count())->toBe(1);
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

it('sends a WhatsApp confirmation when the phone channel is connected', function () {
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendText/*' => Http::response(['key' => ['id' => 'wamid-1']], 200),
        'https://evolution.example.test/message/sendTemplate/*' => Http::response(['key' => ['id' => 'wamid-tpl']], 200),
    ]);

    $user = User::factory()->create();
    connectQuoteWhatsApp($user);
    $quote = publicQuote($user, ['public_token' => 'wa-accept']);

    $this->post('/q/wa-accept/accept')->assertRedirect();

    expect(Activity::query()->where('type', 'quote_accepted')->sole()->meta['whatsapp_confirm'] ?? null)->toBe('sent');

    Http::assertSent(fn ($request) => str_contains($request->url(), '/message/sendText/')
        && $request['number'] === '213550123456'
        && str_contains((string) $request['text'], 'Karim')
        && str_contains((string) $request['text'], '5 000 DZD'));
    Http::assertNotSent(fn ($request) => str_contains($request->url(), '/message/sendTemplate/'));
});

it('sends the Cloud quote_accepted template when WhatsApp Business is connected', function () {
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendTemplate/*' => Http::response(['key' => ['id' => 'wamid-tpl']], 200),
        'https://evolution.example.test/message/sendText/*' => Http::response(['key' => ['id' => 'wamid-1']], 200),
    ]);

    $user = User::factory()->create();
    connectQuoteWhatsApp($user, Integration::PROVIDER_WHATSAPP_BUSINESS);
    $user->workspace->forceFill([
        'meeting_wa_templates' => array_merge($user->workspace->meetingWhatsAppConfig(), [
            'quote' => 'evotechly_quote_accepted',
        ]),
    ])->save();
    publicQuote($user, ['public_token' => 'cloud-accept']);

    $this->post('/q/cloud-accept/accept')->assertRedirect();

    expect(Activity::query()->where('type', 'quote_accepted')->sole()->meta['whatsapp_confirm'] ?? null)->toBe('sent');

    Http::assertSent(fn ($request) => str_contains($request->url(), '/message/sendTemplate/')
        && $request['name'] === 'evotechly_quote_accepted'
        && $request['language'] === 'fr'
        && $request['number'] === '213550123456');
    Http::assertNotSent(fn ($request) => str_contains($request->url(), '/message/sendText/'));
});

it('still accepts the quote when WhatsApp confirmation fails', function () {
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendText/*' => Http::response(['message' => 'down'], 500),
        'https://evolution.example.test/message/sendTemplate/*' => Http::response(['message' => 'down'], 500),
    ]);

    $user = User::factory()->create();
    connectQuoteWhatsApp($user);
    $quote = publicQuote($user, ['public_token' => 'wa-fail']);

    $this->post('/q/wa-fail/accept')->assertRedirect();

    expect($quote->fresh()->status)->toBe('accepted')
        ->and(Activity::query()->where('type', 'quote_accepted')->sole()->meta['whatsapp_confirm'] ?? null)->toBe('failed');
});

it('rolls back quote acceptance when the workflow hook fails after the quote save', function () {
    $user = User::factory()->create();
    $quote = publicQuote($user, ['public_token' => 'wf-fail']);

    $workflows = Mockery::mock(WorkflowRunner::class);
    $workflows->shouldReceive('handleDealCreated')->once()->andThrow(new RuntimeException('workflow down'));
    $this->app->instance(WorkflowRunner::class, $workflows);

    $this->post('/q/wf-fail/accept')->assertServerError();

    $fresh = $quote->fresh();

    expect($fresh->status)->not->toBe('accepted')
        ->and($fresh->accepted_at)->toBeNull()
        ->and(Activity::query()->where('type', 'quote_accepted')->where('deal_id', $quote->deal_id)->exists())->toBeFalse()
        ->and(AuditEvent::query()->where('action', 'quote.accepted')->where('subject_id', $quote->id)->exists())->toBeFalse();
});

it('does not send WhatsApp again on a second accept', function () {
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendText/*' => Http::response(['key' => ['id' => 'wamid-1']], 200),
    ]);

    $user = User::factory()->create();
    connectQuoteWhatsApp($user);
    publicQuote($user, ['public_token' => 'wa-once']);

    $this->post('/q/wa-once/accept')->assertRedirect();
    Http::assertSentCount(1);

    Http::fake();
    $this->post('/q/wa-once/accept')->assertRedirect();
    Http::assertNothingSent();
});
