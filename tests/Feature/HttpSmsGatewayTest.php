<?php

use App\Services\Desk\HttpSmsGatewayClient;
use Illuminate\Support\Facades\Http;

it('posts to the configured DZ HTTP gateway with mapped fields', function () {
    config([
        'sms.sender' => 'EVOTECHLY',
        'sms.http.url' => 'https://sms.example.dz/api/send',
        'sms.http.method' => 'POST',
        'sms.http.key' => 'dz-secret',
        'sms.http.auth' => 'form',
        'sms.http.fields' => [
            'to' => 'to',
            'message' => 'message',
            'sender' => 'sender',
            'api_key' => 'api_key',
        ],
    ]);

    Http::fake([
        'https://sms.example.dz/api/send' => Http::response(['id' => 'dz-1', 'status' => 'ok'], 200),
    ]);

    $result = app(HttpSmsGatewayClient::class)->sendText('+213550188001', 'Salaam');

    expect($result['ok'])->toBeTrue()
        ->and($result['id'])->toBe('dz-1');

    Http::assertSent(fn ($request) => $request->url() === 'https://sms.example.dz/api/send'
        && $request['to'] === '+213550188001'
        && $request['message'] === 'Salaam'
        && $request['sender'] === 'EVOTECHLY'
        && $request['api_key'] === 'dz-secret');
});

it('sends a bearer token and SMSMode-style field names', function () {
    $client = new HttpSmsGatewayClient([
        'url' => 'https://api.smsmode.com/http/1.6/sendSMS.do',
        'method' => 'POST',
        'key' => 'smsmode-token',
        'auth' => 'bearer',
        'sender' => 'EVOTECHLY',
        'fields' => [
            'to' => 'numero',
            'message' => 'message',
            'sender' => 'emetteur',
            'api_key' => 'accessToken',
        ],
    ]);

    Http::fake([
        'https://api.smsmode.com/http/1.6/sendSMS.do' => Http::response(['smsId' => 'SM-42'], 200),
    ]);

    $result = $client->sendText('+213660188001', 'Rappel');

    expect($result['ok'])->toBeTrue();

    Http::assertSent(function ($request) {
        return $request->hasHeader('Authorization', 'Bearer smsmode-token')
            && $request['numero'] === '+213660188001'
            && $request['emetteur'] === 'EVOTECHLY'
            && ! isset($request['accessToken']);
    });
});

it('is unconfigured without a gateway URL and key', function () {
    config(['sms.http.url' => null, 'sms.http.key' => null]);

    expect(app(HttpSmsGatewayClient::class)->configured())->toBeFalse();
});
