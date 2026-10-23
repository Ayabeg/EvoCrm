<?php

namespace App\Services\Enrichment;

final class DisabledEmailVerificationProvider implements EmailVerificationProvider
{
    public function name(): string
    {
        return 'unconfigured';
    }

    public function verify(string $email): array
    {
        return [
            'status' => 'unsupported',
            'confidence' => 0.0,
            'raw' => [
                'provider' => $this->name(),
                'email' => $email,
            ],
            'error' => 'No email verification provider is configured.',
        ];
    }
}
