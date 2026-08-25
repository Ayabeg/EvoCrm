<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\GoogleSyncState;
use App\Models\Integration;
use App\Models\User;
use App\Services\Connectors\FakeGoogleApiClient;
use App\Services\Connectors\GoogleMailSync;

function connectGmail(User $user, FakeGoogleApiClient $google): Integration
{
    $google->reset();

    return Integration::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => Integration::PROVIDER_GMAIL,
        'status' => 'connected',
        'access_token' => 'gmail-token',
        'refresh_token' => 'gmail-refresh',
        'expires_at' => now()->addHour(),
        'connected_at' => now(),
    ]);
}

it('imports matching gmail once and attaches it to the contact and deal', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'amine@clinic.dz',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('qualified')->id,
        'title' => 'Clinic deal',
        'amount_cents' => 1_000_000,
        'currency' => 'DZD',
    ]);

    $google = app(FakeGoogleApiClient::class);
    connectGmail($user, $google);
    $google->messages = [[
        'id' => 'msg-1',
        'subject' => 'Quote follow-up',
        'snippet' => 'Can we move the demo?',
        'from' => 'amine@clinic.dz',
        'to' => 'sara@evotechly.com',
    ]];

    $first = app(GoogleMailSync::class)->sync($user->workspace);
    $second = app(GoogleMailSync::class)->sync($user->workspace);

    expect($first['imported'])->toBe(1)
        ->and($second['imported'])->toBe(0)
        ->and($second['skipped'])->toBe(1)
        ->and(Activity::query()->where('provider_event_id', 'msg-1')->count())->toBe(1);

    $activity = Activity::query()->where('provider_event_id', 'msg-1')->sole();

    expect($activity->type)->toBe('email')
        ->and($activity->contact_id)->toBe($contact->id)
        ->and($activity->deal_id)->toBe($deal->id)
        ->and($activity->provider)->toBe(Integration::PROVIDER_GMAIL);
});

it('starts and pauses gmail sync from connectors settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/settings/connectors/gmail/sync')
        ->assertRedirect();

    expect(GoogleSyncState::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', Integration::PROVIDER_GMAIL)
        ->value('status'))->toBe(GoogleSyncState::STATUS_IDLE);

    $this->actingAs($user)
        ->post('/settings/connectors/gmail/pause')
        ->assertRedirect();

    expect(GoogleSyncState::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', Integration::PROVIDER_GMAIL)
        ->value('status'))->toBe(GoogleSyncState::STATUS_PAUSED);

    $this->actingAs($user)
        ->get('/settings/connectors')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/connectors')
            ->where('googleConnectors.0.sync.status', 'paused')
        );
});

it('refreshes an expired token and records revocation instead of inventing mail', function () {
    $user = User::factory()->create();
    $google = app(FakeGoogleApiClient::class);
    $integration = connectGmail($user, $google);
    $integration->forceFill(['expires_at' => now()->subMinute()])->save();
    $google->messages = [[
        'id' => 'msg-revoked',
        'subject' => 'Should not import',
        'from' => 'amine@clinic.dz',
    ]];
    $google->revoked = true;

    $result = app(GoogleMailSync::class)->sync($user->workspace);

    expect($result['imported'])->toBe(0)
        ->and($result['status'])->toBe(GoogleSyncState::STATUS_ERROR)
        ->and(Activity::query()->where('provider_event_id', 'msg-revoked')->exists())->toBeFalse()
        ->and($integration->fresh()->status)->toBe('revoked')
        ->and(GoogleSyncState::query()
            ->where('workspace_id', $user->workspace_id)
            ->where('provider', Integration::PROVIDER_GMAIL)
            ->value('last_error'))->toContain('revoked');
});
