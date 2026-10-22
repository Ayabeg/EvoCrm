<?php

use App\Jobs\ExpandOutboundCampaign;
use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\OutboundCampaign;
use App\Models\OutboundDomain;
use App\Models\OutboundMessage;
use App\Models\OutboundTemplate;
use App\Models\QuietHours;
use App\Models\SavedFilter;
use App\Models\Sequence;
use App\Models\User;
use App\Services\Outbound\CampaignService;
use App\Services\Outbound\EmailHtml;
use App\Services\Outbound\SequenceEnrollment;
use App\Services\Outbound\SuppressionService;
use App\Services\Outbound\TemplateRenderer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Bus;

function enabledMailbox(User $user, array $overrides = []): Mailbox
{
    return Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
        ...$overrides,
    ]);
}

it('creates a broadcast campaign and expands it into logged messages', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $mailbox = enabledMailbox($user);

    $contacts = Contact::factory()->count(3)->create(['workspace_id' => $user->workspace_id]);
    $noEmail = Contact::factory()->create(['workspace_id' => $user->workspace_id, 'email' => null]);

    app(SuppressionService::class)->suppress($user->workspace, 'email', $contacts[2]->email);

    $this->actingAs($user)->post('/outbound/campaigns', [
        'name' => 'August newsletter',
        'mailbox_id' => $mailbox->id,
        'subject' => 'Hello {{first_name}}',
        'body' => 'Bonjour {{first_name}} — https://evotechly.com — {{unsub}}',
        'mode' => 'send_now',
    ])->assertRedirect();

    $campaign = OutboundCampaign::query()->where('workspace_id', $user->workspace_id)->firstOrFail();
    expect($campaign->status)->toBe(OutboundCampaign::STATUS_SENDING);
    expect($campaign->audience_count)->toBe(3);
    expect($campaign->suppressed_count)->toBe(1);

    $messages = OutboundMessage::query()->where('campaign_id', $campaign->id)->get();
    expect($messages)->toHaveCount(2);
    expect($messages->pluck('status')->unique()->all())->toBe(['queued']);
    expect($messages->firstWhere('contact_id', $contacts[0]->id)->subject)->toBe('Hello '.$contacts[0]->first_name);
    expect($messages->firstWhere('contact_id', $noEmail->id))->toBeNull();

    // The runner sends the queued messages and completes the campaign.
    $this->artisan('outbound:run')->assertSuccessful();

    $campaign->refresh();
    expect($campaign->status)->toBe(OutboundCampaign::STATUS_SENT);
    expect($campaign->sent_at)->not->toBeNull();

    $sent = OutboundMessage::query()->where('campaign_id', $campaign->id)->where('status', 'sent')->count();
    expect($sent)->toBe(2);
});

it('expands a scheduled campaign only when due', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    enabledMailbox($user);
    Contact::factory()->count(2)->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)->post('/outbound/campaigns', [
        'name' => 'Scheduled blast',
        'subject' => 'Later',
        'body' => 'Scheduled body',
        'mode' => 'scheduled',
        'scheduled_at' => '2026-08-23 15:30',
    ])->assertRedirect();

    $campaign = OutboundCampaign::query()->where('workspace_id', $user->workspace_id)->firstOrFail();
    expect($campaign->status)->toBe(OutboundCampaign::STATUS_SCHEDULED);

    $this->artisan('outbound:run')->assertSuccessful();
    expect(OutboundMessage::query()->where('campaign_id', $campaign->id)->count())->toBe(0);

    $this->travelTo(Carbon::parse('2026-08-23 16:00:00', 'Africa/Algiers'));
    $this->artisan('outbound:run')->assertSuccessful();

    $campaign->refresh();
    expect($campaign->status)->toBe(OutboundCampaign::STATUS_SENT);
    expect(OutboundMessage::query()->where('campaign_id', $campaign->id)->where('status', 'sent')->count())->toBe(2);
});

