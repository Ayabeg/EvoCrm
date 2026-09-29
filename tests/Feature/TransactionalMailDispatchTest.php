<?php

use App\Mail\WorkspaceHtmlMail;
use App\Mail\WorkspaceInviteMail;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Mailbox;
use App\Models\Quote;
use App\Models\User;
use App\Notifications\QueuedResetPassword;
use App\Notifications\QueuedVerifyEmail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

it('dispatches password reset through a queued notification on the default mailer', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, QueuedResetPassword::class, function ($notification) {
        return $notification instanceof ShouldQueue;
    });
});

it('dispatches email verification through a queued notification on the default mailer', function () {
    Notification::fake();
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->post(route('verification.send'))
        ->assertRedirect();

    Notification::assertSentTo($user, QueuedVerifyEmail::class, function ($notification) {
        return $notification instanceof ShouldQueue;
    });
});

it('dispatches workspace invite mail through the configured mailer', function () {
    Mail::fake();
    $owner = User::factory()->create();
    Mailbox::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'enabled' => true,
        'is_default' => true,
    ]);

    $this->actingAs($owner)
        ->post(route('settings.people.store'), [
            'name' => 'Mail Pilot',
            'email' => 'mail-pilot@evotechly.com',
            'role' => 'member',
        ])
        ->assertRedirect();

    Mail::assertSent(WorkspaceInviteMail::class, fn (WorkspaceInviteMail $mail) => $mail->hasTo('mail-pilot@evotechly.com'));
});

it('dispatches quote-send mail through the configured mailer', function () {
    Mail::fake();
    $user = User::factory()->create();
    Mailbox::factory()->create(['workspace_id' => $user->workspace_id]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create([
            'workspace_id' => $user->workspace_id,
            'email' => 'buyer@clinic.dz',
        ])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => 'Quoted clinic deal',
        'amount_cents' => 1_800_000,
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/quotes", [
            'notes' => 'Valid 14 days',
            'items' => [
                ['name' => 'EvoCrm workspace', 'quantity' => 1, 'unit_dzd' => 180000],
            ],
        ])
        ->assertRedirect();

    $quote = Quote::query()->where('deal_id', $deal->id)->sole();

    $this->actingAs($user)
        ->post("/crm/quotes/{$quote->id}/send")
        ->assertRedirect();

    Mail::assertSent(WorkspaceHtmlMail::class, fn (WorkspaceHtmlMail $mail) => $mail->hasTo('buyer@clinic.dz'));
});
