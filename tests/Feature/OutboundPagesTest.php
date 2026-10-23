<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\FunnelEvent;
use App\Models\Mailbox;
use App\Models\OutboundCampaign;
use App\Models\OutboundMessage;
use App\Models\OutboundTemplate;
use App\Models\SavedFilter;
use App\Models\User;
use App\Services\Outbound\OutboundDispatcher;
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
            ->where('outboundDetail.tracking.sent.count', 1)
            ->where('outboundDetail.tracking.sent.denominator', 1)
            ->where('outboundDetail.tracking.sent.quality', 'inferred')
            ->where('outboundDetail.tracking.delivered.quality', 'actual')
            ->where('outboundDetail.tracking.opened.caveat', 'Opens are not reliable proof of interest.')
        );
});

it('reports explicit outbound denominators and CRM outcomes', function () {
    $this->travelTo(Carbon::parse('2026-10-23 12:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $campaign = OutboundCampaign::factory()->create([
        'workspace_id' => $user->workspace_id,
        'audience_count' => 2,
    ]);
    $mailbox = Mailbox::factory()->create(['workspace_id' => $user->workspace_id, 'enabled' => false]);

    OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'mailbox_id' => $mailbox->id,
        'campaign_id' => $campaign->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Hello',
        'body' => 'Body',
        'status' => 'sent',
        'sent_at' => now(),
        'delivered_at' => now(),
        'replied_at' => now(),
    ]);
    OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'mailbox_id' => $mailbox->id,
        'campaign_id' => $campaign->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Older message',
        'body' => 'Older body',
        'status' => 'sent',
        'sent_at' => now()->subDays(60),
        'created_at' => now()->subDays(60),
        'updated_at' => now()->subDays(60),
    ]);
    FunnelEvent::query()->create([
        'workspace_id' => $user->workspace_id,
        'event_type' => FunnelEvent::TYPE_DEMO_REQUESTED,
        'contact_id' => $contact->id,
        'source' => 'outbound',
        'occurred_at' => now(),
    ]);
    FunnelEvent::query()->create([
        'workspace_id' => $user->workspace_id,
        'event_type' => FunnelEvent::TYPE_DEMO_REQUESTED,
        'contact_id' => $contact->id,
        'source' => 'outbound',
        'occurred_at' => now()->subDays(60),
    ]);
    FunnelEvent::query()->create([
        'workspace_id' => $user->workspace_id,
        'event_type' => FunnelEvent::TYPE_MEETING_BOOKED,
        'contact_id' => $contact->id,
        'source' => 'outbound',
        'occurred_at' => now(),
    ]);

    $this->actingAs($user)->get('/reports/outbound?from=2026-10-01&to=2026-10-23')->assertInertia(fn ($page) => $page
        ->where('outboundDetail.tracking.selected.count', 2)
        ->where('outboundDetail.tracking.sent.denominator', 1)
        ->where('outboundDetail.tracking.delivered.rate', 100)
        ->where('outboundDetail.tracking.qualified_opportunities.denominator', null)
        ->where('outboundDetail.tracking.demo_requests.count', 1)
        ->where('outboundDetail.tracking.demos_booked.count', 1)
        ->where('outboundDetail.perCampaign.0.sent', 1)
        ->where('outboundDetail.tracking.customers_won.source', 'crm_pipeline')
    );
});

it('attributes outbound campaign reporting to won contact revenue', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $campaign = OutboundCampaign::factory()->create(['workspace_id' => $user->workspace_id]);
    $mailbox = Mailbox::factory()->create(['workspace_id' => $user->workspace_id, 'enabled' => false]);
    $pipeline = $user->workspace->defaultPipeline();

    OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'mailbox_id' => $mailbox->id,
        'campaign_id' => $campaign->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Campaign',
        'body' => 'Body',
        'status' => 'sent',
        'sent_at' => now(),
        'replied_at' => now(),
    ]);
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('won')->id,
        'title' => 'Won from campaign',
        'amount_cents' => 250_000,
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get('/reports/outbound')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('outboundDetail.perCampaign.0.won_deals', 1)
            ->where('outboundDetail.perCampaign.0.won_revenue_cents', 250_000)
        );
});

