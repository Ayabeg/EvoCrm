<?php

namespace App\Services\People;

use App\Mail\WorkspaceInviteMail;
use App\Models\User;
use App\Services\Outbound\MailerFactory;
use App\Services\Outbound\SmtpMailboxMailer;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;

/**
 * Issues the first-login email for a workspace invite. The mail leaves
 * through the workspace's default enabled mailbox (the SmtpMailboxMailer
 * path) — never MAIL_MAILER=log, never a plaintext standing password. The
 * link is a single-use Fortify password-reset token on the CRM hostname.
 */
class WorkspaceInviteMailer
{
    public function __construct(private MailerFactory $mailers) {}

    public function send(User $invitee, User $inviter): InviteSendResult
    {
        $workspace = $invitee->workspace;

        if (! $workspace) {
            return InviteSendResult::failed('The invited user has no workspace.');
        }

        $mailbox = $this->mailers->resolve($workspace);

        if (! $mailbox) {
            return InviteSendResult::noMailbox();
        }

        $mailable = new WorkspaceInviteMail(
            inviteeName: $invitee->name,
            workspaceName: $workspace->name,
            inviterName: $inviter->name,
            inviteUrl: $this->setPasswordUrl($invitee),
        );

        // Tests and the array mailer never open a real SMTP connection — the
        // mailable goes through the Laravel mailer so Mail::fake() asserts it.
        if (app()->environment('testing') || config('mail.default') === 'array') {
            Mail::to($invitee->email)->send($mailable);

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
                $mailable->envelope()->subject ?? 'EvoSales · Evotechly',
                view($content->text ?? 'mail.workspace-invite-text', $data)->render(),
                view($content->view ?? 'mail.workspace-invite', $data)->render(),
            );
        } catch (\Throwable $e) {
            return InviteSendResult::failed($e->getMessage());
        }

        return InviteSendResult::sent();
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
