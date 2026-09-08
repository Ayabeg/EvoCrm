<?php

use App\Support\WhatsAppBusinessGraph;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

it('discovers the first WABA and phone number from Graph', function () {
    Http::fake([
        'https://graph.facebook.com/v21.0/me/businesses*' => Http::response([
            'data' => [['id' => 'biz-1', 'name' => 'Acme']],
        ], 200),
        'https://graph.facebook.com/v21.0/biz-1/owned_whatsapp_business_accounts*' => Http::response([
            'data' => [['id' => 'waba-1', 'name' => 'Acme WA']],
        ], 200),
        'https://graph.facebook.com/v21.0/waba-1/phone_numbers*' => Http::response([
            'data' => [[
                'id' => 'pn-1',
                'display_phone_number' => '+213 555 000 111',
                'verified_name' => 'Acme',
            ]],
        ], 200),
    ]);

    $found = app(WhatsAppBusinessGraph::class)->discover('user-token');

    expect($found)->toMatchArray([
        'business_id' => 'biz-1',
        'waba_id' => 'waba-1',
        'phone_number_id' => 'pn-1',
        'display_phone_number' => '+213 555 000 111',
        'verified_name' => 'Acme',
    ]);
});

it('returns null when the Facebook login has no WhatsApp Business account', function () {
    Http::fake([
        'https://graph.facebook.com/v21.0/me/businesses*' => Http::response([
            'data' => [['id' => 'biz-1', 'name' => 'Acme']],
        ], 200),
        'https://graph.facebook.com/v21.0/biz-1/owned_whatsapp_business_accounts*' => Http::response([
            'data' => [],
        ], 200),
    ]);

    expect(app(WhatsAppBusinessGraph::class)->discover('user-token'))->toBeNull();
});
