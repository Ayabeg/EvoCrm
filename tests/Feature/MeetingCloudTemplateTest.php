<?php

use App\Models\Activity;
use App\Models\Integration;
use App\Models\MeetingSchedule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

it('shows default Cloud template names on the meetings settings page', function () {
    $user = meetingHost();

    $this->actingAs($user)
        ->get('/settings/meetings')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/meetings')
            ->where('whatsapp.booked', 'meeting_booked')
            ->where('whatsapp.reminder', 'meeting_reminder')
            ->where('whatsapp.language', 'fr')
            ->where('whatsapp_cloud_connected', false)
        );
});

it('saves Meta-approved template names on the workspace', function () {
    $user = meetingHost();
    $schedule = MeetingSchedule::forUser($user);

    $this->actingAs($user)
        ->put('/settings/meetings', [
            'slug' => $schedule->slug,
            'enabled' => '1',
            'slot_minutes' => 30,
            'work_start' => '09:00',
            'work_end' => '17:00',
            'weekdays' => [1, 2, 3, 4, 5],
            'whatsapp_booked_template' => 'evotechly_meeting_booked',
            'whatsapp_reminder_template' => 'evotechly_meeting_reminder',
            'whatsapp_template_language' => 'ar',
        ])
        ->assertRedirect();

    $user->workspace->refresh();

    expect($user->workspace->meetingTemplateName('meeting_booked'))->toBe('evotechly_meeting_booked')
        ->and($user->workspace->meetingTemplateName('meeting_reminder'))->toBe('evotechly_meeting_reminder')
        ->and($user->workspace->meetingTemplateName('quote_accepted'))->toBe('quote_accepted')
        ->and($user->workspace->meetingTemplateName('ticket_sla'))->toBe('ticket_sla')
        ->and($user->workspace->meetingTemplateLanguage())->toBe('ar');
});

it('sends the workspace Cloud template name on booking', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendTemplate/*' => Http::response(['key' => ['id' => 'wamid-tpl']], 200),
        'https://evolution.example.test/message/sendText/*' => Http::response(['key' => ['id' => 'wamid-1']], 200),
    ]);

    $user = meetingHost();
    $user->workspace->forceFill([
        'meeting_wa_templates' => [
            'booked' => 'evotechly_meeting_booked',
            'reminder' => 'evotechly_meeting_reminder',
            'language' => 'ar',
        ],
    ])->save();
    connectWhatsApp($user, Integration::PROVIDER_WHATSAPP_BUSINESS);
    $schedule = MeetingSchedule::forUser($user);

    $this->post('/book/'.$schedule->slug, bookPayload())->assertRedirect();

    expect(Activity::query()->where('type', 'meeting')->sole()->meta['whatsapp_confirm'] ?? null)->toBe('sent');

    Http::assertSent(fn ($request) => str_contains($request->url(), '/message/sendTemplate/')
        && $request['name'] === 'evotechly_meeting_booked'
        && $request['language'] === 'ar');
    Http::assertNotSent(fn ($request) => str_contains($request->url(), '/message/sendText/'));
});

it('skips Cloud and uses phone text when the booked template name is empty', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendTemplate/*' => Http::response(['key' => ['id' => 'wamid-tpl']], 200),
        'https://evolution.example.test/message/sendText/*' => Http::response(['key' => ['id' => 'wamid-1']], 200),
    ]);

    $user = meetingHost();
    $user->workspace->forceFill([
        'meeting_wa_templates' => [
            'booked' => '',
            'reminder' => 'meeting_reminder',
            'language' => 'fr',
        ],
    ])->save();
    connectWhatsApp($user, Integration::PROVIDER_WHATSAPP_BUSINESS);
    connectWhatsApp($user, Integration::PROVIDER_WHATSAPP);
    $schedule = MeetingSchedule::forUser($user);

    $this->post('/book/'.$schedule->slug, bookPayload())->assertRedirect();

    expect(Activity::query()->where('type', 'meeting')->sole()->meta['whatsapp_confirm'] ?? null)->toBe('sent');

    Http::assertNotSent(fn ($request) => str_contains($request->url(), '/message/sendTemplate/'));
    Http::assertSent(fn ($request) => str_contains($request->url(), '/message/sendText/'));
});

it('does not send Cloud when the booked template is empty and only Business is connected', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake();

    $user = meetingHost();
    $user->workspace->forceFill([
        'meeting_wa_templates' => [
            'booked' => '',
            'reminder' => '',
            'language' => 'fr',
        ],
    ])->save();
    connectWhatsApp($user, Integration::PROVIDER_WHATSAPP_BUSINESS);
    $schedule = MeetingSchedule::forUser($user);

    $this->post('/book/'.$schedule->slug, bookPayload())->assertRedirect();

    $meeting = Activity::query()->where('type', 'meeting')->sole();

    expect($meeting->meta['whatsapp_confirm'] ?? null)->toBeNull();
    Http::assertNothingSent();
});

it('sends the workspace reminder template name', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendTemplate/*' => Http::response(['key' => ['id' => 'wamid-tpl']], 200),
        'https://evolution.example.test/message/sendText/*' => Http::response(['key' => ['id' => 'wamid-1']], 200),
    ]);

    $user = meetingHost();
    $user->workspace->forceFill([
        'meeting_wa_templates' => [
            'booked' => 'evotechly_meeting_booked',
            'reminder' => 'evotechly_meeting_reminder',
            'language' => 'fr',
        ],
    ])->save();
    connectWhatsApp($user, Integration::PROVIDER_WHATSAPP_BUSINESS);
    bookForReminder($user);

    $this->travelTo(Carbon::parse('2026-09-10 10:00:00', 'Africa/Algiers'));
    $this->artisan('meetings:nudge')->assertSuccessful();

    Http::assertSent(fn ($request) => str_contains($request->url(), '/message/sendTemplate/')
        && $request['name'] === 'evotechly_meeting_reminder');
});
