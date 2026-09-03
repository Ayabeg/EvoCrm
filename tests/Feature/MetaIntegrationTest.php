<?php

use App\Jobs\ProcessMetaWebhookEvent;
use App\Models\Ad;
use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdLead;
use App\Models\AdSet;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Integration;
use App\Models\Lead;
use App\Models\MetaConversionConfig;
use App\Models\MetaConversionEvent;
use App\Models\MetaFieldMapping;
use App\Models\MetaWebhookEvent;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Ads\LeadFormIngestor;
use App\Services\Ads\MetaAdsService;
use App\Services\Meta\MetaConversionsService;
use App\Services\Meta\MetaFieldMapper;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as MetaUser;

function connectMeta(Workspace $workspace, string $token = 'token', string $accountId = 'act_111'): Integration
{
    return $workspace->integrations()->create([
        'provider' => Integration::PROVIDER_META,
        'status' => 'connected',
        'access_token' => $token,
        'scopes' => ['ads_management', 'leads_retrieval', 'pages_show_list'],
        'meta' => [
            'ad_accounts' => [['id' => $accountId, 'name' => 'Ads']],
            'selected_ad_account_id' => $accountId,
            'pages' => [['id' => 'page-1', 'name' => 'Page']],
        ],
        'connected_at' => now(),
        'expires_at' => now()->addDays(30),
    ]);
}

function metaSignature(array $payload, string $secret = 'meta-app-secret'): string
{
    return 'sha256='.hash_hmac('sha256', json_encode($payload, JSON_THROW_ON_ERROR), $secret);
}

it('rejects an invalid Meta OAuth callback without storing a token', function () {
    config()->set('meta.app_id', 'app');
    config()->set('meta.app_secret', 'secret');

    Socialite::shouldReceive('driver')->once()->with('meta')->andThrow(new RuntimeException('Invalid state'));

    $user = User::factory()->create();

    $this->actingAs($user)->get('/auth/meta/callback')->assertRedirect();

    expect(Integration::query()->count())->toBe(0);
});

it('reconnects Meta by replacing the encrypted workspace token', function () {
    $user = User::factory()->create();
    connectMeta($user->workspace, 'old-token', 'act_111');

    config()->set('meta.app_id', 'app');
    config()->set('meta.app_secret', 'secret');
    config()->set('services.meta.client_id', 'app');
    config()->set('services.meta.client_secret', 'secret');

    $metaUser = new MetaUser;
    $metaUser->setRaw(['id' => 'fb-1', 'name' => 'Sara'])->map(['id' => 'fb-1', 'name' => 'Sara']);
    $metaUser->setToken('short');
    $metaUser->setExpiresIn(3600);

    $provider = Mockery::mock();
    $provider->shouldReceive('usingGraphVersion')->once()->andReturnSelf();
    $provider->shouldReceive('user')->once()->andReturn($metaUser);
    Socialite::shouldReceive('driver')->once()->with('meta')->andReturn($provider);

    Http::fake([
        'graph.facebook.com/*/oauth/access_token*' => Http::response(['access_token' => 'new-long', 'expires_in' => 5000]),
        'graph.facebook.com/*/me/permissions*' => Http::response(['data' => [
            ['permission' => 'ads_management', 'status' => 'granted'],
        ]]),
        'graph.facebook.com/*/me/accounts*' => Http::response(['data' => []]),
        'graph.facebook.com/*/me/adaccounts*' => Http::response(['data' => [['id' => 'act_111', 'name' => 'Ads']]]),
        'graph.facebook.com/*' => Http::response([], 404),
    ]);

    $this->actingAs($user)->get('/auth/meta/callback')->assertRedirect();

    expect($user->workspace->integration('meta')->access_token)->toBe('new-long')
        ->and(Integration::query()->where('workspace_id', $user->workspace_id)->count())->toBe(1);
});

