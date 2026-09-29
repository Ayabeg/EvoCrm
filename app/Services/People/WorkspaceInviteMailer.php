<?php

namespace App\Services\People;

use App\Mail\WorkspaceInviteMail;
use App\Models\User;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Outbound\MailerFactory;
use App\Services\Outbound\SmtpMailboxMailer;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;

/**
 * Issues the first-login email for a workspace invite. Prefer the
 * workspace's default enabled mailbox (SmtpMailboxMailer). When none is
 * enabled, fall back to Laravel's default mailer if it is a real
 * transactional transport (Resend on Contabo day-1). Never send a
 * standing password — the link is a single-use Fortify reset token.
 */
class WorkspaceInviteMailer
{
    /**
     * Default mailers that can deliver without a workspace SMTP mailbox.
     *
     * @var list<string>
     */
    private const TRANSACTIONAL_DEFAULT_MAILERS = [
        'resend',
        'smtp',
        'ses',
        'postmark',
        'mailgun',
        'failover',
    ];

    public function __construct(
        private MailerFactory $mailers,
        private ProductAnalytics $analytics,
    ) {}

    public function send(User $invitee, User $inviter): InviteSendResult
    {
        $workspace = $invitee->workspace;

        if (! $workspace) {
            return InviteSendResult::failed('The invited user has no workspace.');
        }

        $mailbox = $this->mailers->resolve($workspace);

        if (! $mailbox && ! $this->canUseDefaultMailer()) {
            return InviteSendResult::noMailbox();
        }

        $mailable = new WorkspaceInviteMail(
            inviteeName: $invitee->name,
            workspaceName: $workspace->name,
            inviterName: $inviter->name,
            inviteUrl: $this->setPasswordUrl($invitee),
        );

        // Tests and the array mailer stay on send() so Mail::fake() can
        // assert the same mailable production Resend will send. Production
        // Resend (no workspace mailbox) is queued onto the default mailer.
        if (app()->environment('testing') || config('mail.default') === 'array') {
            Mail::to($invitee->email)->send($mailable);
            $this->recordInvite($invitee, $inviter);

            return InviteSendResult::sent();
        }

        if (! $mailbox) {
            Mail::to($invitee->email)->queue($mailable);
            $this->recordInvite($invitee, $inviter);

            return InviteSendResult::sent();
        }

        try {
            $content = $mailable->content();
            $data = [
                'inviteeName' => $mailable->inviteeName,
                'workspaceName' => $mailable->workspaceName,
                'inviterName' => $mailable->inviterName,
                'inviteUrl' => $mailable->inviteUrl,
            ];

            (new SmtpMailboxMailer($mailbox))->sendAdHoc(
                $invitee->email,
                $mailable->envelope()->subject ?? config('app.name'),
                view($content->text ?? 'mail.workspace-invite-text', $data)->render(),
                view($content->view ?? 'mail.workspace-invite', $data)->render(),
            );
        } catch (\Throwable $e) {
            return InviteSendResult::failed($e->getMessage());
        }

        $this->recordInvite($invitee, $inviter);

        return InviteSendResult::sent();
    }

    private function recordInvite(User $invitee, User $inviter): void
    {
        $this->analytics->capture(ProductAnalytics::USER_INVITED, [
            'invitee_id' => $invitee->id,
            'role' => $invitee->role->value,
        ], $inviter, $invitee->workspace);
    }

    private function canUseDefaultMailer(): bool
    {
        return in_array((string) config('mail.default'), self::TRANSACTIONAL_DEFAULT_MAILERS, true);
    }

    /**
     * First-login link: a Fortify password-reset token on the CRM hostname
     * (APP_URL). Single use, expires with the broker — never a password.
     */
    private function setPasswordUrl(User $invitee): string
    {
        $token = Password::broker()->createToken($invitee);

        return route('password.reset', ['token' => $token, 'email' => $invitee->email]);
    }
}
