<?php

use App\Models\Contact;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Models\OutboundTemplate;
use App\Models\User;
use Illuminate\Support\Carbon;

it('renders the outbound overview, outbox, replies, and reports pages', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $mailbox = Mailbox::factory()->create(['workspace_id' => $user->workspace_id, 'enabled' => false]);

    OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'mailbox_id' => $mailbox->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Hello',
        'body' => 'Body',
        'status' => 'sent',
        'sent_at' => now(),
        'opened_at' => now(),
        'open_count' => 1,
    ]);

    OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'mailbox_id' => $mailbox->id,
        'channel' => 'email',
        'direction' => 'in',
        'to_address' => $mailbox->from_address,
        'subject' => 'Re: Hello',
        'body' => 'Interested.',
        'status' => 'received',
    ]);

    $this->actingAs($user)->get('/outbound')->assertOk()
        ->assertInertia(fn ($page) => $page->component('outbound/index')->has('stats')->has('recent', 2));

    $this->actingAs($user)->get('/outbound/outbox')->assertOk()
        ->assertInertia(fn ($page) => $page->component('outbound/outbox')->has('messages', 1)->where('counts.sent', 1));

    $this->actingAs($user)->get('/outbound/replies')->assertOk()
        ->assertInertia(fn ($page) => $page->component('outbound/replies')->has('replies', 1));

    $this->actingAs($user)->get('/outbound/reports')
        ->assertRedirect('/reports/outbound');

    $this->actingAs($user)->get('/reports/outbound')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/reports')
            ->where('activeCategory', 'outbound')
            ->where('categories.0.key', 'outbound')
            ->where('outboundDetail.totals.sent', 1)
            ->where('outboundDetail.totals.opened', 1)
            ->has('outboundDetail.tracking.opened')
            ->has('outboundDetail.tracking.bounced')
        );
});

it('manages email templates with variables', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post('/outbound/templates', [
        'name' => 'Intro',
        'subject' => 'Hello {{first_name}}',
        'body' => 'Body for {{company}}',
    ])->assertRedirect();

    $template = OutboundTemplate::query()->where('workspace_id', $user->workspace_id)->firstOrFail();

    $this->actingAs($user)->get('/outbound/templates')->assertOk()
        ->assertInertia(fn ($page) => $page->component('outbound/templates/index')->has('templates', 1));

    $this->actingAs($user)->delete("/outbound/templates/{$template->id}")->assertRedirect();
    expect(OutboundTemplate::query()->where('workspace_id', $user->workspace_id)->count())->toBe(0);
});

it('creates mailboxes disabled and sends a test through the dispatcher', function () {
    // Outside quiet hours (21:00–08:00 Africa/Algiers) so the dispatcher sends.
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();

    $this->actingAs($user)->post('/outbound/mailboxes', [
        'name' => 'Sales box',
        'from_name' => 'Evotechly',
        'from_address' => 'hello@evotechly.dz',
        'host' => 'smtp.example.test',
        'port' => 587,
        'encryption' => 'tls',
        'username' => 'hello@evotechly.dz',
        'password' => 'secret',
        'imap_host' => 'imap.example.test',
        'imap_port' => 993,
        'imap_encryption' => 'ssl',
        'imap_username' => 'hello@evotechly.dz',
        'imap_password' => 'secret-imap',
        'daily_limit' => 40,
    ])->assertRedirect();

    $mailbox = Mailbox::query()->where('workspace_id', $user->workspace_id)->firstOrFail();
    expect($mailbox->enabled)->toBeFalse();
    expect($mailbox->effectiveStatus())->toBe('disabled');
    expect($mailbox->imapConfigured())->toBeTrue();

    // Enable, then test-send (testing mailer path → sent + logged in outbox).
    $this->actingAs($user)->post("/outbound/mailboxes/{$mailbox->id}/toggle")->assertRedirect();
    expect($mailbox->refresh()->enabled)->toBeTrue();
    expect($mailbox->effectiveStatus())->toBe('warming');

    $this->actingAs($user)->post("/outbound/mailboxes/{$mailbox->id}/test", [
        'to' => 'owner@evotechly.dz',
    ])->assertRedirect();

    $message = OutboundMessage::query()->where('mailbox_id', $mailbox->id)->firstOrFail();
    expect($message->status)->toBe('sent');
    expect($message->to_address)->toBe('owner@evotechly.dz');
    expect($mailbox->refresh()->last_tested_at)->not->toBeNull();
});

it('marks outbound messages opened through the tracking pixel', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Pixel test',
        'body' => 'Body',
        'status' => 'sent',
        'sent_at' => now(),
    ]);

    $response = $this->get("/outbound/t/{$message->track_token}.gif");

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toBe('image/gif');

    $message->refresh();
    expect($message->opened_at)->not->toBeNull();
    expect($message->open_count)->toBe(1);

    // Unknown tokens still return the pixel (no oracle).
    $this->get('/outbound/t/nonexistent.gif')->assertOk();
});
