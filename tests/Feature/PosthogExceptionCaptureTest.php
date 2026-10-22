<?php

use App\Models\User;
use App\Services\Analytics\ProductAnalytics;
use App\Support\PosthogPayload;

it('disables posthog capture when the api key is unset', function () {
    config(['services.posthog.api_key' => null]);

    $analytics = app(ProductAnalytics::class);

    expect($analytics->enabled())->toBeFalse();

    $analytics->captureException(new RuntimeException('password=super-secret token=abc'));
    $analytics->capture('probe', ['password' => 'hunter2', 'ok' => true]);

    expect($analytics->last('$exception'))->not->toBeNull()
        ->and($analytics->last('$exception')['properties']['message'])->not->toContain('super-secret')
        ->and($analytics->last('probe')['properties']['password'])->toBe('[redacted]')
        ->and($analytics->last('probe')['properties']['ok'])->toBeTrue();
});

it('shares posthog as disabled when the key is empty', function () {
    config(['services.posthog.api_key' => '']);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('posthog.enabled', false)
            ->where('posthog.key', null)
        );
});

it('redacts secrets from posthog payloads', function () {
    $clean = PosthogPayload::redact([
        'email' => 'owner@evotechly.com',
        'password' => 'secret-pass',
        'access_token' => 'tok_live',
        'nested' => ['api_key' => 'phc_secret', 'name' => 'ok'],
    ]);

    expect($clean['email'])->toBe('owner@evotechly.com')
        ->and($clean['password'])->toBe('[redacted]')
        ->and($clean['access_token'])->toBe('[redacted]')
        ->and($clean['nested']['api_key'])->toBe('[redacted]')
        ->and($clean['nested']['name'])->toBe('ok');
});

it('does not boot the frontend client when inertia says disabled', function () {
    $source = file_get_contents(resource_path('js/lib/posthog.ts'));

    expect($source)->toContain('config.enabled === false')
        ->and($source)->toContain('capture_exceptions: true')
        ->and($source)->toContain('before_send');
});

it('does not send direct user identity PII unless explicitly enabled', function () {
    $user = User::factory()->create(['name' => 'Private Owner', 'email' => 'owner@example.com']);
    $analytics = app(ProductAnalytics::class);

    $analytics->identify($user);
    expect($analytics->last('$identify')['properties'])
        ->not->toHaveKey('email')
        ->not->toHaveKey('name');

    config(['services.posthog.identify_pii' => true]);
    $analytics->identify($user);

    expect($analytics->last('$identify')['properties'])
        ->toMatchArray(['email' => 'owner@example.com', 'name' => 'Private Owner']);
});