it('defers campaign messages during quiet hours and sends after', function () {
    $this->travelTo(Carbon::parse('2026-08-23 22:15:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    QuietHours::query()->where('workspace_id', $user->workspace_id)->update([
        'enabled' => true,
        'timezone' => 'Africa/Algiers',
        'starts_at' => '21:00',
        'ends_at' => '08:00',
    ]);

    enabledMailbox($user);
    Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $campaign = OutboundCampaign::factory()->create(['workspace_id' => $user->workspace_id]);
    app(CampaignService::class)->expand($campaign);

    $this->artisan('outbound:run')->assertSuccessful();

    $message = OutboundMessage::query()->where('campaign_id', $campaign->id)->firstOrFail();
    expect($message->status)->toBe('queued');
    expect($message->defer_reason)->toBe('quiet_hours');
    expect($message->deferred_until->format('H:i'))->toBe('08:00');
    expect($campaign->refresh()->status)->toBe(OutboundCampaign::STATUS_SENDING);

    $this->travelTo(Carbon::parse('2026-08-24 09:00:00', 'Africa/Algiers'));
    $this->artisan('outbound:run')->assertSuccessful();

    expect($message->refresh()->status)->toBe('sent');
    expect($message->defer_reason)->toBeNull();
    expect($campaign->refresh()->status)->toBe(OutboundCampaign::STATUS_SENT);
});

it('defers campaign messages when the mailbox hits its daily cap', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    enabledMailbox($user, ['daily_limit' => 1]);
    Contact::factory()->count(2)->create(['workspace_id' => $user->workspace_id]);

    $campaign = OutboundCampaign::factory()->create(['workspace_id' => $user->workspace_id]);
    app(CampaignService::class)->expand($campaign);

    $this->artisan('outbound:run')->assertSuccessful();

    $messages = OutboundMessage::query()->where('campaign_id', $campaign->id)->get();
    expect($messages->where('status', 'sent'))->toHaveCount(1);

    $deferred = $messages->firstWhere('status', 'queued');
    expect($deferred)->not->toBeNull();
    expect($deferred->defer_reason)->toBe('daily_cap');
});

it('fails a campaign message honestly when the contact is suppressed after expansion', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    enabledMailbox($user);
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $campaign = OutboundCampaign::factory()->create(['workspace_id' => $user->workspace_id]);
    app(CampaignService::class)->expand($campaign);

    app(SuppressionService::class)->suppress($user->workspace, 'email', $contact->email);

    $this->artisan('outbound:run')->assertSuccessful();

    $message = OutboundMessage::query()->where('campaign_id', $campaign->id)->firstOrFail();
    expect($message->status)->toBe('failed');
    expect($message->failure_reason)->toContain('suppression');
});

it('keeps an invalid campaign recipient visible as ineligible', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    enabledMailbox($user);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'not-an-email',
    ]);

    $campaign = OutboundCampaign::factory()->create(['workspace_id' => $user->workspace_id]);
    app(CampaignService::class)->expand($campaign);

    $message = OutboundMessage::query()->where('campaign_id', $campaign->id)->where('contact_id', $contact->id)->firstOrFail();

    expect($message->status)->toBe('failed')
        ->and($message->failure_reason)->toContain('invalid business email');

    $this->artisan('outbound:run')->assertSuccessful();

    expect($message->fresh()->status)->toBe('failed');
});

it('previews campaign eligibility without materializing or sending messages', function () {
    $user = User::factory()->create();
    $eligible = Contact::factory()->create(['workspace_id' => $user->workspace_id, 'email' => 'ok@clinic.dz']);
    $invalid = Contact::factory()->create(['workspace_id' => $user->workspace_id, 'email' => 'not-an-email']);
    $campaign = OutboundCampaign::factory()->create([
        'workspace_id' => $user->workspace_id,
        'subject' => 'Hello {{first_name}}',
        'body' => 'Body for {{first_name}}',
    ]);

    $preview = app(CampaignService::class)->preview($campaign);

    expect($preview['audience_count'])->toBe(2)
        ->and($preview['eligible_count'])->toBe(1)
        ->and($preview['ineligible_count'])->toBe(1)
        ->and($preview['sample'][0]['subject'])->toContain('Hello')
        ->and(OutboundMessage::query()->where('campaign_id', $campaign->id)->count())->toBe(0)
        ->and($eligible->id)->toBeInt();
});