it('blocks ads sync after Meta is disconnected or the token expires', function () {
    $workspace = Workspace::factory()->create();
    $integration = connectMeta($workspace);

    $integration->forceFill(['expires_at' => now()->subMinute()])->save();
    expect(app(MetaAdsService::class)->sync($workspace)['ok'])->toBeFalse();

    $integration->forceFill(['expires_at' => now()->addDay(), 'status' => 'connected'])->save();
    $integration->delete();

    expect(app(MetaAdsService::class)->sync($workspace)['ok'])->toBeFalse();
});

it('ingests an official signed Meta leadgen webhook through the queue', function () {
    config()->set('meta.app_secret', 'meta-app-secret');
    $workspace = Workspace::factory()->create();
    connectMeta($workspace);
    $endpoint = app(WebhookEndpointManager::class)->forWorkspace($workspace, 'meta_leads');

    $payload = [
        'object' => 'page',
        'entry' => [[
            'id' => 'page-1',
            'time' => time(),
            'changes' => [[
                'field' => 'leadgen',
                'value' => [
                    'leadgen_id' => 'lead-official-1',
                    'form_id' => 'form-1',
                    'page_id' => 'page-1',
                    'ad_id' => 'ad-1',
                    'adgroup_id' => 'set-1',
                    'created_time' => time(),
                ],
            ]],
        ]],
    ];

    Http::fake([
        'graph.facebook.com/*/lead-official-1*' => Http::response([
            'id' => 'lead-official-1',
            'form_id' => 'form-1',
            'ad_id' => 'ad-1',
            'ad_name' => 'Clinic ad',
            'adset_id' => 'set-1',
            'adset_name' => 'Algiers',
            'campaign_id' => 'camp-1',
            'campaign_name' => 'Lead gen',
            'field_data' => [
                ['name' => 'full_name', 'values' => ['Yacine Meziane']],
                ['name' => 'email', 'values' => ['yacine@clinic.dz']],
                ['name' => 'phone_number', 'values' => ['0550111000']],
                ['name' => 'clinic_specialty', 'values' => ['Ortho']],
            ],
        ]),
    ]);

    $this->postJson("/webhooks/meta/leads/{$endpoint->key}", $payload, [
        'X-Hub-Signature-256' => metaSignature($payload),
    ])->assertOk();

    $adLead = AdLead::query()->where('workspace_id', $workspace->id)->first();

    expect(MetaWebhookEvent::query()->where('workspace_id', $workspace->id)->value('status'))->toBe('processed')
        ->and($adLead?->external_id)->toBe('lead-official-1')
        ->and($adLead?->attribution['campaign_id'])->toBe('camp-1')
        ->and($adLead?->attribution['ad_set_id'])->toBe('set-1')
        ->and($adLead?->attribution['ad_id'])->toBe('ad-1')
        ->and($adLead?->fields['clinic_specialty'])->toBe('Ortho')
        ->and(Lead::query()->where('workspace_id', $workspace->id)->value('source'))->toBe('meta_lead_form');
});

it('rejects an official Meta webhook with an invalid signature', function () {
    config()->set('meta.app_secret', 'meta-app-secret');
    $workspace = Workspace::factory()->create();
    $endpoint = app(WebhookEndpointManager::class)->forWorkspace($workspace, 'meta_leads');

    $payload = [
        'object' => 'page',
        'entry' => [['changes' => [['field' => 'leadgen', 'value' => ['leadgen_id' => 'x']]]]],
    ];

    $this->postJson("/webhooks/meta/leads/{$endpoint->key}", $payload, [
        'X-Hub-Signature-256' => 'sha256=deadbeef',
    ])->assertForbidden();

    expect(AdLead::query()->count())->toBe(0)
        ->and(MetaWebhookEvent::query()->count())->toBe(0);
});

