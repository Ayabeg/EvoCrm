<?php

use App\Models\Contact;
use App\Models\Message;
use App\Models\Thread;
use App\Models\Workspace;
use App\Services\Evolution\EvolutionWebhookProcessor;
use App\Services\Webhooks\WebhookEndpointManager;

it('maps an Evolution Cloud webhook to contact, thread, and message', function () {
    $workspace = Workspace::factory()->create();

    $message = app(EvolutionWebhookProcessor::class)->handle($workspace, [
        'event' => 'MESSAGES_UPSERT',
        'instance' => 'evosales',
        'data' => [
            'key' => [
                'remoteJid' => '213555000111@s.whatsapp.net',
                'fromMe' => false,
                'id' => 'wamid.TEST',
            ],
            'pushName' => 'Khaled',
            'message' => [
                'conversation' => 'Salam, click-to-WhatsApp from Ads',
            ],
        ],
    ]);

    expect($message)->toBeInstanceOf(Message::class);
    expect(Contact::query()->where('phone_e164', '+213555000111')->exists())->toBeTrue();
    expect(Thread::query()->where('contact_id', $message->contact_id)->exists())->toBeTrue();
    expect($message->body)->toBe('Salam, click-to-WhatsApp from Ads');
    expect($workspace->fresh()->evolution_last_event)->toBe('MESSAGES_UPSERT');
});

it('returns the existing message when Evolution retries the same provider event', function () {
    $workspace = Workspace::factory()->create();
    $payload = [
        'event' => 'MESSAGES_UPSERT',
        'instance' => 'evosales',
        'data' => [
            'key' => [
                'remoteJid' => '213555000111@s.whatsapp.net',
                'fromMe' => false,
                'id' => 'wamid.RETRY',
            ],
            'pushName' => 'Khaled',
            'message' => ['conversation' => 'Only once'],
        ],
    ];

    $first = app(EvolutionWebhookProcessor::class)->handle($workspace, $payload);
    $second = app(EvolutionWebhookProcessor::class)->handle($workspace, $payload);

    expect($second?->id)->toBe($first?->id)
        ->and(Message::query()->where('workspace_id', $workspace->id)->count())->toBe(1);
});

it('accepts the public webhook endpoint', function () {
    $workspace = Workspace::factory()->create();
    $endpoint = app(WebhookEndpointManager::class)->forWorkspace($workspace, 'evolution');

    $this->postJson("/webhooks/evolution/{$endpoint->key}", [
        'event' => 'MESSAGES_UPSERT',
        'data' => [
            'phone' => '0555111222',
            'pushName' => 'Sara',
            'body' => 'Hello from Cloud',
        ],
    ])->assertOk()->assertJsonPath('ok', true);

    expect(Contact::query()->where('phone_e164', '+213555111222')->exists())->toBeTrue();
});
