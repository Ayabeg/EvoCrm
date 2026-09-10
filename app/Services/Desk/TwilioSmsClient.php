<?php

namespace App\Services\Desk;

use Illuminate\Support\Facades\Http;

class TwilioSmsClient implements SmsClient
{
    public function configured(): bool
    {
        return filled(config('services.twilio.sid'))
            && filled(config('services.twilio.token'))
            && filled(config('services.twilio.from'));
    }

    public function sendText(string $to, string $body): array
    {
        $sid = (string) config('services.twilio.sid');
        $token = (string) config('services.twilio.token');
        $from = (string) config('services.twilio.from');

        // Twilio Message resource — https://www.twilio.com/docs/sms/api/message-resource#create-a-message-resource
        $response = Http::withBasicAuth($sid, $token)
            ->asForm()
            ->acceptJson()
            ->timeout(15)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To' => $to,
                'From' => $from,
                'Body' => $body,
            ]);

        $payload = $response->json() ?? [];

        if (! $response->successful()) {
            return [
                'ok' => false,
                'id' => null,
                'error' => (string) ($payload['message'] ?? $response->body() ?: 'Twilio SMS send failed'),
                'body' => is_array($payload) ? $payload : null,
            ];
        }

        return [
            'ok' => true,
            'id' => $payload['sid'] ?? null,
            'error' => null,
            'body' => $payload,
        ];
    }
}