it('scopes outbound detail metrics to the selected contact owner', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);
    $mailbox = Mailbox::factory()->create(['workspace_id' => $user->workspace_id, 'enabled' => false]);

    foreach ([$user, $other] as $owner) {
        $contact = Contact::factory()->create([
            'workspace_id' => $user->workspace_id,
            'owner_id' => $owner->id,
        ]);
        $campaign = OutboundCampaign::factory()->create([
            'workspace_id' => $user->workspace_id,
            'audience_count' => 1,
        ]);

        OutboundMessage::query()->create([
            'workspace_id' => $user->workspace_id,
            'contact_id' => $contact->id,
            'mailbox_id' => $mailbox->id,
            'campaign_id' => $campaign->id,
            'channel' => 'email',
            'direction' => 'out',
            'to_address' => $contact->email,
            'subject' => 'Owner report',
            'body' => 'Body',
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    $this->actingAs($user)
        ->get('/reports/outbound?owner='.$user->id)
        ->assertInertia(fn ($page) => $page
            ->where('window.owner_id', $user->id)
            ->where('outboundDetail.totals.sent', 1)
            ->where('outboundDetail.tracking.selected.count', 1)
            ->has('outboundDetail.perCampaign', 1));
});

it('edits draft and scheduled campaigns within the current workspace', function () {
    $user = User::factory()->create();
    $foreign = User::factory()->create();
    $filter = SavedFilter::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinics',
        'entity' => 'contact',
        'filters' => [],
    ]);
    $foreignFilter = SavedFilter::query()->create([
        'workspace_id' => $foreign->workspace_id,
        'name' => 'Foreign',
        'entity' => 'contact',
        'filters' => [],
    ]);
    $mailbox = Mailbox::factory()->create(['workspace_id' => $user->workspace_id]);
    $campaign = OutboundCampaign::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)->put("/outbound/campaigns/{$campaign->id}", [
        'name' => 'Updated clinic outreach',
        'saved_filter_id' => $foreignFilter->id,
        'mailbox_id' => $mailbox->id,
        'subject' => 'A better subject',
        'body' => 'Updated body for {{company}}.',
        'email_verification_policy' => 'strict',
        'mode' => 'scheduled',
        'scheduled_at' => '2026-10-25 10:00:00',
    ])->assertRedirect();

    expect($campaign->refresh()->name)->toBe('Updated clinic outreach')
        ->and($campaign->status)->toBe(OutboundCampaign::STATUS_SCHEDULED)
        ->and($campaign->saved_filter_id)->toBeNull()
        ->and($campaign->mailbox_id)->toBe($mailbox->id)
        ->and($campaign->scheduled_at?->format('Y-m-d H:i:s'))->toBe('2026-10-25 10:00:00');

    $this->actingAs($user)->put("/outbound/campaigns/{$campaign->id}", [
        'name' => 'Saved draft',
        'saved_filter_id' => $filter->id,
        'subject' => 'Draft subject',
        'body' => 'Draft body',
        'email_verification_policy' => 'allow_unknown',
        'mode' => 'draft',
    ])->assertRedirect();

    expect($campaign->refresh()->status)->toBe(OutboundCampaign::STATUS_DRAFT)
        ->and($campaign->saved_filter_id)->toBe($filter->id)
        ->and($campaign->scheduled_at)->toBeNull()
        ->and($campaign->email_verification_policy)->toBe('allow_unknown');
});

it('does not edit a campaign after it has started', function () {
    $user = User::factory()->create();
    $campaign = OutboundCampaign::factory()->create([
        'workspace_id' => $user->workspace_id,
        'status' => OutboundCampaign::STATUS_SENDING,
        'name' => 'Locked campaign',
    ]);

    $this->actingAs($user)->put("/outbound/campaigns/{$campaign->id}", [
        'name' => 'Should not change',
        'body' => 'Body',
        'mode' => 'draft',
    ])->assertStatus(409);

    expect($campaign->refresh()->name)->toBe('Locked campaign');
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

it('keeps ordinary dispatcher sends fail-closed when the contact is unverified', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'unverified@example.dz',
        'meta' => [],
    ]);

    $message = app(OutboundDispatcher::class)->dispatch($user->workspace, $contact, [
        'channel' => 'email',
        'subject' => 'Should not send',
        'body' => 'Verification required',
    ]);

    expect($message->status)->toBe('failed')
        ->and($message->failure_reason)->toContain('verification is unknown');
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
