<?php

namespace App\Services\Meetings;

use App\Mail\MeetingBookedMail;
use App\Mail\MeetingReminderMail;
use App\Models\Workspace;
use App\Services\Outbound\MailerFactory;
use App\Services\Outbound\SmtpMailboxMailer;
use App\Support\Locale;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Mail;

class MeetingMailer
{
    public function __construct(private MailerFactory $mailers) {}

    public function send(Workspace $workspace, string $to, ?string $cc, MeetingBookedMail|MeetingReminderMail $mailable): void
    {
        $locale = Locale::forWorkspace($workspace);
        $mailable->locale($locale);

        $pending = Mail::to($to);

        if (filled($cc)) {
            $pending->cc($cc);
        }

        if (app()->environment('testing') || config('mail.default') === 'array') {
            $pending->send($mailable);

            return;
        }

        $mailbox = $this->mailers->resolve($workspace);

        if (! $mailbox) {
            $pending->send($mailable);

            return;
        }

        $previous = App::getLocale();
        App::setLocale($locale);
        $content = $mailable->content();
        $data = [
            'guestName' => $mailable->guestName,
            'hostName' => $mailable->hostName,
            'whenLabel' => $mailable->whenLabel,
            'timezone' => $mailable->timezone,
            'locationNote' => $mailable->locationNote,
            'note' => $mailable->note,
        ];

        try {
            (new SmtpMailboxMailer($mailbox))->sendAdHoc(
                $to,
                $mailable->envelope()->subject ?? 'Meeting',
                view($content->text ?? 'mail.meeting-booked-text', $data)->render(),
                view($content->view ?? 'mail.meeting-booked', $data)->render(),
            );
        } finally {
            App::setLocale($previous);
        }
    }
}
