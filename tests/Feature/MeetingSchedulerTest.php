<?php

use App\Mail\MeetingBookedMail;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Integration;
use App\Models\MeetingSchedule;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Connectors\FakeGoogleApiClient;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    app(FakeGoogleApiClient::class)->reset();
});

function meetingHost(): User
{
    $user = User::factory()->create(['name' => 'Amina Bensalem']);
    MeetingSchedule::forUser($user);

    return $user->fresh();
}

function bookPayload(array $overrides = []): array
{
    return array_merge([
        'starts_at' => Carbon::parse('2026-09-10 09:00:00', 'Africa/Algiers')->toIso8601String(),
        'first_name' => 'Karim',
        'last_name' => 'Hadj',
        'email' => 'karim@clinic.dz',
        'phone' => '0550123456',
        'note' => 'Demo the board',
    ], $overrides);
}

it('lets a seller publish a public booking link', function () {
    $user = meetingHost();

    $this->actingAs($user)
        ->get('/settings/meetings')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/meetings')
            ->where('schedule.slug', 'amina-bensalem')
            ->where('schedule.slot_minutes', 30)
            ->where('schedule.timezone', 'Africa/Algiers')
            ->where('schedule.calendar_connected', false)
        );

    $this->actingAs($user)
        ->put('/settings/meetings', [
            'slug' => 'amina',
            'enabled' => '1',
            'slot_minutes' => 45,
            'work_start' => '10:00',
            'work_end' => '16:00',
            'weekdays' => [1, 2, 3, 4, 5],
            'intro' => '45 min discovery',
            'location_note' => 'Meet link in the invite',
        ])
        ->assertRedirect();

    $schedule = MeetingSchedule::query()->where('user_id', $user->id)->sole();
    expect($schedule->slug)->toBe('amina')
        ->and($schedule->slot_minutes)->toBe(45)
        ->and($schedule->intro)->toBe('45 min discovery');
});

it('shows Africa/Algiers slots on the public page and hides Google busy times', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));

    $user = meetingHost();
    $schedule = MeetingSchedule::forUser($user);

    $this->get('/book/'.$schedule->slug)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/book')
            ->where('host.name', 'Amina Bensalem')
            ->where('schedule.timezone', 'Africa/Algiers')
            ->where('days.0.date', '2026-09-10')
            ->where('days.0.slots.0.label', '09:00')
            ->where('schedule.calendar_connected', false)
        );

    $google = app(FakeGoogleApiClient::class);
    Integration::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => Integration::PROVIDER_GOOGLE_CALENDAR,
        'status' => 'connected',
        'access_token' => 'cal-token',
        'refresh_token' => 'cal-refresh',
        'expires_at' => now()->addHour(),
        'connected_at' => now(),
    ]);
    $google->events = [[
        'id' => 'busy-1',
        'starts_at' => Carbon::parse('2026-09-10 09:00:00', 'Africa/Algiers')->toIso8601String(),
        'ends_at' => Carbon::parse('2026-09-10 09:30:00', 'Africa/Algiers')->toIso8601String(),
        'status' => 'confirmed',
    ]];

    $this->get('/book/'.$schedule->slug)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('schedule.calendar_connected', true)
            ->where('days.0.slots.0.label', '09:30')
        );
});

it('books a meeting onto the contact timeline, calendar, and confirmation mail', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();

    $user = meetingHost();
    $schedule = MeetingSchedule::forUser($user);
    $google = app(FakeGoogleApiClient::class);
    Integration::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => Integration::PROVIDER_GOOGLE_CALENDAR,
        'status' => 'connected',
        'access_token' => 'cal-token',
        'connected_at' => now(),
    ]);

    $this->post('/book/'.$schedule->slug, bookPayload())
        ->assertRedirect('/book/'.$schedule->slug.'/done');

    $contact = Contact::query()->where('email', 'karim@clinic.dz')->sole();
    $meeting = Activity::query()->where('type', 'meeting')->where('contact_id', $contact->id)->sole();

    expect($contact->phone_e164)->toBe('+213550123456')
        ->and($contact->owner_id)->toBe($user->id)
        ->and($meeting->owner_id)->toBe($user->id)
        ->and($meeting->subject)->toBe('Meeting with Amina Bensalem')
        ->and($meeting->meta['source'])->toBe('booking')
        ->and($meeting->provider_event_id)->toBe('evt-book-1')
        ->and($google->createdEvents)->toHaveCount(1);

    Mail::assertSent(MeetingBookedMail::class, fn (MeetingBookedMail $mail) => $mail->hasTo('karim@clinic.dz')
        && $mail->hasCc($user->email));

    $this->get('/book/'.$schedule->slug)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('days.0.slots.0.label', '09:30'));
});

it('links an optional deal and refuses a taken slot or a missing phone', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();

    $user = meetingHost();
    $schedule = MeetingSchedule::forUser($user);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'karim@clinic.dz',
        'phone_e164' => '+213550123456',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('demo')->id,
        'title' => 'Clinic demo',
        'amount_cents' => 1_000_000,
        'currency' => 'DZD',
    ]);

    $this->post('/book/'.$schedule->slug, bookPayload(['phone' => '']))
        ->assertSessionHasErrors('phone');

    $this->post('/book/'.$schedule->slug, bookPayload(['deal_id' => $deal->id]))
        ->assertRedirect('/book/'.$schedule->slug.'/done');

    expect(Activity::query()->where('type', 'meeting')->where('deal_id', $deal->id)->exists())->toBeTrue();

    $this->post('/book/'.$schedule->slug, bookPayload([
        'email' => 'other@clinic.dz',
        'phone' => '0660112233',
    ]))->assertSessionHasErrors('starts_at');
});

it('returns 404 when the page is off and fires meeting.booked workflows', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();

    $user = meetingHost();
    $schedule = MeetingSchedule::forUser($user);
    $schedule->forceFill(['enabled' => false])->save();

    $this->get('/book/'.$schedule->slug)->assertNotFound();

    $schedule->forceFill(['enabled' => true])->save();

    Workflow::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Booked → task',
        'trigger' => Workflow::TRIGGER_MEETING_BOOKED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'active' => true,
        'action_config' => ['subject' => 'Prep the demo'],
    ]);

    $this->post('/book/'.$schedule->slug, bookPayload())->assertRedirect();

    expect(Activity::query()->where('type', 'task')->where('subject', 'Prep the demo')->exists())->toBeTrue();
});
