<?php

namespace App\Console\Commands;

use App\Mail\MeetingBookedMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class MailSmokeCommand extends Command
{
    protected $signature = 'evocrm:mail-smoke
                            {--to= : Send a MeetingBookedMail smoke to this address via the default mailer}
                            {--send : Actually deliver (--to is required)}';

    protected $description = 'Show transactional mail readiness (Resend) and optionally send a test meeting mail';

    public function handle(): int
    {
        $mailer = (string) config('mail.default');
        $from = (string) config('mail.from.address');
        $fromName = (string) config('mail.from.name');
        $key = (string) config('services.resend.key');
        $sdk = class_exists(\Resend::class);

        $this->info('EvoCrm transactional mail');
        $this->line('  default mailer : '.$mailer);
        $this->line('  from           : '.$fromName.' <'.$from.'>');
        $this->line('  Resend SDK     : '.($sdk ? 'resend/resend-php installed' : 'MISSING — composer require resend/resend-php'));
        $this->line('  RESEND_* key   : '.(filled($key) ? 'set ('.strlen($key).' chars)' : 'empty'));
        $this->line('  sequences      : EVOSALES_SMTP_* workspace mailboxes — not this mailer');

        $ready = $mailer === 'resend' && $sdk && filled($key) && filled($from) && ! str_contains($from, 'example.com');

        if ($mailer === 'log') {
            $this->warn('MAIL_MAILER=log — mail is theater. Flip Contabo to resend for day-1.');
        } elseif ($ready) {
            $this->info('Resend looks configured. Sequences still use workspace SMTP / EVOSALES_SMTP_*.');
        } else {
            $this->warn('Not ready for live Resend. Set MAIL_MAILER=resend, RESEND_API_KEY (or RESEND_KEY), and MAIL_FROM_ADDRESS on a verified domain.');
        }

        $to = (string) $this->option('to');

        if (! $this->option('send')) {
            $this->comment('Dry run. To deliver: php artisan evocrm:mail-smoke --send --to=you@example.com');

            return $ready || $mailer === 'array' ? self::SUCCESS : self::FAILURE;
        }

        if ($to === '' || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            $this->error('--send requires --to= with a valid email address.');

            return self::FAILURE;
        }

        Mail::to($to)->send(new MeetingBookedMail(
            guestName: 'Smoke test',
            hostName: (string) config('app.name'),
            whenLabel: now()->timezone((string) config('app.timezone'))->format('D j M Y H:i'),
            timezone: (string) config('app.timezone'),
            locationNote: 'Transactional mail smoke (default mailer).',
            note: 'This is evocrm:mail-smoke. It is not a booked meeting.',
        ));

        $this->info("Sent MeetingBookedMail to {$to} via the {$mailer} mailer.");

        return self::SUCCESS;
    }
}