it('expands an audience across bounded chunks', function () {
    $user = User::factory()->create();
    Contact::factory()->count(251)->create(['workspace_id' => $user->workspace_id]);
    $campaign = OutboundCampaign::factory()->create([
        'workspace_id' => $user->workspace_id,
        'subject' => 'Chunk {{first_name}}',
        'body' => 'Body for {{first_name}}',
    ]);

    app(CampaignService::class)->expand($campaign);

    expect($campaign->refresh()->audience_count)->toBe(251)
        ->and(OutboundMessage::query()->where('campaign_id', $campaign->id)->count())->toBe(251);
});

it('queues durable expansion for audiences larger than one thousand contacts', function () {
    Bus::fake();

    $user = User::factory()->create();
    Contact::factory()->count(1001)->create(['workspace_id' => $user->workspace_id]);
    $campaign = OutboundCampaign::factory()->create(['workspace_id' => $user->workspace_id]);

    app(CampaignService::class)->expand($campaign);

    expect($campaign->refresh()->status)->toBe(OutboundCampaign::STATUS_EXPANDING)
        ->and($campaign->audience_count)->toBe(1001)
        ->and(OutboundMessage::query()->where('campaign_id', $campaign->id)->count())->toBe(0);

    Bus::assertDispatched(ExpandOutboundCampaign::class, fn (ExpandOutboundCampaign $job): bool => $job->campaignId === $campaign->id);

    (new ExpandOutboundCampaign($campaign->id))->handle(app(CampaignService::class));

    expect($campaign->refresh()->status)->toBe(OutboundCampaign::STATUS_EXPANDING)
        ->and($campaign->expansion_cursor)->not->toBeNull()
        ->and(OutboundMessage::query()->where('campaign_id', $campaign->id)->count())->toBe(250);
});

it('cancels a sending campaign and drops its queued messages', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    enabledMailbox($user);
    Contact::factory()->count(2)->create(['workspace_id' => $user->workspace_id]);

    $campaign = OutboundCampaign::factory()->create(['workspace_id' => $user->workspace_id]);
    app(CampaignService::class)->expand($campaign);

    $this->actingAs($user)->post("/outbound/campaigns/{$campaign->id}/cancel")->assertRedirect();

    expect($campaign->refresh()->status)->toBe(OutboundCampaign::STATUS_CANCELLED);
    expect(OutboundMessage::query()->where('campaign_id', $campaign->id)->where('status', 'queued')->count())->toBe(0);
});

it('keeps the unsubscribe URL on the CRM host in rendered mail', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $url = app(TemplateRenderer::class)->render('Se désabonner : {{unsub}}', $contact, $user->workspace);

    $appHost = parse_url(config('app.url'), PHP_URL_HOST);
    expect($url)->toContain('http');
    expect(parse_url(str_replace('Se désabonner : ', '', $url), PHP_URL_HOST))->toBe($appHost);
    expect($url)->not->toContain('outbound.evotechly.com');

    // The HTML part always carries the footer link, even without {{unsub}}.
    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Hi',
        'body' => 'Plain body',
        'status' => 'queued',
    ]);

    $html = app(EmailHtml::class)->build($message);
    expect($html)->toContain('/unsubscribe');
    expect($html)->toContain('email='.rawurlencode($contact->email));
    expect($html)->not->toContain('outbound.evotechly.com');
});

it('tracks link clicks through a CRM-host redirect and never rewrites unsubscribe', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Links',
        'body' => 'text twin',
        'body_html' => '<p>Bonjour — <a href="https://evotechly.com/evosales">détails</a></p>',
        'status' => 'sent',
        'sent_at' => now(),
    ]);

    $html = app(EmailHtml::class)->build($message);

    expect($html)->toContain('/outbound/c/'.$message->track_token);
    expect($html)->not->toContain('href="https://evotechly.com/evosales"');

    // The unsubscribe link stays direct (one click, no tracking redirect).
    $unsub = app(TemplateRenderer::class)->unsubscribeUrl($user->workspace, $contact);
    expect($html)->toContain('href="'.$unsub.'"');

    $target = rtrim(strtr(base64_encode('https://evotechly.com/evosales'), '+/', '-_'), '=');
    $response = $this->get("/outbound/c/{$message->track_token}?u={$target}");

    $response->assertRedirect('https://evotechly.com/evosales');
    $message->refresh();
    expect($message->clicked_at)->not->toBeNull();
    expect($message->click_count)->toBe(1);

    // Non-http targets are refused.
    $evil = rtrim(strtr(base64_encode('javascript:alert(1)'), '+/', '-_'), '=');
    $this->get("/outbound/c/{$message->track_token}?u={$evil}")->assertStatus(400);
});