it('is idempotent for duplicate Meta webhook deliveries', function () {
    $workspace = Workspace::factory()->create();
    $endpoint = app(WebhookEndpointManager::class)->forWorkspace($workspace, 'meta_leads');
    $body = [
        'leadgen_id' => 'lead-dup-1',
        'fields' => ['email' => 'dup@example.test', 'full_name' => 'Dup Lead'],
    ];

    $this->postJson("/webhooks/meta/leads/{$endpoint->key}", $body)->assertOk();
    $this->postJson("/webhooks/meta/leads/{$endpoint->key}", $body)->assertOk();

    expect(AdLead::query()->where('workspace_id', $workspace->id)->count())->toBe(1)
        ->and(Lead::query()->where('workspace_id', $workspace->id)->count())->toBe(1)
        ->and(MetaWebhookEvent::query()->where('workspace_id', $workspace->id)->count())->toBe(1);
});

it('matches a duplicate Meta lead onto the existing contact', function () {
    $workspace = Workspace::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'email' => 'same@clinic.dz',
        'phone' => '0550444333',
    ]);
    $lead = Lead::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'title' => 'Existing',
        'status' => 'new',
        'source' => 'manual',
    ]);

    $first = app(LeadFormIngestor::class)->ingest($workspace, [
        'leadgen_id' => 'lead-a',
        'fields' => [['name' => 'email', 'values' => ['same@clinic.dz']]],
    ]);
    $second = app(LeadFormIngestor::class)->ingest($workspace, [
        'leadgen_id' => 'lead-b',
        'fields' => [['name' => 'email', 'values' => ['same@clinic.dz']]],
    ]);

    expect($first->lead_id)->toBe($lead->id)
        ->and($second->lead_id)->toBe($lead->id)
        ->and(Lead::query()->where('workspace_id', $workspace->id)->count())->toBe(1);
});

it('applies tenant field mappings and keeps unknown custom fields', function () {
    $workspace = Workspace::factory()->create();
    MetaFieldMapping::query()->create([
        'workspace_id' => $workspace->id,
        'meta_field' => 'clinic_name',
        'crm_property' => 'company',
        'is_custom' => true,
    ]);

    $mapped = app(MetaFieldMapper::class)->map($workspace, [
        ['name' => 'clinic_name', 'values' => ['Aurassi']],
        ['name' => 'favorite_color', 'values' => ['green']],
        ['name' => 'email', 'values' => ['map@clinic.dz']],
    ]);

    expect($mapped['mapped']['company'])->toBe('Aurassi')
        ->and($mapped['mapped']['email'])->toBe('map@clinic.dz')
        ->and($mapped['custom']['favorite_color'])->toBe('green');
});

it('preserves campaign, ad set, and ad attribution on a Meta lead', function () {
    $workspace = Workspace::factory()->create();

    $adLead = app(LeadFormIngestor::class)->ingest($workspace, [
        'leadgen_id' => 'lead-attr-1',
        'campaign_id' => 'camp-9',
        'campaign_name' => 'Ramadan',
        'adset_id' => 'set-9',
        'adset_name' => 'Algiers 25-40',
        'ad_id' => 'ad-9',
        'ad_name' => 'Creative A',
        'form_id' => 'form-9',
        'page_id' => 'page-9',
        'fields' => ['email' => 'attr@example.test', 'full_name' => 'Attr Lead'],
    ]);

    expect($adLead->campaign?->external_id)->toBe('camp-9')
        ->and($adLead->adSet?->external_id)->toBe('set-9')
        ->and($adLead->adCreative?->external_id)->toBe('ad-9')
        ->and($adLead->attribution['source'])->toBe('facebook')
        ->and($adLead->lead?->ad_campaign_id)->toBe($adLead->ad_campaign_id)
        ->and($adLead->lead?->ad_set_id)->toBe($adLead->ad_set_id);
});

it('creates a lead without campaign attribution when Meta sends no ad context', function () {
    $workspace = Workspace::factory()->create();

    $adLead = app(LeadFormIngestor::class)->ingest($workspace, [
        'leadgen_id' => 'lead-no-attr',
        'fields' => ['email' => 'none@example.test', 'full_name' => 'No Attr'],
    ]);

    expect($adLead->ad_campaign_id)->toBeNull()
        ->and($adLead->attribution['campaign_id'])->toBeNull()
        ->and($adLead->lead?->source)->toBe('meta_lead_form');
});

