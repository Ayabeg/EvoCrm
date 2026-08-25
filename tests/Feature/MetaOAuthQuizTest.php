<?php

use App\Models\Integration;
use App\Models\User;

it('returns meta connection state on the finish setup step', function () {
    $user = User::factory()->create();

    Integration::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => Integration::PROVIDER_META,
        'status' => 'connected',
        'access_token' => 'test-token',
        'scopes' => ['pages_show_list'],
        'meta' => [
            'name' => 'Test User',
            'pages' => [['id' => '123', 'name' => 'Evotechly Page']],
        ],
        'connected_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/settings/setup/meta?step=finish')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('metaState.connected', true)
            ->where('metaState.account_name', 'Test User')
            ->has('metaState.pages', 1)
            ->has('metaState.unlocks')
        );
});

it('saves the selected facebook page on finish step', function () {
    $user = User::factory()->create();

    $integration = Integration::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => Integration::PROVIDER_META,
        'status' => 'connected',
        'access_token' => 'test-token',
        'meta' => [
            'pages' => [
                ['id' => '111', 'name' => 'Page A'],
                ['id' => '222', 'name' => 'Page B'],
            ],
        ],
        'connected_at' => now(),
    ]);

    $this->actingAs($user)
        ->post('/settings/setup/meta/page', ['page_id' => '222'])
        ->assertRedirect('/settings/setup/meta?step=finish');

    $integration->refresh();

    expect($integration->meta['selected_page_id'])->toBe('222')
        ->and($integration->meta['selected_page_name'])->toBe('Page B');
});

it('redirects meta oauth callback to setup finish when return=setup', function () {
    config()->set('meta.app_id', 'test-app');
    config()->set('meta.app_secret', 'test-secret');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['auth.meta.return' => 'setup'])
        ->get('/auth/meta?return=setup')
        ->assertRedirect();

    expect(session('auth.meta.return'))->toBe('setup');
});

it('links meta connect from apps marketplace to setup wizard', function () {
    config()->set('meta.app_id', 'test-app');
    config()->set('meta.app_secret', 'test-secret');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/apps')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('apps.0.key', 'meta')
            ->where('apps.0.connect_url', '/settings/setup/meta')
        );
});

it('requires meta to be configured for connect url in wizard', function () {
    config()->set('meta.app_id', null);
    config()->set('meta.app_secret', null);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/setup/meta?step=connect')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('connectUrl', null));
});

it('exposes connect url when meta env is configured', function () {
    config()->set('meta.app_id', 'test-app');
    config()->set('meta.app_secret', 'test-secret');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/setup/meta?step=connect')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('connectUrl', fn ($url) => str_contains($url, '/auth/meta')));
});