it('does not turn an unknown click token into an open redirect', function () {
    $target = rtrim(strtr(base64_encode('https://evotechly.com/evosales'), '+/', '-_'), '=');

    $this->get('/outbound/c/not-a-message?u='.$target)->assertNotFound();
});

it('manages sending domains with a manual verification mark', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post('/outbound/domains', [
        'domain' => 'Evotechly.COM',
        'spf_record' => 'v=spf1 mx ~all',
    ])->assertRedirect();

    $domain = OutboundDomain::query()->where('workspace_id', $user->workspace_id)->firstOrFail();
    expect($domain->domain)->toBe('evotechly.com');
    expect($domain->status)->toBe(OutboundDomain::STATUS_UNVERIFIED);
    expect($domain->dmarc_record)->toContain('v=DMARC1');

    $this->actingAs($user)->get('/outbound/domains')->assertOk()
        ->assertInertia(fn ($page) => $page->component('outbound/domains/index')->has('domains', 1));

    $this->actingAs($user)->put("/outbound/domains/{$domain->id}", [
        'dkim_selector' => 'mail',
        'dkim_record' => 'v=DKIM1; k=rsa; p=abc',
    ])->assertRedirect();
    expect($domain->refresh()->dkim_record)->toBe('v=DKIM1; k=rsa; p=abc');

    $this->actingAs($user)->post("/outbound/domains/{$domain->id}/verify")->assertRedirect();
    expect($domain->refresh()->status)->toBe(OutboundDomain::STATUS_VERIFIED);
    expect($domain->verified_at)->not->toBeNull();

    // Duplicate domains are rejected per workspace.
    $this->actingAs($user)->from('/outbound/domains')->post('/outbound/domains', [
        'domain' => 'evotechly.com',
    ])->assertSessionHasErrors('domain');

    $this->actingAs($user)->delete("/outbound/domains/{$domain->id}")->assertRedirect();
    expect(OutboundDomain::query()->where('workspace_id', $user->workspace_id)->count())->toBe(0);
});

it('edits a mailbox without re-entering passwords', function () {
    $user = User::factory()->create();
    $mailbox = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
        'status' => 'warming',
    ]);

    $this->actingAs($user)->put("/outbound/mailboxes/{$mailbox->id}", [
        'name' => 'Sales — renamed',
        'from_name' => 'Evotechly Sales',
        'from_address' => 'sales@evotechly.dz',
        'host' => 'smtp.new.example',
        'port' => 465,
        'encryption' => 'ssl',
        'username' => 'sales@evotechly.dz',
        'daily_limit' => 80,
        'status' => 'active',
    ])->assertRedirect();

    $mailbox->refresh();
    expect($mailbox->name)->toBe('Sales — renamed');
    expect($mailbox->host)->toBe('smtp.new.example');
    expect($mailbox->daily_limit)->toBe(80);
    expect($mailbox->status)->toBe('active');
    expect($mailbox->password)->toBe('secret-mailbox-password');
});

it('edits a template and previews it rendered against a CRM contact', function () {
    $user = User::factory()->create();
    Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Nadia',
        'email' => 'nadia@example.dz',
    ]);

    $template = OutboundTemplate::factory()->create([
        'workspace_id' => $user->workspace_id,
        'subject' => 'Hello {{first_name}}',
        'body' => 'Body {{first_name}}',
    ]);

    $this->actingAs($user)->put("/outbound/templates/{$template->id}", [
        'name' => 'Intro v2',
        'subject' => 'Salut {{first_name}}',
        'body' => 'Corps {{first_name}}',
        'body_html' => '<p>Corps {{first_name}}</p>',
    ])->assertRedirect();

    expect($template->refresh()->name)->toBe('Intro v2');
    expect($template->body_html)->toBe('<p>Corps {{first_name}}</p>');

    $this->actingAs($user)->get("/outbound/templates/{$template->id}")->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('outbound/templates/show')
            ->where('preview.subject', 'Salut Nadia')
            ->has('preview.html')
        );
});

