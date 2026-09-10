<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\MeetingSchedule;
use App\Services\Meetings\MeetingSlotFinder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MeetingScheduleController extends Controller
{
    public function edit(Request $request, MeetingSlotFinder $slots): Response
    {
        $user = $request->user();
        $schedule = MeetingSchedule::forUser($user);

        return Inertia::render('settings/meetings', [
            'schedule' => $this->present($schedule, $slots),
            'whatsapp' => $user->workspace->meetingWhatsAppConfig(),
            'whatsapp_cloud_connected' => (bool) $user->workspace
                ->integration(Integration::PROVIDER_WHATSAPP_BUSINESS)
                ?->isConnected(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $schedule = MeetingSchedule::forUser($user);

        $data = $request->validate([
            'slug' => ['required', 'string', 'max:60', 'alpha_dash'],
            'enabled' => ['sometimes', 'boolean'],
            'slot_minutes' => ['required', 'integer', Rule::in(MeetingSchedule::SLOT_MINUTES)],
            'work_start' => ['required', 'date_format:H:i'],
            'work_end' => ['required', 'date_format:H:i', 'after:work_start'],
            'weekdays' => ['required', 'array', 'min:1'],
            'weekdays.*' => ['integer', 'between:1,7'],
            'location_note' => ['nullable', 'string', 'max:180'],
            'intro' => ['nullable', 'string', 'max:180'],
            'whatsapp_booked_template' => ['nullable', 'string', 'max:512', 'regex:/^[A-Za-z0-9_]*$/'],
            'whatsapp_reminder_template' => ['nullable', 'string', 'max:512', 'regex:/^[A-Za-z0-9_]*$/'],
            'whatsapp_template_language' => ['nullable', 'string', Rule::in(['fr', 'ar', 'en'])],
        ]);

        if (MeetingSchedule::query()->where('slug', $data['slug'])->whereKeyNot($schedule->id)->exists()) {
            return back()->withErrors(['slug' => 'That booking link is already taken.']);
        }

        $schedule->forceFill([
            'slug' => $data['slug'],
            'enabled' => $request->boolean('enabled'),
            'slot_minutes' => (int) $data['slot_minutes'],
            'timezone' => MeetingSchedule::TIMEZONE,
            'work_start' => $data['work_start'],
            'work_end' => $data['work_end'],
            'weekdays' => array_values(array_unique(array_map('intval', $data['weekdays']))),
            'location_note' => ($data['location_note'] ?? '') ?: null,
            'intro' => ($data['intro'] ?? '') ?: null,
        ])->save();

        if ($request->exists('whatsapp_booked_template')
            || $request->exists('whatsapp_reminder_template')
            || $request->exists('whatsapp_template_language')) {
            $current = $user->workspace->meetingWhatsAppConfig();
            $user->workspace->forceFill([
                'meeting_wa_templates' => [
                    'booked' => $request->exists('whatsapp_booked_template')
                        ? strtolower(trim((string) ($data['whatsapp_booked_template'] ?? '')))
                        : $current['booked'],
                    'reminder' => $request->exists('whatsapp_reminder_template')
                        ? strtolower(trim((string) ($data['whatsapp_reminder_template'] ?? '')))
                        : $current['reminder'],
                    'language' => $data['whatsapp_template_language'] ?? $current['language'],
                ],
            ])->save();
        }

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function present(MeetingSchedule $schedule, MeetingSlotFinder $slots): array
    {
        return [
            'slug' => $schedule->slug,
            'url' => $schedule->publicUrl(),
            'enabled' => $schedule->enabled,
            'slot_minutes' => $schedule->slot_minutes,
            'timezone' => $schedule->timezone,
            'work_start' => $schedule->work_start,
            'work_end' => $schedule->work_end,
            'weekdays' => $schedule->weekdayList(),
            'location_note' => $schedule->location_note,
            'intro' => $schedule->intro,
            'calendar_connected' => $slots->calendarConnected($schedule),
        ];
    }
}