it('syncs campaigns, ad sets, and ads without creating duplicates on a second run', function () {
    $workspace = Workspace::factory()->create();
    connectMeta($workspace, 'sync-token', 'act_555');

    $campaigns = [
        'graph.facebook.com/*/act_555/campaigns*after=*' => Http::response(['data' => []]),
        'graph.facebook.com/*/act_555/campaigns*' => Http::response([
            'data' => [['id' => 'c1', 'name' => 'Camp', 'objective' => 'LEAD_GENERATION', 'status' => 'ACTIVE', 'daily_budget' => '1500']],
            'paging' => ['next' => 'https://graph.facebook.com/v21.0/act_555/campaigns?after=1'],
        ]),
        'graph.facebook.com/*/act_555/adsets*' => Http::response(['data' => [
            ['id' => 's1', 'name' => 'Set', 'status' => 'ACTIVE', 'campaign_id' => 'c1', 'optimization_goal' => 'LEAD_GENERATION'],
        ]]),
        'graph.facebook.com/*/act_555/ads*' => Http::response(['data' => [
            ['id' => 'a1', 'name' => 'Ad', 'status' => 'ACTIVE', 'adset_id' => 's1', 'campaign_id' => 'c1', 'creative' => ['id' => 'cr1', 'name' => 'Hero']],
        ]]),
        'graph.facebook.com/*/c1/insights*' => Http::response(['data' => [
            ['date_start' => '2026-08-01', 'impressions' => '10', 'clicks' => '2', 'reach' => '8', 'spend' => '3.50'],
        ]]),
        'graph.facebook.com/*/act_555*' => Http::response([
            'id' => 'act_555',
            'name' => 'Ads',
            'currency' => 'DZD',
            'timezone_name' => 'Africa/Algiers',
            'account_status' => 1,
        ]),
    ];

    Http::fake($campaigns);
    expect(app(MetaAdsService::class)->sync($workspace)['ok'])->toBeTrue();

    Http::fake($campaigns);
    expect(app(MetaAdsService::class)->sync($workspace)['campaigns'])->toBe(1);

    expect(AdAccount::query()->where('workspace_id', $workspace->id)->count())->toBe(1)
        ->and(AdCampaign::query()->where('workspace_id', $workspace->id)->count())->toBe(1)
        ->and(AdSet::query()->where('workspace_id', $workspace->id)->count())->toBe(1)
        ->and(Ad::query()->where('workspace_id', $workspace->id)->count())->toBe(1)
        ->and(AdCampaign::query()->first()->daily_budget_cents)->toBe(1500);
});

it('marks the Meta connection expired when Graph returns a token error', function () {
    $workspace = Workspace::factory()->create();
    connectMeta($workspace, 'dead-token', 'act_666');

    Http::fake([
        'graph.facebook.com/*' => Http::response(['error' => ['code' => 190, 'message' => 'expired']], 401),
    ]);

    $result = app(MetaAdsService::class)->sync($workspace);

    expect($result['ok'])->toBeFalse()
        ->and($result['reason'])->toContain('expired')
        ->and($workspace->integration('meta')?->status)->toBe('expired');
});

