<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Mailbox;
use App\Models\OutboundCampaign;
use App\Models\OutboundMessage;
use App\Models\Quote;
use App\Models\User;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Crm\LeadConverter;
use App\Services\Identity\WorkspaceProvisioner;
use App\Services\Outbound\CampaignService;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Support\Facades\Mail;

it('records contact created against the authenticated user and workspace', function () {
    $user = User::factory()->create();
    $analytics = app(ProductAnalytics::class);
    $analytics->flushRecorded();

    $this->actingAs($user)
        ->post('/crm/contacts', [
            'first_name' => 'Amine',
            'last_name' => 'Hub',
            'phone' => '0550199002',
            'email' => 'amine.hub@evotechly.dz',
        ])
        ->assertRedirect();

    $event = $analytics->last(ProductAnalytics::CONTACT_CREATED);

    expect($analytics->eventNames())->toContain(ProductAnalytics::CONTACT_CREATED)
        ->and($event)->not->toBeNull()
        ->and($event['distinctId'])->toBe((string) $user->id)
        ->and($event['groups']['workspace'])->toBe((string) $user->workspace_id)
        ->and($event['properties']['contact_id'])->toBeInt();
});

it('ignores a forged client analytics identity for authenticated events', function () {
    $user = User::factory()->create();
    $analytics = app(ProductAnalytics::class);
    $analytics->setRequestContext('forged-user-id', 'forged-session');
    $analytics->flushRecorded();

    $analytics->capture('authenticated event', [], $user, $user->workspace);

    expect($analytics->last('authenticated event')['distinctId'])->toBe((string) $user->id);
});

it('records deal created, stage change, and won on the workspace group', function () {
    $user = User::factory()->create();
    app(WorkspaceProvisioner::class)->seedDefaults($user->workspace);
    $pipeline = $user->workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $analytics = app(ProductAnalytics::class);
    $analytics->flushRecorded();

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Hub deal',
        'amount_cents' => 150000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);

    $won = $pipeline->stages()->where('is_won', true)->first();
    expect($won)->not->toBeNull();

    $deal->forceFill(['stage_id' => $won->id])->save();

    expect($analytics->eventNames())->toContain(ProductAnalytics::DEAL_CREATED)
        ->and($analytics->eventNames())->toContain(ProductAnalytics::DEAL_STAGE_CHANGED)
        ->and($analytics->eventNames())->toContain(ProductAnalytics::DEAL_WON);

    $wonEvent = $analytics->last(ProductAnalytics::DEAL_WON);

    expect($wonEvent['groups']['workspace'])->toBe((string) $user->workspace_id)
        ->and($wonEvent['properties']['deal_id'])->toBe($deal->id)
        ->and($wonEvent['properties']['amount_cents'])->toBe(150000);
});

it('records lead created, qualified, and converted', function () {
    $user = User::factory()->create();
    app(WorkspaceProvisioner::class)->seedDefaults($user->workspace);
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $analytics = app(ProductAnalytics::class);
    $analytics->flushRecorded();

    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'title' => 'Hub lead',
        'source' => 'meta_ads',
    ]);

    $this->actingAs($user);
    app(LeadConverter::class)->convert($lead, $user);

    expect($analytics->eventNames())->toContain(ProductAnalytics::LEAD_CREATED)
        ->and($analytics->eventNames())->toContain(ProductAnalytics::LEAD_QUALIFIED)
        ->and($analytics->eventNames())->toContain(ProductAnalytics::LEAD_CONVERTED)
        ->and($analytics->last(ProductAnalytics::LEAD_CONVERTED)['properties']['lead_id'])->toBe($lead->id);
});

