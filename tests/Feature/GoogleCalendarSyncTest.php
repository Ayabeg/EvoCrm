<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\GoogleSyncState;
use App\Models\Integration;
use App\Models\User;
use App\Services\Connectors\FakeGoogleApiClient;
use App\Services\Connectors\GoogleCalendarSync;

function connectCalendar(User $user, FakeGoogleApiClient $google): Integration
{
    $google->reset();

    return Integration::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => Integration::PROVIDER_GOOGLE_CALENDAR,
        'status' => 'connected',
        'access_token' => 'cal-token',
        'refresh_token' => 'cal-refresh',
        'expires_at' => now()->addHour(),
        'connected_at' => now(),
    ]);
}

it('imports updates and cancels calendar meetings idempotently', function () {
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
        'stage_id' => $pipeline->stageBySlug('demo')->id,
        'title' => 'Demo deal',
        'amount_cents' => 2_000_000,
        'currency' => 'DZD',
    ]);

    $google = app(FakeGoogleApiClient::class);
    connectCalendar($user, $google);
    $google->events = [[
        'id' => 'evt-1',
        'subject' => 'Clinic demo',
        'body' => 'Walk through EvoSales',
        'status' => 'confirmed',
        'starts_at' => now()->addDay()->toIso8601String(),
        'attendees' => ['amine@clinic.dz'],
    ]];

    app(GoogleCalendarSync::class)->sync($user->workspace);

    $activity = Activity::query()->where('provider_event_id', 'evt-1')->sole();
    expect($activity->type)->toBe('meeting')
        ->and($activity->contact_id)->toBe($contact->id)
        ->and($activity->deal_id)->toBe($deal->id)
        ->and($activity->done)->toBeFalse();

    $google->events = [[
        'id' => 'evt-1',
        'subject' => 'Clinic demo moved',
        'status' => 'confirmed',
        'starts_at' => now()->addDays(2)->toIso8601String(),
        'attendees' => ['amine@clinic.dz'],
    ]];

    app(GoogleCalendarSync::class)->sync($user->workspace);

    expect(Activity::query()->where('provider_event_id', 'evt-1')->count())->toBe(1)
        ->and($activity->fresh()->subject)->toBe('Clinic demo moved');

    $google->events = [[
        'id' => 'evt-1',
        'subject' => 'Clinic demo moved',
        'status' => 'cancelled',
        'attendees' => ['amine@clinic.dz'],
    ]];

    $result = app(GoogleCalendarSync::class)->sync($user->workspace);

    expect($result['cancelled'])->toBe(1)
        ->and($activity->fresh()->done)->toBeTrue()
        ->and(Activity::query()->where('provider_event_id', 'evt-1')->count())->toBe(1);
});

it('treats an expired calendar cursor as a full resync rather than deleting events', function () {
    $user = User::factory()->create();
    $google = app(FakeGoogleApiClient::class);
    connectCalendar($user, $google);
    $google->events = [[
        'id' => 'evt-keep',
        'subject' => 'Keep me',
        'status' => 'confirmed',
        'attendees' => [],
    ]];

    app(GoogleCalendarSync::class)->sync($user->workspace);

    GoogleSyncState::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', Integration::PROVIDER_GOOGLE_CALENDAR)
        ->update(['cursor' => 'stale-cursor']);

    $google->cursorExpired = true;
    $google->events = [[
        'id' => 'evt-keep',
        'subject' => 'Keep me still',
        'status' => 'confirmed',
        'attendees' => [],
    ]];

    app(GoogleCalendarSync::class)->sync($user->workspace);

    expect(Activity::query()->where('provider_event_id', 'evt-keep')->count())->toBe(1)
        ->and(Activity::query()->where('provider_event_id', 'evt-keep')->value('subject'))->toBe('Keep me still')
        ->and(GoogleSyncState::query()
            ->where('workspace_id', $user->workspace_id)
            ->where('provider', Integration::PROVIDER_GOOGLE_CALENDAR)
            ->value('cursor'))->toBe('cal-cursor-2');
});
