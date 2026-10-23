<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\LeadMagnetSubmission;
use App\Models\MeetingSchedule;
use App\Services\Meetings\MeetingBooker;
use App\Services\Meetings\MeetingSlotFinder;
use App\Support\AlgerianPhone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class MeetingBookController extends Controller
{
    public function show(Request $request, string $slug, MeetingSlotFinder $slots): Response
    {
        $schedule = $this->resolve($slug);
        $submission = $this->signedSubmission($request, $schedule);

        $days = collect($slots->slots($schedule))
            ->groupBy('date')
            ->map(fn ($rows, $date) => [
                'date' => $date,
                'label' => Carbon::parse($date, $schedule->timezone)->timezone($schedule->timezone)->format('D j M'),
                'slots' => $rows->values()->all(),
            ])
            ->values()
            ->all();

        return Inertia::render('public/book', [
            'host' => [
                'name' => $schedule->user?->name,
            ],
            'schedule' => [
                'slug' => $schedule->slug,
                'intro' => $schedule->intro,
                'slot_minutes' => $schedule->slot_minutes,
                'timezone' => $schedule->timezone,
                'location_note' => $schedule->location_note,
                'calendar_connected' => $slots->calendarConnected($schedule),
            ],
            'days' => $days,
            'lead_magnet_submission_id' => $submission?->id,
            'lead_magnet_booking_url' => $submission && $request->hasValidSignature() ? $request->fullUrl() : null,
            'deal_id' => $request->integer('deal') ?: null,
        ]);
    }

    public function store(Request $request, string $slug, MeetingBooker $booker): RedirectResponse
    {
        $schedule = $this->resolve($slug);

        $data = $request->validate([
            'starts_at' => ['required', 'date'],
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['nullable', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:180'],
            'phone' => ['required', 'string', 'max:40'],
            'note' => ['nullable', 'string', 'max:500'],
            'deal_id' => ['nullable', 'integer'],
            'lead_magnet_submission_id' => ['nullable', 'integer'],
        ]);

        $phone = AlgerianPhone::normalize($data['phone']);

        if (! $phone) {
            return back()->withErrors(['phone' => __('Enter an Algerian mobile (+213).')]);
        }

        $submission = $this->signedSubmission($request, $schedule);

        $activity = $booker->book($schedule, $data['starts_at'], [
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'],
            'phone' => $phone,
            'note' => $data['note'] ?? null,
            'deal_id' => $data['deal_id'] ?? $request->integer('deal') ?: null,
            'lead_magnet_submission_id' => $submission?->id,
        ]);

        $when = $activity->meta['starts_at'] ?? $data['starts_at'];

        return redirect()
            ->route('meetings.public.done', $schedule->slug)
            ->with('booked_at', $when);
    }

    public function done(string $slug): Response
    {
        $schedule = $this->resolve($slug);

        return Inertia::render('public/book-done', [
            'host' => ['name' => $schedule->user?->name],
            'when' => session('booked_at'),
            'timezone' => $schedule->timezone,
        ]);
    }

    private function resolve(string $slug): MeetingSchedule
    {
        $schedule = MeetingSchedule::query()
            ->with(['user', 'workspace'])
            ->where('slug', $slug)
            ->where('enabled', true)
            ->firstOrFail();

        return $schedule;
    }

    private function signedSubmission(Request $request, MeetingSchedule $schedule): ?LeadMagnetSubmission
    {
        if (! $request->hasValidSignature()) {
            return null;
        }

        return LeadMagnetSubmission::query()
            ->where('workspace_id', $schedule->workspace_id)
            ->find($request->integer('lead_magnet_submission_id'));
    }
}
