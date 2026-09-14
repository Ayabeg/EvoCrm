<?php

use App\Mail\MeetingBookedMail;
use App\Mail\WorkspaceInviteMail;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Meetings\MeetingMailer;
use App\Services\People\WorkspaceInviteMailer;
use Illuminate\Support\Facades\Mail;

it('installs the Laravel Resend SDK and accepts RESEND_KEY as an alias', function () {
    expect(class_exists(Resend::class))->toBeTrue();

    $services = file_get_contents(config_path('services.php'));
    expect($services)->toContain("env('RESEND_API_KEY', env('RESEND_KEY'))");

    $transport = app('mail.manager')->createSymfonyTransport([
        'transport' => 'resend',
        'key' => 're_test_not_a_live_key',
    ]);

    expect((string) $transport)->toBe('resend');
});

it('sends meeting booked and workspace invite through the default Resend mailer when no mailbox exists', function () {
    config(['mail.default' => 'resend']);
    Mail::fake();

    $workspace = Workspace::factory()->create();
    $host = User::factory()->create(['workspace_id' => $workspace->id, 'name' => 'Amina']);
    $invitee = User::factory()->unverified()->create([
        'workspace_id' => $workspace->id,
        'email' => 'invitee@clinic.dz',
        'name' => 'Karim',
    ]);

    $mailable = new MeetingBookedMail(
        guestName: 'Karim',
        hostName: 'Amina',
        whenLabel: 'Thu 10 Sep 2026 09:00',
        timezone: 'Africa/Algiers',
        locationNote: 'Meet link in the invite',
        note: null,
    );

    expect($mailable->mailer)->toBeNull();

    app(MeetingMailer::class)->send($workspace, 'karim@clinic.dz', $host->email, $mailable);

    $invite = app(WorkspaceInviteMailer::class)->send($invitee, $host);

    expect($invite->ok())->toBeTrue();

    Mail::assertSent(MeetingBookedMail::class, function (MeetingBookedMail $mail) use ($host) {
        return $mail->hasTo('karim@clinic.dz')
            && $mail->hasCc($host->email)
            && $mail->mailer === 'resend';
    });

    Mail::assertSent(WorkspaceInviteMail::class, function (WorkspaceInviteMail $mail) {
        return $mail->hasTo('invitee@clinic.dz')
            && in_array($mail->mailer, [null, 'resend'], true);
    });
});

it('reports Resend readiness from evocrm:mail-smoke without calling the live API', function () {
    config([
        'mail.default' => 'resend',
        'mail.from.address' => 'noreply@evocrmapp.com',
        'mail.from.name' => 'EvoCrm · Evotechly',
        'services.resend.key' => 're_test_not_a_live_key',
    ]);
    Mail::fake();

    $this->artisan('evocrm:mail-smoke')
        ->expectsOutputToContain('default mailer : resend')
        ->expectsOutputToContain('noreply@evocrmapp.com')
        ->expectsOutputToContain('Resend SDK')
        ->expectsOutputToContain('set (')
        ->expectsOutputToContain('EVOSALES_SMTP_*')
        ->assertSuccessful();

    Mail::assertNothingSent();

    $this->artisan('evocrm:mail-smoke', ['--send' => true, '--to' => 'ops@evotechly.com'])
        ->expectsOutputToContain('Sent MeetingBookedMail to ops@evotechly.com')
        ->assertSuccessful();

    Mail::assertSent(MeetingBookedMail::class, fn (MeetingBookedMail $mail) => $mail->hasTo('ops@evotechly.com')
        && $mail->mailer === 'resend');
});