it('enrolls a whole CRM list into a sequence', function () {
    $user = User::factory()->create();
    $sequence = Sequence::factory()->create(['workspace_id' => $user->workspace_id, 'channel' => 'email']);

    $alger = Contact::factory()->count(2)->create(['workspace_id' => $user->workspace_id, 'city' => 'Alger']);
    Contact::factory()->create(['workspace_id' => $user->workspace_id, 'city' => 'Oran']);

    $filter = SavedFilter::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'name' => 'Alger contacts',
        'entity' => 'contact',
        'filters' => ['city' => 'Alger'],
    ]);

    $this->actingAs($user)->post("/outbound/sequences/{$sequence->id}/enroll", [
        'saved_filter_id' => $filter->id,
    ])->assertRedirect();

    expect(Enrollment::query()->where('sequence_id', $sequence->id)->count())->toBe(2);
    foreach ($alger as $contact) {
        expect(
            Enrollment::query()
                ->where('sequence_id', $sequence->id)
                ->where('contact_id', $contact->id)
                ->exists()
        )->toBeTrue();
    }
});

it('rejects oversized sequence enrollment requests', function () {
    $user = User::factory()->create();
    $sequence = Sequence::factory()->create(['workspace_id' => $user->workspace_id, 'channel' => 'email']);
    $contacts = Contact::factory()->count(251)->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->post("/outbound/sequences/{$sequence->id}/enroll", [
            'contact_ids' => $contacts->pluck('id')->all(),
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('contact_ids');

    expect(Enrollment::query()->where('sequence_id', $sequence->id)->count())->toBe(0);
});

it('sends a sequence step through its pinned mailbox', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $default = enabledMailbox($user, ['name' => 'Default', 'is_default' => true]);
    $pinned = enabledMailbox($user, ['name' => 'Pinned', 'is_default' => false]);

    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
        'active' => true,
    ]);
    $sequence->steps()->create([
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'mailbox_id' => $pinned->id,
        'subject' => 'Pinned send',
        'body' => 'Via the pinned mailbox',
    ]);

    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact);

    $this->artisan('outbound:run')->assertSuccessful();

    $message = OutboundMessage::query()->where('sequence_id', $sequence->id)->firstOrFail();
    expect($message->status)->toBe('sent');
    expect($message->mailbox_id)->toBe($pinned->id);
    expect($message->mailbox_id)->not->toBe($default->id);
});

it('shows deferred, suppressed, and mailbox health on the overview', function () {
    $user = User::factory()->create();
    enabledMailbox($user);

    $this->actingAs($user)->get('/outbound')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('outbound/index')
            ->has('stats.deferred')
            ->has('stats.suppressed')
            ->has('stats.campaigns_sending')
            ->has('stats.domains_verified')
            ->has('mailboxHealth', 1)
        );
});

it('keeps the BillionMail dashboard out of the UI and the stack host config-driven', function () {
    // The live mail stack is reachable from the product only through
    // config('evosales.mail_stack.*'): SMTP/IMAP hostnames and the Roundcube
    // URL. No source file may hardcode the stack host or name the marketing
    // dashboard — so the only outbound.evotechly.com URL the UI can render
    // is the Roundcube one from env.
    $roots = [
        base_path('resources/js'),
        base_path('resources/views'),
        base_path('app'),
        base_path('routes'),
    ];

    $offenders = [];

    foreach ($roots as $root) {
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root)) as $file) {
            if (! $file->isFile()) {
                continue;
            }

            $contents = file_get_contents($file->getPathname());

            foreach (['outbound.evotechly.com', 'billionmail'] as $needle) {
                if (str_contains(strtolower($contents), $needle)) {
                    $offenders[] = $file->getPathname();
                }
            }
        }
    }

    expect($offenders)->toBe([]);
});
