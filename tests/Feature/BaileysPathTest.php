<?php

use App\Exceptions\UnofficialWhatsAppRefused;
use App\Models\Mailbox;
use App\Models\Workspace;
use App\Services\Evolution\EvolutionCloudService;
use App\Services\Outbound\ImapReplyPoller;

it('refuses any Baileys or QR Evolution instance payload', function () {
    $service = app(EvolutionCloudService::class);

    expect(fn () => $service->createInstance(['integration' => 'WHATSAPP-BAILEYS']))
        ->toThrow(UnofficialWhatsAppRefused::class);

    expect(fn () => $service->createInstance(['qrcode' => true]))
        ->toThrow(UnofficialWhatsAppRefused::class);

    expect(fn () => $service->refuseUnofficial('QR'))
        ->toThrow(UnofficialWhatsAppRefused::class);
});

it('does not expose a Baileys or QR connection method', function () {
    $methods = get_class_methods(EvolutionCloudService::class);

    expect($methods)->not->toContain('connectWithQr');
    expect($methods)->not->toContain('startBaileys');
    expect($methods)->not->toContain('createBaileysInstance');
    expect($methods)->not->toContain('requestQrCode');
});

it('keeps Cloud-only literals in the Evolution service source', function () {
    $source = file_get_contents(app_path('Services/Evolution/EvolutionCloudService.php'));

    expect($source)->toContain("'integration' => 'WHATSAPP-BUSINESS'");
    expect($source)->toContain("'qrcode' => false");
    expect($source)->not->toContain('WHATSAPP-BAILEYS');
    expect($source)->not->toContain("'qrcode' => true");
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
