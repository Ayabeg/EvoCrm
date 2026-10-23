<?php

use App\Services\Enrichment\WebsiteFetcher;
use Illuminate\Support\Facades\Cache;
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

it('rejects private webhook destinations before resolving or sending', function () {
    expect(app(WebsiteFetcher::class)->publicRequestOptions('http://127.0.0.1/admin'))->toBeFalse();
});

it('honors the most specific robots rule and lets Allow win ties', function () {
    $robots = <<<'ROBOTS'
        User-agent: *
        Disallow: /private
        Disallow: /tmp/*
        Allow: /private/public
        Allow: /tmp/public$
    ROBOTS;

    $fetcher = app(WebsiteFetcher::class);

    expect($fetcher->pathAllowedByRobots('https://public.example/private/record', $robots))->toBeFalse()
        ->and($fetcher->pathAllowedByRobots('https://public.example/private/public', $robots))->toBeTrue()
        ->and($fetcher->pathAllowedByRobots('https://public.example/tmp/public', $robots))->toBeTrue()
        ->and($fetcher->pathAllowedByRobots('https://public.example/tmp/public/archive', $robots))->toBeFalse()
        ->and($fetcher->pathAllowedByRobots('https://public.example/about', $robots))->toBeTrue();
});

it('ignores robots rules for another user agent', function () {
    $robots = <<<'ROBOTS'
        User-agent: InternalBot
        Disallow: /
    ROBOTS;

    expect(app(WebsiteFetcher::class)->pathAllowedByRobots('https://public.example/private', $robots))->toBeTrue();
});

it('checks robots.txt before fetching a public page and fails closed when disallowed', function () {
    config([
        'app.env' => 'production',
        'evosales.enrichment.respect_robots' => true,
        'evosales.enrichment.force_robots_in_tests' => true,
    ]);
    Cache::flush();
    Http::fake([
        'https://public.example/robots.txt' => Http::response("User-agent: *\nDisallow: /private\n", 200),
        'https://public.example/private' => Http::response('<title>Secret</title>', 200),
    ]);

    $result = app(WebsiteFetcher::class)->get('https://public.example/private');

    expect($result)
        ->toMatchArray([
            'ok' => false,
            'robots_blocked' => true,
        ])
        ->and($result['error'])->toContain('robots.txt');

    Http::assertSentCount(1);
});

it('rechecks robots.txt after a cross-host redirect', function () {
    config([
        'app.env' => 'production',
        'evosales.enrichment.respect_robots' => true,
        'evosales.enrichment.force_robots_in_tests' => true,
    ]);
    Cache::flush();
    Http::fake([
        'https://public.example/robots.txt' => Http::response("User-agent: *\nAllow: /\n", 200),
        'https://public.example/start' => Http::response('', 302, ['Location' => 'https://other.example/final']),
        'https://other.example/robots.txt' => Http::response("User-agent: *\nDisallow: /final\n", 200),
        'https://other.example/final' => Http::response('<title>Blocked</title>', 200),
    ]);

    $result = app(WebsiteFetcher::class)->get('https://public.example/start');

    expect($result['ok'])->toBeFalse()
        ->and($result['robots_blocked'])->toBeTrue();

    Http::assertSentCount(3);
});
