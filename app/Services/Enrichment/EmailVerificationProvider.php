<?php

namespace App\Services\Enrichment;

interface EmailVerificationProvider
{
    /**
     * @return array{status: string, confidence: float, raw: array<string, mixed>, error?: string|null, evidence_url?: string|null}
     */
    public function verify(string $email): array;

    public function name(): string;
}
