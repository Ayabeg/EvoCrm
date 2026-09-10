<?php

use App\Enums\ChannelType;
use App\Enums\WorkspaceRole;
use App\Models\Channel;
use App\Models\Integration;
use App\Models\User;

it('renders the Algeria SMS settings page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/sms')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/sms')
            ->where('connected', false)
            ->where('key_set', false)
            ->where('sender', 'EVOTECHLY')
            ->where('http_auth', 'form')
            ->has('auth.user.role'));
});

it('saves a workspace HTTP gateway without echoing the API key', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/settings/sms')
        ->post('/settings/sms', [
            'driver' => 'http',
            'url' => 'https://sms.example.dz/api/send',
            'method' => 'POST',
            'auth' => 'form',
            'sender' => 'CLINIQUE',
            'api_key' => 'super-secret-key',
            'field_to' => 'to',
            'field_message' => 'message',
            'field_sender' => 'sender',
            'field_api_key' => 'api_key',
        ])
        ->assertRedirect('/settings/sms');

    $integration = Integration::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', Integration::PROVIDER_SMS)
        ->sole();

    expect($integration->isConnected())->toBeTrue()
        ->and($integration->access_token)->toBe('super-secret-key')
        ->and($integration->meta['sender'])->toBe('CLINIQUE')
        ->and($integration->meta['url'])->toBe('https://sms.example.dz/api/send');

    expect(Channel::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('type', ChannelType::Sms)
        ->value('status'))->toBe('connected');

    $this->actingAs($user)
        ->get('/settings/sms')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('connected', true)
            ->where('key_set', true)
            ->where('sender', 'CLINIQUE')
            ->missing('api_key')
            ->missing('access_token'));
});

it('forbids members from saving SMS settings', function () {
    $user = User::factory()->create(['role' => WorkspaceRole::Member]);

    $this->actingAs($user)
        ->post('/settings/sms', [
            'driver' => 'http',
            'url' => 'https://sms.example.dz/api/send',
            'api_key' => 'nope',
            'sender' => 'X',
        ])
        ->assertForbidden();
});
