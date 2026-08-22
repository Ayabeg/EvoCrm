<?php

use App\Exceptions\UnofficialWhatsAppRefused;
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

it('leaves IMAP reply polling as a later stub', function () {
    expect(fn () => app(ImapReplyPoller::class)->poll())
        ->toThrow(RuntimeException::class);
});