it('identifies the user and records login on the workspace group', function () {
    $user = User::factory()->create();
    $analytics = app(ProductAnalytics::class);
    $analytics->flushRecorded();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect();

    $this->assertAuthenticated();

    expect($analytics->eventNames())->toContain('$identify')
        ->and($analytics->eventNames())->toContain(ProductAnalytics::USER_LOGGED_IN);

    $login = $analytics->last(ProductAnalytics::USER_LOGGED_IN);

    expect($login['distinctId'])->toBe((string) $user->id)
        ->and($login['groups']['workspace'])->toBe((string) $user->workspace_id)
        ->and($login['properties'])->not->toHaveKey('email');
});

it('records workspace created when a workspace is provisioned', function () {
    $analytics = app(ProductAnalytics::class);
    $analytics->flushRecorded();

    $workspace = app(WorkspaceProvisioner::class)->provision('Analytics Co');

    expect($analytics->eventNames())->toContain(ProductAnalytics::WORKSPACE_CREATED)
        ->and($analytics->last(ProductAnalytics::WORKSPACE_CREATED)['properties']['name'])->toBe('Analytics Co')
        ->and($analytics->last('$groupidentify')['groups']['workspace'])->toBe((string) $workspace->id);
});

it('records company created, quote sent, campaign launched, invite, and bounce', function () {
    Mail::fake();

    $user = User::factory()->create();
    app(WorkspaceProvisioner::class)->seedDefaults($user->workspace);
    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
        'is_default' => true,
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'buyer@clinic.dz',
    ]);
    $analytics = app(ProductAnalytics::class);
    $analytics->flushRecorded();

    $this->actingAs($user)
        ->post('/crm/companies', ['name' => 'Hub Clinic'])
        ->assertRedirect();

    expect($analytics->eventNames())->toContain(ProductAnalytics::COMPANY_CREATED);

    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
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
                ['name' => 'EvoSales workspace', 'quantity' => 1, 'unit_dzd' => 180000],
            ],
        ])
        ->assertRedirect();

    $quote = Quote::query()->where('deal_id', $deal->id)->sole();

    $this->actingAs($user)
        ->post("/crm/quotes/{$quote->id}/send")
        ->assertRedirect();

    expect($analytics->eventNames())->toContain(ProductAnalytics::QUOTE_SENT)
        ->and($analytics->last(ProductAnalytics::QUOTE_SENT)['properties']['quote_id'])->toBe($quote->id);

    $campaign = OutboundCampaign::factory()->create(['workspace_id' => $user->workspace_id]);
    app(CampaignService::class)->expand($campaign);

    expect($analytics->eventNames())->toContain(ProductAnalytics::CAMPAIGN_LAUNCHED)
        ->and($analytics->last(ProductAnalytics::CAMPAIGN_LAUNCHED)['properties']['campaign_id'])->toBe($campaign->id);

    $this->actingAs($user)
        ->post(route('settings.people.store'), [
            'name' => 'New Admin',
            'email' => 'admin.hub@evotechly.com',
            'role' => 'admin',
        ])
        ->assertRedirect();

    expect($analytics->eventNames())->toContain(ProductAnalytics::USER_INVITED);

    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'buyer@clinic.dz',
        'subject' => 'Follow up',
        'body' => 'Hello',
        'status' => 'sent',
        'sent_at' => now(),
    ]);
    $endpoint = app(WebhookEndpointManager::class)->forWorkspace(
        $user->workspace,
        WebhookEndpointManager::PROVIDER_OUTBOUND_BOUNCE,
    );

    $this->postJson("/webhooks/outbound/bounces/{$endpoint->key}", [
        'event_id' => 'evt-hub-1',
        'message_id' => $message->id,
        'type' => 'hard',
        'email' => 'buyer@clinic.dz',
    ])->assertOk();

    expect($analytics->eventNames())->toContain(ProductAnalytics::EMAIL_BOUNCED)
        ->and($analytics->last(ProductAnalytics::EMAIL_BOUNCED)['properties']['bounce_type'])->toBe('hard');
});

it('shares posthog config on inertia pages', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('posthog')
            ->where('posthog.host', 'https://us.i.posthog.com')
            ->where('posthog.distinct_id', (string) $user->id)
            ->has('workspace.id')
        );
});
