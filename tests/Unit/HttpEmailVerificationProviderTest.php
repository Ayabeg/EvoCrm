<?php

use App\Services\Enrichment\HttpEmailVerificationProvider;
use App\Services\Enrichment\TransientEnrichmentException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

it('normalizes a provider valid result and never stores the API response wholesale', function () {
    config([
        'evosales.enrichment.email_verification_provider' => 'approved-verifier',
        'evosales.enrichment.email_verification_url' => 'https://verify.example.test/check',
        'evosales.enrichment.email_verification_api_key' => 'secret-key',
    ]);
    Http::fake([
        'https://verify.example.test/check' => Http::response([
            'status' => 'valid',
            'reason' => 'mailbox accepted',
            'private_debug_payload' => 'must not be persisted',
        ], 200),
    ]);

    $result = app(HttpEmailVerificationProvider::class)->verify('Owner@Clinic-Atlas.dz');

    expect($result)
        ->toMatchArray([
            'status' => 'verified',
            'confidence' => 0.99,
        ])
        ->and($result['raw'])->toMatchArray([
            'provider' => 'approved-verifier',
            'provider_status' => 'valid',
            'reason' => 'mailbox accepted',
        ])
        ->and($result['raw'])->not->toHaveKey('private_debug_payload');

    Http::assertSent(fn ($request): bool => $request->hasHeader('Authorization', 'Bearer secret-key')
        && $request->data() === ['email' => 'owner@clinic-atlas.dz']);
});

it('maps catch-all responses conservatively and retries provider outages', function () {
    config([
        'evosales.enrichment.email_verification_url' => 'https://verify.example.test/check',
        'evosales.enrichment.email_verification_api_key' => 'secret-key',
    ]);
    Http::fake([
        'https://verify.example.test/check' => Http::sequence()
            ->push(['is_catch_all' => true], 200)
            ->push([], 503),
    ]);

    $provider = app(HttpEmailVerificationProvider::class);
    $catchAll = $provider->verify('owner@clinic-atlas.dz');

    expect($catchAll['status'])->toBe('catch_all')
        ->and($catchAll['confidence'])->toBe(0.75)
        ->and(fn () => $provider->verify('owner@clinic-atlas.dz'))->toThrow(TransientEnrichmentException::class);
});
