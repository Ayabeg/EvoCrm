<?php

use App\Mail\MeetingReminderMail;
use App\Models\Activity;
use App\Models\Integration;
use App\Models\MeetingSchedule;
use App\Models\User;
use App\Models\Workflow;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

function reminderStartsAt(): string
{
    return Carbon::parse('2026-09-11 09:00:00', 'Africa/Algiers')->toIso8601String();
}

function bookForReminder(User $user, array $overrides = []): Activity
{
    $schedule = MeetingSchedule::forUser($user);

    test()->post('/book/'.$schedule->slug, bookPayload(array_merge([
        'starts_at' => reminderStartsAt(),
    ], $overrides)))->assertRedirect();

    return Activity::query()->where('type', 'meeting')->where('owner_id', $user->id)->latest('id')->firstOrFail();
}

it('leaves a booked meeting without attendance and reminds once inside the 24h window', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendText/*' => Http::response(['key' => ['id' => 'wamid-r']], 200),
        'https://evolution.example.test/message/sendTemplate/*' => Http::response(['key' => ['id' => 'wamid-tpl']], 200),
    ]);

    $user = meetingHost();
    $schedule = MeetingSchedule::forUser($user);
    $schedule->forceFill(['location_note' => 'Meet link in the invite'])->save();
    connectWhatsApp($user);

    $meeting = bookForReminder($user);

    expect($meeting->attendance())->toBeNull()
        ->and($meeting->wasReminded())->toBeFalse();

    $this->artisan('meetings:nudge')->assertSuccessful();
    expect($meeting->fresh()->wasReminded())->toBeFalse();
    Mail::assertNotSent(MeetingReminderMail::class);

    $this->travelTo(Carbon::parse('2026-09-10 10:00:00', 'Africa/Algiers'));
    $this->artisan('meetings:nudge')->assertSuccessful();

    $meeting = $meeting->fresh();
    expect($meeting->wasReminded())->toBeTrue()
        ->and($meeting->meta['email_remind'] ?? null)->toBe('sent')
        ->and($meeting->meta['whatsapp_remind'] ?? null)->toBe('sent')
        ->and($meeting->attendance())->toBeNull();

    Mail::assertSent(MeetingReminderMail::class, fn (MeetingReminderMail $mail) => $mail->hasTo('karim@clinic.dz')
        && $mail->hasCc($user->email)
        && str_contains($mail->envelope()->subject ?? '', 'Reminder'));

    Http::assertSent(fn ($request) => str_contains($request->url(), '/message/sendText/')
        && str_contains((string) $request['text'], 'reminder'));

    Mail::fake();
    Http::fake();
    $this->artisan('meetings:nudge')->assertSuccessful();
    Mail::assertNothingSent();
    Http::assertNothingSent();
    expect($meeting->fresh()->wasReminded())->toBeTrue();
});

it('does not remind when the slot is more than 24h away or less than 3h away', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();
    Http::fake();

    $user = meetingHost();
    $meeting = bookForReminder($user);

    $this->travelTo(Carbon::parse('2026-09-10 02:00:00', 'Africa/Algiers'));
    $this->artisan('meetings:nudge')->assertSuccessful();
    expect($meeting->fresh()->wasReminded())->toBeFalse();
    Mail::assertNotSent(MeetingReminderMail::class);

    $this->travelTo(Carbon::parse('2026-09-11 07:00:00', 'Africa/Algiers'));
    $this->artisan('meetings:nudge')->assertSuccessful();
    expect($meeting->fresh()->wasReminded())->toBeFalse();
    Mail::assertNotSent(MeetingReminderMail::class);
});

it('sends the Cloud meeting_reminder template when WhatsApp Business is connected', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendTemplate/*' => Http::response(['key' => ['id' => 'wamid-tpl']], 200),
        'https://evolution.example.test/message/sendText/*' => Http::response(['key' => ['id' => 'wamid-1']], 200),
    ]);

    $user = meetingHost();
    connectWhatsApp($user, Integration::PROVIDER_WHATSAPP_BUSINESS);
    bookForReminder($user);

    $this->travelTo(Carbon::parse('2026-09-10 10:00:00', 'Africa/Algiers'));
    $this->artisan('meetings:nudge')->assertSuccessful();

    expect(Activity::query()->where('type', 'meeting')->sole()->meta['whatsapp_remind'] ?? null)->toBe('sent');

    Http::assertSent(fn ($request) => str_contains($request->url(), '/message/sendTemplate/')
        && $request['name'] === 'meeting_reminder'
        && $request['language'] === 'fr');
    Http::assertNotSent(fn ($request) => str_contains($request->url(), '/message/sendText/'));
});

it('still reminds by email when WhatsApp fails', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendText/*' => Http::response(['message' => 'down'], 500),
        'https://evolution.example.test/message/sendTemplate/*' => Http::response(['message' => 'down'], 500),
    ]);

    $user = meetingHost();
    connectWhatsApp($user);
    $meeting = bookForReminder($user);

    $this->travelTo(Carbon::parse('2026-09-10 10:00:00', 'Africa/Algiers'));
    $this->artisan('meetings:nudge')->assertSuccessful();

    expect($meeting->fresh()->wasReminded())->toBeTrue()
        ->and($meeting->fresh()->meta['whatsapp_remind'] ?? null)->toBe('failed')
        ->and($meeting->fresh()->meta['email_remind'] ?? null)->toBe('sent');

    Mail::assertSent(MeetingReminderMail::class);
});

it('lets a seller mark show or no-show and fires meeting.no_show once', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();

    $user = meetingHost();
    $meeting = bookForReminder($user);

    Workflow::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'No-show → task',
        'trigger' => Workflow::TRIGGER_MEETING_NO_SHOW,
        'action' => Workflow::ACTION_CREATE_TASK,
        'active' => true,
        'action_config' => ['subject' => 'Follow up the no-show'],
    ]);

    $this->actingAs($user)
        ->post("/crm/activities/{$meeting->id}/attendance", ['attendance' => 'show'])
        ->assertRedirect();

    expect($meeting->fresh()->attendance())->toBe('show')
        ->and($meeting->fresh()->done)->toBeTrue()
        ->and(Activity::query()->where('type', 'task')->where('subject', 'Follow up the no-show')->exists())->toBeFalse();

    $this->actingAs($user)
        ->post("/crm/activities/{$meeting->id}/attendance", ['attendance' => 'no_show'])
        ->assertRedirect();

    expect($meeting->fresh()->attendance())->toBe('no_show');
    expect(Activity::query()->where('type', 'task')->where('subject', 'Follow up the no-show')->count())->toBe(1);

    $this->actingAs($user)
        ->post("/crm/activities/{$meeting->id}/attendance", ['attendance' => 'no_show'])
        ->assertRedirect();

    expect(Activity::query()->where('type', 'task')->where('subject', 'Follow up the no-show')->count())->toBe(1);
});

it('marks ended meetings no-show from meetings:nudge and ignores in-progress slots', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();

    $user = meetingHost();
    $meeting = bookForReminder($user, [
        'starts_at' => Carbon::parse('2026-09-10 09:00:00', 'Africa/Algiers')->toIso8601String(),
    ]);

    Workflow::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'No-show → task',
        'trigger' => Workflow::TRIGGER_MEETING_NO_SHOW,
        'action' => Workflow::ACTION_CREATE_TASK,
        'active' => true,
        'action_config' => ['subject' => 'Reschedule the demo'],
    ]);

    $this->travelTo(Carbon::parse('2026-09-10 09:15:00', 'Africa/Algiers'));
    $this->artisan('meetings:nudge')->assertSuccessful();
    expect($meeting->fresh()->attendance())->toBeNull();

    $this->travelTo(Carbon::parse('2026-09-10 09:31:00', 'Africa/Algiers'));
    $this->artisan('meetings:nudge')->assertSuccessful();

    expect($meeting->fresh()->attendance())->toBe('no_show')
        ->and($meeting->fresh()->done)->toBeTrue();
    expect(Activity::query()->where('type', 'task')->where('subject', 'Reschedule the demo')->count())->toBe(1);

    $this->artisan('meetings:nudge')->assertSuccessful();
    expect(Activity::query()->where('type', 'task')->where('subject', 'Reschedule the demo')->count())->toBe(1);
});

it('404s attendance from another workspace and on non-meetings', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();

    $user = meetingHost();
    $meeting = bookForReminder($user);
    $stranger = User::factory()->create();
    $task = Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => 'task',
        'subject' => 'Prep',
        'owner_id' => $user->id,
    ]);

    $this->actingAs($stranger)
        ->post("/crm/activities/{$meeting->id}/attendance", ['attendance' => 'show'])
        ->assertNotFound();

    $this->actingAs($user)
        ->post("/crm/activities/{$task->id}/attendance", ['attendance' => 'show'])
        ->assertNotFound();

    expect($meeting->fresh()->attendance())->toBeNull();
});

it('schedules meetings:nudge every minute next to tickets:check-sla', function () {
    $names = collect(app(Schedule::class)->events())->map->description->all();

    expect($names)->toContain('meetings:nudge')
        ->and($names)->toContain('tickets:check-sla');
});
