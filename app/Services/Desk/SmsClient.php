<?php

namespace App\Services\Desk;

interface SmsClient
{
    public function configured(): bool;

    /**
     * @return array{ok: bool, id: string|null, error: string|null, body: array<string, mixed>|null}
     */
    public function sendText(string $to, string $body): array;
}