it('sends hashed Lead and Purchase conversion events and skips duplicates', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    connectMeta($workspace);

    $contact = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'email' => 'Buyer@Clinic.DZ',
        'phone' => '0550123456',
    ]);
    $lead = Lead::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'title' => 'Meta buyer',
        'status' => 'new',
        'source' => 'meta_lead_form',
    ]);

    MetaConversionConfig::query()->create([
        'workspace_id' => $workspace->id,
        'crm_event' => MetaConversionConfig::CRM_LEAD_CREATED,
        'meta_event' => MetaConversionConfig::META_LEAD,
        'enabled' => true,
        'pixel_id' => 'pixel-1',
    ]);
    MetaConversionConfig::query()->create([
        'workspace_id' => $workspace->id,
        'crm_event' => MetaConversionConfig::CRM_DEAL_WON,
        'meta_event' => MetaConversionConfig::META_PURCHASE,
        'enabled' => true,
        'pixel_id' => 'pixel-1',
    ]);

    Http::fake(['graph.facebook.com/*/pixel-1/events*' => Http::response(['events_received' => 1])]);

    $leadEvent = app(MetaConversionsService::class)->queueForLead($lead, MetaConversionConfig::CRM_LEAD_CREATED);
    $again = app(MetaConversionsService::class)->queueForLead($lead, MetaConversionConfig::CRM_LEAD_CREATED);

    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'lead_id' => $lead->id,
        'pipeline_id' => $workspace->defaultPipeline()->id,
        'stage_id' => $workspace->defaultPipeline()->stageBySlug('won')->id,
        'title' => 'Won',
        'amount_cents' => 250000,
        'currency' => 'DZD',
    ]);
    app(MetaConversionsService::class)->queueForDeal($deal, MetaConversionConfig::CRM_DEAL_WON);

    expect($leadEvent?->status)->toBe(MetaConversionEvent::STATUS_SENT)
        ->and($again?->id)->toBe($leadEvent?->id)
        ->and(MetaConversionEvent::query()->where('workspace_id', $workspace->id)->count())->toBe(2);

    Http::assertSent(function ($request) {
        $data = $request['data'][0] ?? [];

        return str_contains($request->url(), '/pixel-1/events')
            && $data['event_name'] === 'Lead'
            && $data['user_data']['em'][0] === hash('sha256', 'buyer@clinic.dz')
            && ! str_contains(json_encode($request->data()) ?: '', 'Buyer@Clinic.DZ');
    });
});

it('retries a failed conversion and records the failure', function () {
    $workspace = Workspace::factory()->create();
    connectMeta($workspace);
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id, 'email' => 'fail@clinic.dz']);
    $lead = Lead::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'title' => 'Fail',
        'status' => 'new',
        'source' => 'meta_lead_form',
    ]);
    MetaConversionConfig::query()->create([
        'workspace_id' => $workspace->id,
        'crm_event' => MetaConversionConfig::CRM_LEAD_CREATED,
        'meta_event' => MetaConversionConfig::META_LEAD,
        'enabled' => true,
        'pixel_id' => 'pixel-2',
    ]);

    Http::fake(['graph.facebook.com/*' => Http::response(['error' => ['message' => 'down']], 500)]);

    $event = app(MetaConversionsService::class)->queueForLead($lead, MetaConversionConfig::CRM_LEAD_CREATED);

    expect($event?->status)->toBe(MetaConversionEvent::STATUS_FAILED)
        ->and($event?->attempts)->toBeGreaterThan(0);
});

it('refuses Meta settings mutations from another workspace and never exposes tokens', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    connectMeta($owner->workspace, 'secret-token', 'act_777');

    $this->actingAs($other)
        ->put('/settings/meta/ad-account', ['ad_account_id' => 'act_777'])
        ->assertSessionHasErrors('ad_account_id');

    $this->actingAs($owner)
        ->get('/settings/meta')
        ->assertOk()
        ->assertDontSee('secret-token')
        ->assertInertia(fn ($page) => $page
            ->component('settings/meta')
            ->missing('integration.access_token')
            ->where('connected', true));
});

it('verifies the Meta webhook challenge and queues processing instead of doing Graph work inline', function () {
    config()->set('meta.webhook_verify_token', 'verify-me');
    $workspace = Workspace::factory()->create();
    $endpoint = app(WebhookEndpointManager::class)->forWorkspace($workspace, 'meta_leads');

    $this->get("/webhooks/meta/leads/{$endpoint->key}?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=abc123")
        ->assertOk()
        ->assertSee('abc123');

    Queue::fake();

    $this->postJson("/webhooks/meta/leads/{$endpoint->key}", [
        'leadgen_id' => 'queued-1',
        'fields' => ['email' => 'q@example.test'],
    ])->assertOk();

    Queue::assertPushed(ProcessMetaWebhookEvent::class);
});
