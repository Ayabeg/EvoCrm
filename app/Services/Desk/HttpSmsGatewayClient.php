<?php

namespace App\Services\Desk;

use Illuminate\Support\Facades\Http;

class HttpSmsGatewayClient implements SmsClient
{
    /** @var array<string, mixed> */
    protected array $settings;

    /**
     * @param  array<string, mixed>|null  $settings
     */
    public function __construct(?array $settings = null)
    {
        $this->settings = $settings ?? [
            'url' => config('sms.http.url'),
            'method' => config('sms.http.method', 'POST'),
            'key' => config('sms.http.key'),
            'auth' => config('sms.http.auth', 'form'),
            'sender' => config('sms.sender', 'EVOTECHLY'),
            'fields' => config('sms.http.fields', []),
        ];
    }

    public function configured(): bool
    {
        return filled($this->settings['url'] ?? null)
            && filled($this->settings['key'] ?? null);
    }

    public function sendText(string $to, string $body): array
    {
        $url = (string) ($this->settings['url'] ?? '');
        $method = strtoupper((string) ($this->settings['method'] ?? 'POST'));
        $key = (string) ($this->settings['key'] ?? '');
        $auth = (string) ($this->settings['auth'] ?? 'form');
        $sender = (string) ($this->settings['sender'] ?? config('sms.sender', 'EVOTECHLY'));
        $fields = is_array($this->settings['fields'] ?? null) ? $this->settings['fields'] : [];

        $payload = [
            ($fields['to'] ?? 'to') => $to,
            ($fields['message'] ?? 'message') => $body,
            ($fields['sender'] ?? 'sender') => $sender,
        ];

        $request = Http::acceptJson()->timeout(15);

        if ($auth === 'bearer') {
            $request = $request->withToken($key);
        } else {
            $payload[$fields['api_key'] ?? 'api_key'] = $key;
        }

        $response = $method === 'GET'
            ? $request->get($url, $payload)
            : $request->asForm()->post($url, $payload);

        $json = $response->json();
        $payloadBody = is_array($json) ? $json : ['raw' => $response->body()];

        if (! $response->successful()) {
            return [
                'ok' => false,
                'id' => null,
                'error' => (string) ($payloadBody['message'] ?? $payloadBody['error'] ?? $response->body() ?: 'SMS gateway send failed'),
                'body' => $payloadBody,
            ];
        }

        return [
            'ok' => true,
            'id' => $payloadBody['id'] ?? $payloadBody['sid'] ?? $payloadBody['smsId'] ?? $payloadBody['message_id'] ?? null,
            'error' => null,
            'body' => $payloadBody,
        ];
    }
}
