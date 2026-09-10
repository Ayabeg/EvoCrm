<?php

namespace App\Services\Desk;

class FakeSmsClient implements SmsClient
{
    /** @var list<array{to: string, body: string}> */
    public array $sends = [];

    public bool $ok = true;

    public string $error = 'SMS provider rejected the send';

    public function reset(): void
    {
        $this->sends = [];
        $this->ok = true;
        $this->error = 'SMS provider rejected the send';
    }

    public function configured(): bool
    {
        $twilio = filled(config('services.twilio.sid'))
            && filled(config('services.twilio.token'))
            && filled(config('services.twilio.from'));

        $http = filled(config('sms.http.url'))
            && filled(config('sms.http.key'));

        return $twilio || $http;
    }

    public function sendText(string $to, string $body): array
    {
        $this->sends[] = ['to' => $to, 'body' => $body];

        if (! $this->ok) {
            return ['ok' => false, 'id' => null, 'error' => $this->error, 'body' => null];
        }

        return [
            'ok' => true,
            'id' => 'SM-fake-'.count($this->sends),
            'error' => null,
            'body' => ['sid' => 'SM-fake-'.count($this->sends), 'to' => $to],
        ];
    }
}
