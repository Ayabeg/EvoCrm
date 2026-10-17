<?php

it('returns a request id and preserves a valid incoming request id', function () {
    $generated = $this->get('/up');

    $generated->assertOk()
        ->assertHeader('X-Request-Id');

    $requestId = (string) $generated->headers->get('X-Request-Id');
    expect($requestId)->not->toBe('');

    $this->withHeader('X-Request-Id', 'support-ticket-123')
        ->get('/up')
        ->assertOk()
        ->assertHeader('X-Request-Id', 'support-ticket-123');
});

it('replaces unsafe incoming request ids', function () {
    $response = $this->withHeader('X-Request-Id', str_repeat('x', 81))
        ->get('/up');

    $requestId = (string) $response->headers->get('X-Request-Id');

    expect($requestId)
        ->not->toBe(str_repeat('x', 81))
        ->and($requestId)->not->toBe('');
});
