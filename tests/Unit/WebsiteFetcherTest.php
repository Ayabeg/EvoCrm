<?php

use App\Services\Enrichment\WebsiteFetcher;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

it('validates each redirect hop before fetching it', function () {
    Http::fake([
        'https://public.example/start' => Http::response('', 302, ['Location' => 'http://127.0.0.1/admin']),
    ]);

    $result = app(WebsiteFetcher::class)->get('https://public.example/start');

    expect($result)
        ->toMatchArray([
            'ok' => false,
            'error' => 'Website redirect points to a blocked or invalid address.',
        ]);

    Http::assertSentCount(1);
});

it('follows a bounded relative redirect after normalizing it', function () {
    Http::fake([
        'https://public.example/start' => Http::response('', 302, ['Location' => '/about']),
        'https://public.example/about' => Http::response('<title>Public site</title>', 200),
    ]);

    $result = app(WebsiteFetcher::class)->get('https://public.example/start');

    expect($result)
        ->toMatchArray(['ok' => true, 'status' => 200])
        ->and($result['body'])->toContain('Public site');

    Http::assertSentCount(2);
});
