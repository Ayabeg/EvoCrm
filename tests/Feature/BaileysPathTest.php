<?php

use App\Exceptions\UnofficialWhatsAppRefused;
use App\Models\Mailbox;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Evolution\EvolutionCloudService;
use App\Services\Outbound\ImapReplyPoller;
use Illuminate\Support\Facades\Http;

it('allows native Evolution WhatsApp Baileys and Business instance payloads', function () {
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');

    Http::fake([
        'https://evolution.example.test/instance/create' => Http::response([
            'instance' => ['instanceName' => 'ok', 'status' => 'connecting'],
        ], 201),
    ]);

    $workspace = User::factory()->create()->workspace;
    $service = app(EvolutionCloudService::class);

    expect($service->createWhatsAppInstance($workspace)['ok'])->toBeTrue();
    expect($service->createBusinessInstance($workspace, [
        'token' => 't',
        'number' => 'n',
        'businessId' => 'b',
    ])['ok'])->toBeTrue();
});

it('still refuses OpenWA and linked-device takeovers', function () {
    $service = app(EvolutionCloudService::class);

    expect(fn () => $service->createInstance(['integration' => 'OPENWA']))
        ->toThrow(UnofficialWhatsAppRefused::class);

    expect(fn () => $service->refuseUnofficial('linked-device'))
        ->toThrow(UnofficialWhatsAppRefused::class);
});

it('exposes Evolution WhatsApp QR helpers', function () {
    $methods = get_class_methods(EvolutionCloudService::class);

    expect($methods)->toContain('createWhatsAppInstance');
    expect($methods)->toContain('createBusinessInstance');
    expect($methods)->toContain('connectInstance');
    expect($methods)->not->toContain('startOpenWa');
});

it('polls IMAP replies only for configured mailboxes, and fails loudly without ext-imap', function () {
    $workspace = Workspace::factory()->create();

    // No IMAP-configured mailboxes → nothing to poll, no error.
    expect(app(ImapReplyPoller::class)->poll($workspace))->toBe([]);

    // A mailbox with IMAP settings but no ext-imap on the worker fails loudly.
    Mailbox::factory()->create([
        'workspace_id' => $workspace->id,
        'imap_host' => 'imap.example.test',
        'imap_username' => 'hello@example.test',
        'imap_password' => 'secret',
    ]);

    if (function_exists('imap_open')) {
        // With ext-imap present, an unreachable host returns an error row.
        $result = app(ImapReplyPoller::class)->poll($workspace);
        expect($result)->toHaveCount(1);
        expect($result[0]['error'])->not->toBeNull();
    } else {
        expect(fn () => app(ImapReplyPoller::class)->poll($workspace))
            ->toThrow(RuntimeException::class, 'ext-imap');
    }
});
