<?php

use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdCampaignStat;
use App\Models\AdLead;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Thread;
use App\Models\User;
use App\Services\Ads\AdsFunnel;

function seedCampaignWithFunnel(User $user): AdCampaign
{
    $workspace = $user->workspace;

    $account = AdAccount::query()->create([
        'workspace_id' => $workspace->id,
        'external_id' => 'act_test',
        'name' => 'Test account',
        'status' => 'demo',
        'currency' => 'DZD',
    ]);

    $campaign = AdCampaign::query()->create([
        'workspace_id' => $workspace->id,
        'ad_account_id' => $account->id,
        'external_id' => 'camp_test',
        'name' => 'CTWA test campaign',
        'objective' => 'MESSAGES',
        'status' => 'active',
        'daily_budget_cents' => 100_000,
        'click_to_whatsapp' => true,
    ]);

    foreach ([3, 2, 1] as $daysAgo) {
        AdCampaignStat::query()->create([
            'workspace_id' => $workspace->id,
            'ad_campaign_id' => $campaign->id,
            'date' => now()->subDays($daysAgo)->toDateString(),
            'impressions' => 1000,
            'clicks' => 40,
            'spend_cents' => 136_000,
        ]);
    }

    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    $lead = Lead::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'ad_campaign_id' => $campaign->id,
        'title' => 'Meta lead',
        'status' => 'qualified',
        'source' => 'ctwa',
        'qualified_at' => now(),
    ]);

    AdLead::query()->create([
        'workspace_id' => $workspace->id,
        'ad_account_id' => $account->id,
        'ad_campaign_id' => $campaign->id,
        'contact_id' => $contact->id,
        'lead_id' => $lead->id,
    ]);

    Thread::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel_id' => $workspace->channels()->firstOrFail()->id,
        'ad_campaign_id' => $campaign->id,
        'status' => 'open',
        'last_message_at' => now(),
    ]);

    Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'lead_id' => $lead->id,
        'pipeline_id' => $workspace->defaultPipeline()->id,
        'stage_id' => $workspace->defaultPipeline()->stageBySlug('won')->id,
        'title' => 'Won deal',
        'amount_cents' => 1_000_000,
        'currency' => 'DZD',
    ]);

    return $campaign;
}

it('renders the Ads Hub funnel board with counts per campaign', function () {
    $user = User::factory()->create();
    $campaign = seedCampaignWithFunnel($user);

    $this->actingAs($user)
        ->get('/ads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ads/index')
            ->has('campaigns', 1)
            ->has('funnels.'.$campaign->id)
            ->where('funnels.'.$campaign->id.'.impressions', 3000)
            ->where('funnels.'.$campaign->id.'.clicks', 120)
            ->where('funnels.'.$campaign->id.'.conversations', 1)
            ->where('funnels.'.$campaign->id.'.form_leads', 1)
            ->where('funnels.'.$campaign->id.'.qualified', 1)
            ->where('funnels.'.$campaign->id.'.deals', 1)
            ->where('funnels.'.$campaign->id.'.won', 1)
            ->where('totals.won', 1)
        );
});

it('renders the campaign detail with funnel, daily stats, ad sets and leads', function () {
    $user = User::factory()->create();
    $campaign = seedCampaignWithFunnel($user);

    $this->actingAs($user)
        ->get("/ads/campaigns/{$campaign->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ads/show')
            ->where('campaign.id', $campaign->id)
            ->where('funnel.impressions', 3000)
            ->where('funnel.won', 1)
            ->has('daily', 3)
            ->has('leads', 1)
            ->has('threads', 1)
        );
});

it('keeps the funnel honest when a campaign has no stats yet', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    $account = AdAccount::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Empty account',
        'status' => 'demo',
    ]);

    $campaign = AdCampaign::query()->create([
        'workspace_id' => $workspace->id,
        'ad_account_id' => $account->id,
        'name' => 'Fresh campaign',
        'status' => 'draft',
    ]);

    $funnel = app(AdsFunnel::class)->forCampaign($campaign);

    expect($funnel)->toMatchArray([
        'impressions' => 0,
        'clicks' => 0,
        'conversations' => 0,
        'form_leads' => 0,
        'qualified' => 0,
        'deals' => 0,
        'won' => 0,
    ]);
});

it('refuses Meta sync when META_* env is not set', function () {
    config()->set('meta.access_token', null);
    config()->set('meta.ad_account_id', null);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/ads/sync')
        ->assertRedirect();

    expect(AdCampaign::query()->where('workspace_id', $user->workspace_id)->count())->toBe(0);
});
