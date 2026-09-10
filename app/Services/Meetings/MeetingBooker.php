<?php

namespace App\Services\Meetings;

use App\Mail\MeetingBookedMail;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Integration;
use App\Models\MeetingSchedule;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Connectors\GoogleApiClient;
use App\Services\Crm\ActivityRecorder;
use App\Services\Crm\ContactIdentity;
use App\Services\Crm\WorkflowRunner;
use App\Services\Evolution\EvolutionCloudService;
use App\Services\Outbound\MailerFactory;
use App\Services\Outbound\SmtpMailboxMailer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class MeetingBooker
{
    public function __construct(
        private MeetingSlotFinder $slots,
        private ContactIdentity $contacts,
        private ActivityRecorder $activities,
        private WorkflowRunner $workflows,
        private GoogleApiClient $google,
        private MailerFactory $mailers,
        private EvolutionCloudService $evolution,
    ) {}

    /**
     * @param  array{first_name: string, last_name?: string|null, email: string, phone: string, note?: string|null, deal_id?: int|null}  $guest
     */
    public function book(MeetingSchedule $schedule, string $startsAt, array $guest): Activity
    {
        if (! $schedule->enabled) {
            abort(404);
        }

        $schedule->loadMissing(['user', 'workspace']);

        $tz = $schedule->timezone ?: MeetingSchedule::TIMEZONE;
        $start = Carbon::parse($startsAt)->timezone($tz);
        $end = $start->copy()->addMinutes((int) $schedule->slot_minutes);

        if ($start->lte(now($tz)) || ! $this->slots->isFree($schedule, $start, $end)) {
            throw ValidationException::withMessages([
                'starts_at' => 'That time is no longer available.',
            ]);
        }

        $host = $schedule->user ?? User::query()->findOrFail($schedule->user_id);
        $contact = $this->contacts->findOrCreate($schedule->workspace, [
            'first_name' => $guest['first_name'],
            'last_name' => $guest['last_name'] ?? null,
            'email' => $guest['email'],
            'phone' => $guest['phone'],
            'owner_id' => $host->id,
            'source' => 'meeting',
        ]);

        $dealId = $this->resolveDealId($schedule, $contact, $guest['deal_id'] ?? null);
        $whenLabel = $start->timezone($tz)->format('D j M Y · H:i');

        $activity = $this->activities->record($schedule->workspace, [
            'type' => 'meeting',
            'subject' => 'Meeting with '.$host->name,
            'body' => trim((string) ($guest['note'] ?? '')) ?: null,
            'due_at' => $start->clone()->utc(),
            'owner_id' => $host->id,
            'contact_id' => $contact->id,
            'deal_id' => $dealId,
            'company_id' => $contact->company_id,
            'meta' => [
                'source' => 'booking',
                'schedule_id' => $schedule->id,
                'starts_at' => $start->toIso8601String(),
                'ends_at' => $end->toIso8601String(),
                'timezone' => $tz,
                'location_note' => $schedule->location_note,
                'guest_email' => $guest['email'],
                'guest_phone' => $guest['phone'],
            ],
        ], $host);

        $googleId = $this->pushCalendar($schedule, $activity, $start, $end, $guest['email'], $host);

        if ($googleId) {
            $meta = $activity->meta ?? [];
            $meta['google_event_id'] = $googleId;
            $activity->forceFill([
                'provider' => Integration::PROVIDER_GOOGLE_CALENDAR,
                'provider_event_id' => $googleId,
                'meta' => $meta,
            ])->save();
        }

        $this->confirm($schedule, $host, $guest, $whenLabel);
        $this->confirmWhatsApp($schedule, $activity, $contact, $host, $guest, $whenLabel);
        $this->workflows->handleMeetingBooked($activity);

        return $activity;
    }

    private function resolveDealId(MeetingSchedule $schedule, Contact $contact, mixed $dealId): ?int
    {
        if (! $dealId) {
            return null;
        }

        $deal = Deal::query()
            ->forWorkspace($schedule->workspace_id)
            ->whereKey((int) $dealId)
            ->first();

        if (! $deal) {
            return null;
        }

        if ($deal->contact_id && (int) $deal->contact_id !== (int) $contact->id) {
            return null;
        }

        return $deal->id;
    }

    private function pushCalendar(
        MeetingSchedule $schedule,
        Activity $activity,
        Carbon $start,
        Carbon $end,
        string $guestEmail,
        User $host,
    ): ?string {
        $integration = Integration::query()
            ->where('workspace_id', $schedule->workspace_id)
            ->where('provider', Integration::PROVIDER_GOOGLE_CALENDAR)
            ->first();

        if (! $integration instanceof Integration || ! $integration->isConnected()) {
            return null;
        }

        $created = $this->google->createEvent($integration, [
            'subject' => $activity->subject ?? 'Meeting',
            'body' => $activity->body,
            'starts_at' => $start->toIso8601String(),
            'ends_at' => $end->toIso8601String(),
            'timezone' => $schedule->timezone ?: MeetingSchedule::TIMEZONE,
            'location' => $schedule->location_note,
            'attendees' => array_values(array_filter([$guestEmail, $host->email])),
        ]);

        return isset($created['id']) && $created['id'] ? (string) $created['id'] : null;
    }

    /**
     * @param  array{first_name: string, email: string, note?: string|null}  $guest
     */
    private function confirm(MeetingSchedule $schedule, User $host, array $guest, string $whenLabel): void
    {
        $mailable = new MeetingBookedMail(
            guestName: $guest['first_name'],
            hostName: $host->name,
            whenLabel: $whenLabel,
            timezone: $schedule->timezone ?: MeetingSchedule::TIMEZONE,
            locationNote: $schedule->location_note,
            note: $guest['note'] ?? null,
        );

        if (app()->environment('testing') || config('mail.default') === 'array') {
            Mail::to($guest['email'])->cc($host->email)->send($mailable);

            return;
        }

        $mailbox = $this->mailers->resolve($schedule->workspace);

        if (! $mailbox) {
            Mail::to($guest['email'])->cc($host->email)->send($mailable);

            return;
        }

        $content = $mailable->content();
        $data = [
            'guestName' => $mailable->guestName,
            'hostName' => $mailable->hostName,
            'whenLabel' => $mailable->whenLabel,
            'timezone' => $mailable->timezone,
            'locationNote' => $mailable->locationNote,
            'note' => $mailable->note,
        ];

        (new SmtpMailboxMailer($mailbox))->sendAdHoc(
            $guest['email'],
            $mailable->envelope()->subject ?? 'Meeting confirmed',
            view($content->text ?? 'mail.meeting-booked-text', $data)->render(),
            view($content->view ?? 'mail.meeting-booked', $data)->render(),
        );
    }

    /**
     * @param  array{first_name: string, phone: string}  $guest
     */
    private function confirmWhatsApp(
        MeetingSchedule $schedule,
        Activity $activity,
        Contact $contact,
        User $host,
        array $guest,
        string $whenLabel,
    ): void {
        try {
            $this->sendWhatsAppConfirm($schedule, $activity, $contact, $host, $guest, $whenLabel);
        } catch (Throwable) {
            $this->stampWhatsApp($activity, 'failed');
        }
    }

    /**
     * @param  array{first_name: string, phone: string}  $guest
     */
    private function sendWhatsAppConfirm(
        MeetingSchedule $schedule,
        Activity $activity,
        Contact $contact,
        User $host,
        array $guest,
        string $whenLabel,
    ): void {
        if (! $this->evolution->configured()) {
            return;
        }

        $workspace = $schedule->workspace ?? Workspace::query()->find($schedule->workspace_id);
        $number = $contact->phone_e164 ?: $guest['phone'];

        if (! $workspace instanceof Workspace || ! filled($number)) {
            return;
        }

        $cloud = $workspace->integration(Integration::PROVIDER_WHATSAPP_BUSINESS);
        $phone = $workspace->integration(Integration::PROVIDER_WHATSAPP);
        $body = $this->whatsAppBody($guest['first_name'], $host->name, $whenLabel, $schedule);

        if ($cloud?->isConnected()) {
            $instance = $cloud->meta['instance']
                ?? $this->evolution->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP_BUSINESS);
            $template = $this->evolution->sendTemplate(
                $number,
                'meeting_booked',
                (string) config('evolution.meta.language', 'fr'),
                [
                    [
                        'type' => 'body',
                        'parameters' => [
                            ['type' => 'text', 'text' => $guest['first_name']],
                            ['type' => 'text', 'text' => $host->name],
                            ['type' => 'text', 'text' => $whenLabel],
                        ],
                    ],
                ],
                $instance,
            );

            if ($template['ok']) {
                $this->stampWhatsApp($activity, 'sent');

                return;
            }
        }

        if ($phone?->isConnected()) {
            $instance = $phone->meta['instance']
                ?? $this->evolution->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP);
            $text = $this->evolution->sendText($number, $body, $instance);
            $this->stampWhatsApp($activity, $text['ok'] ? 'sent' : 'failed', $text['ok'] ? null : ($text['error'] ?? 'Send failed'));

            return;
        }

        if ($cloud?->isConnected()) {
            $this->stampWhatsApp($activity, 'failed');
        }
    }

    private function whatsAppBody(string $guestName, string $hostName, string $whenLabel, MeetingSchedule $schedule): string
    {
        $tz = $schedule->timezone ?: MeetingSchedule::TIMEZONE;
        $lines = [
            'Salaam '.$guestName.' — '.$hostName.' confirmed your meeting.',
            $whenLabel.' ('.$tz.')',
        ];

        if (filled($schedule->location_note)) {
            $lines[] = (string) $schedule->location_note;
        }

        return implode("\n", $lines);
    }

    private function stampWhatsApp(Activity $activity, string $status, ?string $error = null): void
    {
        $meta = $activity->meta ?? [];
        $meta['whatsapp_confirm'] = $status;

        if ($error) {
            $meta['whatsapp_confirm_error'] = mb_substr($error, 0, 180);
        } else {
            unset($meta['whatsapp_confirm_error']);
        }

        $activity->forceFill(['meta' => $meta])->save();
    }
}
