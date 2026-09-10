<?php

namespace App\Services\Meetings;

use App\Mail\MeetingReminderMail;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\MeetingSchedule;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Crm\WorkflowRunner;
use Illuminate\Support\Carbon;
use Throwable;

class MeetingLifecycle
{
    public function __construct(
        private MeetingMailer $mail,
        private MeetingWhatsApp $whatsapp,
        private WorkflowRunner $workflows,
    ) {}

    public function markAttendance(Activity $activity, string $attendance): bool
    {
        if ($activity->type !== 'meeting') {
            return false;
        }

        $changed = $activity->markAttendance($attendance);

        if ($changed && $attendance === Activity::ATTENDANCE_NO_SHOW) {
            $this->workflows->handleMeetingNoShow($activity);
        }

        return $changed;
    }

    public function remindUpcoming(int $limit = 200): int
    {
        $now = now();
        $meetings = Activity::query()
            ->where('type', 'meeting')
            ->whereNotNull('due_at')
            ->where('due_at', '>', $now->copy()->addHours(2))
            ->where('due_at', '<=', $now->copy()->addHours(26))
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $sent = 0;

        foreach ($meetings as $meeting) {
            if ($this->remind($meeting)) {
                $sent++;
            }
        }

        return $sent;
    }

    public function closeNoShows(int $limit = 200): int
    {
        $meetings = Activity::query()
            ->where('type', 'meeting')
            ->where('done', false)
            ->whereNotNull('due_at')
            ->where('due_at', '<=', now())
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $closed = 0;

        foreach ($meetings as $meeting) {
            if (! $this->hasEnded($meeting) || $meeting->attendance()) {
                continue;
            }

            if ($this->markAttendance($meeting, Activity::ATTENDANCE_NO_SHOW)) {
                $closed++;
            }
        }

        return $closed;
    }

    public function remind(Activity $activity): bool
    {
        if ($activity->type !== 'meeting' || $activity->wasReminded() || $activity->attendance()) {
            return false;
        }

        $starts = $this->startsAt($activity);

        if (! $starts || $starts->lte(now()->addHours(3)) || $starts->gt(now()->addHours(24))) {
            return false;
        }

        $activity->loadMissing(['contact', 'owner', 'workspace']);

        $workspace = $activity->workspace ?? Workspace::query()->find($activity->workspace_id);
        $host = $activity->owner ?? User::query()->find($activity->owner_id);
        $contact = $activity->contact;
        $schedule = $this->schedule($activity);
        $tz = $schedule?->timezone ?: MeetingSchedule::TIMEZONE;
        $whenLabel = $starts->clone()->timezone($tz)->format('D j M Y · H:i');
        $guestName = $contact instanceof Contact
            ? (string) ($contact->first_name ?: 'there')
            : (string) ($activity->meta['guest_name'] ?? 'there');
        $hostName = $host instanceof User ? $host->name : 'your host';
        $guestEmail = $activity->meta['guest_email'] ?? $contact?->email;
        $guestPhone = (string) ($activity->meta['guest_phone'] ?? $contact?->phone_e164 ?? '');
        $location = $schedule?->location_note ?? ($activity->meta['location_note'] ?? null);

        if ($workspace instanceof Workspace && filled($guestEmail) && $host instanceof User) {
            try {
                $this->mail->send(
                    $workspace,
                    (string) $guestEmail,
                    $host->email,
                    new MeetingReminderMail(
                        guestName: $guestName,
                        hostName: $hostName,
                        whenLabel: $whenLabel,
                        timezone: $tz,
                        locationNote: $location,
                        note: $activity->body,
                    ),
                );
                $activity->mergeMeta(['email_remind' => 'sent']);
            } catch (Throwable) {
                $activity->mergeMeta(['email_remind' => 'failed']);
            }
        }

        if ($workspace instanceof Workspace) {
            try {
                $status = $this->whatsapp->send(
                    $workspace,
                    $contact instanceof Contact ? $contact : null,
                    $guestPhone,
                    MeetingWhatsApp::TEMPLATE_REMINDER,
                    $this->whatsAppBody($guestName, $hostName, $whenLabel, $tz, $location),
                    [$guestName, $hostName, $whenLabel],
                );

                if ($status) {
                    $activity->mergeMeta(['whatsapp_remind' => $status]);
                }
            } catch (Throwable) {
                $activity->mergeMeta(['whatsapp_remind' => 'failed']);
            }
        }

        $activity->mergeMeta(['reminded_at' => now()->toIso8601String()]);

        return true;
    }

    private function hasEnded(Activity $activity): bool
    {
        $ends = $activity->meta['ends_at'] ?? null;

        if (is_string($ends) && $ends !== '') {
            return Carbon::parse($ends)->lte(now());
        }

        return $activity->due_at !== null && $activity->due_at->lte(now());
    }

    private function startsAt(Activity $activity): ?Carbon
    {
        $raw = $activity->meta['starts_at'] ?? null;

        if (is_string($raw) && $raw !== '') {
            return Carbon::parse($raw);
        }

        return $activity->due_at;
    }

    private function schedule(Activity $activity): ?MeetingSchedule
    {
        $id = $activity->meta['schedule_id'] ?? null;

        if (! $id) {
            return null;
        }

        return MeetingSchedule::query()->find($id);
    }

    private function whatsAppBody(string $guestName, string $hostName, string $whenLabel, string $tz, ?string $location): string
    {
        $lines = [
            'Salaam '.$guestName.' — reminder: meeting with '.$hostName.'.',
            $whenLabel.' ('.$tz.')',
        ];

        if (filled($location)) {
            $lines[] = $location;
        }

        return implode("\n", $lines);
    }
}
