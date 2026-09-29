<?php

use App\Support\TrustedProxies;

it('sets standard security headers on web responses without breaking framing', function () {
    $response = $this->get(route('login'));

    $response->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    expect((string) $response->headers->get('Permissions-Policy'))
        ->toContain('camera=()')
        ->and((string) $response->headers->get('Content-Security-Policy'))
        ->toContain('frame-ancestors')
        ->and(strtolower((string) $response->headers->get('X-Frame-Options')))
        ->not->toContain('deny')
        ->and($response->headers->get('Strict-Transport-Security'))->toBeNull();
});

it('sets HSTS only on HTTPS responses', function () {
    $response = $this->get('https://crm.evotechly.com/login');

    $response->assertOk()
        ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

it('parses trusted proxies from env-backed config', function () {
    config(['app.trusted_proxies' => '*']);
    expect(TrustedProxies::at())->toBe('*');

    config(['app.trusted_proxies' => '10.0.0.1, 10.0.0.2']);
    expect(TrustedProxies::at())->toBe(['10.0.0.1', '10.0.0.2']);

    config(['app.trusted_proxies' => 'none']);
    expect(TrustedProxies::at())->toBe([]);
});
