<?php

use App\Enums\ChannelType;
use App\Models\Activity;
use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdCampaignStat;
use App\Models\AdLead;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Message;
use App\Models\OutboundMessage;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Testing\TestResponse;

function reportDeal(User $user, string $stageSlug, array $attributes = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    return Deal::query()->create(array_merge([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => 'Report deal '.$stageSlug,
        'amount_cents' => 100_000,
        'currency' => 'DZD',
    ], $attributes));
}

function reportLead(User $user, array $attributes = []): Lead
{
    $workspace = $user->workspace;

    return Lead::factory()->create(array_merge([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
    ], $attributes));
}

/** @return array<string, mixed> */
function reportProps(TestResponse $response): array
{
    return $response->viewData('page')['props'];
}

/** @return array<string, mixed>|null */
function reportCategory(TestResponse $response, string $key): ?array
{
    return collect(reportProps($response)['categories'])->firstWhere('key', $key);
}

it('serves an empty category list when no rows exist', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/reports')
            ->has('categories', 0)
            ->where('window.days', 30)
            ->where('window.timezone', 'Africa/Algiers')
            ->where('window.custom', false)
        );
});

it('keeps /crm/reports as an alias of the analytics room', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/crm/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/reports'));
});

it('builds the pipeline category from real deals and stage flags', function () {
    $user = User::factory()->create();

    reportDeal($user, 'new');
    reportDeal($user, 'new', ['amount_cents' => 300_000]);
    reportDeal($user, 'qualified');
    reportDeal($user, 'won', ['closed_at' => now()]);
    reportDeal($user, 'lost', ['closed_at' => now()]);
    reportDeal($user, 'won', ['closed_at' => now()->subDays(45)]); // outside the window

    $response = $this->actingAs($user)->get('/reports');
    $response->assertOk();

    $pipeline = reportCategory($response, 'pipeline');

    expect(collect($pipeline['kpis'])->pluck('value', 'label')->all())
        ->toMatchArray([
            'Open deals' => 3,
            'Open pipeline' => 500_000,
            'Won in window' => 1,
            'Lost in window' => 1,
            'Win rate' => 50,
        ]);

    $charts = collect($pipeline['charts']);

    $bar = $charts->firstWhere('id', 'evoviz.bar');
    expect($bar['title'])->toBe('Open pipeline value by stage')
        ->and($bar['labels'])->toBe(['New', 'Qualified', 'Demo', 'Proposal'])
        ->and($bar['series'][0]['data'])->toBe([4_000, 1_000, 0, 0]) // DZD, not cents
        ->and($bar['total'])->toBe(5_000);

    $area = $charts->firstWhere('id', 'evoviz.area');
    expect($area['labels'])->toHaveCount(30)
        ->and($area['series'][0]['data'])->toHaveCount(30)
        ->and($area['series'][0]['data'][29])->toBe(1)
        ->and($area['total'])->toBe(1);

    $donut = $charts->firstWhere('id', 'evoviz.donut');
    expect($donut['labels'])->toBe(['Won', 'Lost'])
        ->and($donut['series'][0]['data'])->toBe([1, 1])
        ->and($donut['total'])->toBe(2);

    expect($pipeline['table']['rows'])->toHaveCount(6)
        ->and($pipeline['table']['rows'][0])->toBe(['New', 2, 400_000, null, null])
        ->and($pipeline['table']['rows'][4])->toBe(['Won', null, null, 1, 100_000])
        ->and($pipeline['table']['rows'][5])->toBe(['Lost', null, null, 1, 100_000]);
});

it('scopes every category to the current workspace', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    reportDeal($other, 'new');
    reportLead($other);
    OutboundMessage::query()->create([
        'workspace_id' => $other->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $other->workspace_id])->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'other@example.dz',
        'status' => 'sent',
        'sent_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('categories', 0));
});

it('buckets leads per day and honors the from/to window', function () {
    $user = User::factory()->create();

    $today = reportLead($user);
    $tenDaysAgo = reportLead($user);
    $tenDaysAgo->forceFill(['created_at' => now()->subDays(10)])->save();
    $fortyDaysAgo = reportLead($user);
    $fortyDaysAgo->forceFill(['created_at' => now()->subDays(40)])->save();
    $today->qualify();
    reportDeal($user, 'new', ['lead_id' => $today->id]);

    $response = $this->actingAs($user)->get('/reports');
    $leads = reportCategory($response, 'leads');

    expect(collect($leads['kpis'])->pluck('value', 'label')->all())
        ->toMatchArray([
            'New leads' => 2,
            'Qualified' => 1,
            'Qualification rate' => 50,
            'Converted to deal' => 1,
        ]);

    $area = collect($leads['charts'])->firstWhere('id', 'evoviz.area');
    expect($area['series'][0]['data'])->toHaveCount(30)
        ->and($area['series'][0]['data'][19])->toBe(1)
        ->and($area['series'][0]['data'][29])->toBe(1)
        ->and($area['total'])->toBe(2);

    $sources = collect($leads['charts'])->firstWhere('id', 'evoviz.ranked-bars');
    expect($sources['labels'])->toBe(['manual'])
        ->and($sources['series'][0]['data'])->toBe([2]);

    expect($leads['table']['rows'])->toBe([['manual', 2, 1, 50]]);

    // Widening the window to 40 days ago picks the old lead up.
    $wide = $this->actingAs($user)->get('/reports?'.http_build_query([
        'from' => now()->subDays(40)->toDateString(),
        'to' => now()->toDateString(),
    ]));
    $wide->assertInertia(fn ($page) => $page
        ->where('window.days', 41)
        ->where('window.custom', true)
    );
    $wideLeads = reportCategory($wide, 'leads');
    expect(collect($wideLeads['kpis'])->firstWhere('label', 'New leads')['value'])->toBe(3);
});

it('builds outbound from sent messages only — deferred and failed stay out of sent', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'opened@example.dz',
        'status' => 'sent',
        'sent_at' => now(),
        'opened_at' => now(),
    ]);
    $yesterday = OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'replied@example.dz',
        'status' => 'sent',
        'sent_at' => now(),
        'replied_at' => now(),
    ]);
    $yesterday->forceFill(['sent_at' => now()->subDay()])->save();
    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'held@example.dz',
        'status' => 'queued',
        'deferred_until' => now()->addHours(2),
    ]);
    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'bounced@example.dz',
        'status' => 'failed',
        'failure_reason' => 'SMTP 550 bounce',
    ]);

    $response = $this->actingAs($user)->get('/reports');
    $outbound = reportCategory($response, 'outbound');

    expect(collect($outbound['kpis'])->pluck('value', 'label')->all())
        ->toMatchArray([
            'Sent' => 2,
            'Opened' => 1,
            'Clicked' => 0,
            'Replied' => 1,
            'Open rate' => 50,
            'Failed' => 1,
        ]);

    $charts = collect($outbound['charts']);

    $area = $charts->firstWhere('id', 'evoviz.area');
    expect($area['series'][0]['data'][28])->toBe(1)
        ->and($area['series'][0]['data'][29])->toBe(1)
        ->and($area['total'])->toBe(2);

    $funnel = $charts->firstWhere('id', 'evoviz.bar');
    expect($funnel['labels'])->toBe(['Sent', 'Opened', 'Clicked', 'Replied'])
        ->and($funnel['series'][0]['data'])->toBe([2, 1, 0, 1]);

    expect($outbound['table']['rows'])->toHaveCount(2)
        ->and($outbound['table']['rows'][0][1])->toBe(1); // today first
});

it('omits ads and desk categories until real rows exist', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    reportDeal($user, 'new');

    $keys = collect(reportProps($this->actingAs($user)->get('/reports'))['categories'])->pluck('key')->all();
    expect($keys)->toBe(['pipeline']);

    $account = AdAccount::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Meta account',
        'status' => 'connected',
        'currency' => 'DZD',
    ]);
    $campaign = AdCampaign::query()->create([
        'workspace_id' => $workspace->id,
        'ad_account_id' => $account->id,
        'name' => 'CTWA summer',
        'status' => 'active',
    ]);
    AdCampaignStat::query()->create([
        'workspace_id' => $workspace->id,
        'ad_campaign_id' => $campaign->id,
        'date' => now()->toDateString(),
        'impressions' => 1_000,
        'clicks' => 50,
        'spend_cents' => 250_000,
    ]);
    AdLead::query()->create([
        'workspace_id' => $workspace->id,
        'ad_account_id' => $account->id,
        'ad_campaign_id' => $campaign->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
    ]);

    $response = $this->actingAs($user)->get('/reports');
    $ads = reportCategory($response, 'ads');

    expect($ads)->not->toBeNull();
    expect(collect($ads['kpis'])->pluck('value', 'label')->all())
        ->toMatchArray([
            'Spend' => 250_000,
            'Impressions' => 1_000,
            'Clicks' => 50,
            'CTR' => 5.0,
            'Ad leads' => 1,
            'Cost per lead' => 250_000,
        ]);
    expect($ads['table']['rows'])->toBe([['CTWA summer', 1_000, 50, 250_000, 1, 250_000]]);

    $spend = collect($ads['charts'])->firstWhere('id', 'evoviz.area');
    expect($spend['series'][0]['data'][29])->toBe(2_500) // DZD per day
        ->and($spend['total'])->toBe(2_500);

    // Desk still hidden — no threads or messages yet.
    expect(reportCategory($response, 'desk'))->toBeNull();

    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);
    $thread = Thread::factory()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel_id' => $workspace->channels()->where('type', ChannelType::WhatsAppCloud)->first()->id,
        'unread_count' => 3,
    ]);
    Message::factory()->create([
        'workspace_id' => $workspace->id,
        'thread_id' => $thread->id,
        'contact_id' => $contact->id,
        'direction' => 'inbound',
    ]);

    $desk = reportCategory($this->actingAs($user)->get('/reports'), 'desk');

    expect(collect($desk['kpis'])->pluck('value', 'label')->all())
        ->toMatchArray([
            'Open threads' => 1,
            'Unread messages' => 3,
            'Messages in window' => 1,
            'Inbound' => 1,
            'Outbound' => 0,
        ]);
    expect($desk['table']['rows'])->toBe([['WhatsApp Cloud', 1, 3, 1]]);
});

it('builds the activity category from real tasks and notes', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'task',
        'subject' => 'Done task',
        'done' => true,
        'completed_at' => now(),
        'owner_id' => $user->id,
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'task',
        'subject' => 'Overdue task',
        'done' => false,
        'due_at' => now()->subDay(),
        'owner_id' => $user->id,
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'note',
        'subject' => 'A note',
        'owner_id' => $user->id,
    ]);

    $response = $this->actingAs($user)->get('/reports');
    $activity = reportCategory($response, 'activity');

    expect(collect($activity['kpis'])->pluck('value', 'label')->all())
        ->toMatchArray([
            'Completed in window' => 1,
            'Open tasks' => 1,
            'Overdue' => 1,
            'Logged in window' => 3,
        ]);

    $byType = collect($activity['charts'])->firstWhere('id', 'evoviz.bar');
    expect($byType['labels'])->toBe(['Task', 'Note'])
        ->and($byType['series'][0]['data'])->toBe([2, 1]);

    expect($activity['table']['rows'])->toBe([[$user->name, 1, 1, 1]]);
});

it('keys every chart with an evoviz id and never ships an empty series', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    reportDeal($user, 'new');
    reportDeal($user, 'won', ['closed_at' => now()]);
    reportLead($user, ['contact_id' => $contact->id]);
    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'sent@example.dz',
        'status' => 'sent',
        'sent_at' => now(),
    ]);
    $thread = Thread::factory()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel_id' => $workspace->channels()->where('type', ChannelType::WhatsAppCloud)->first()->id,
    ]);
    Message::factory()->create([
        'workspace_id' => $workspace->id,
        'thread_id' => $thread->id,
        'contact_id' => $contact->id,
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'call',
        'subject' => 'Discovery call',
        'done' => true,
        'completed_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/reports');
    $response->assertOk();

    $categories = reportProps($response)['categories'];
    $keys = collect($categories)->pluck('key')->all();

    expect($keys)->toBe(['pipeline', 'leads', 'outbound', 'desk', 'activity']);

    foreach ($categories as $category) {
        expect($category['kpis'])->not->toBeEmpty();
        expect($category['charts'])->not->toBeEmpty();
        expect($category['table']['rows'])->not->toBeEmpty();

        foreach ($category['charts'] as $chart) {
            expect($chart['id'])->toStartWith('evoviz.');
            foreach ($chart['series'] as $series) {
                expect($series['data'])->toHaveCount(count($chart['labels']));
                expect(collect($series['data'])->contains(fn ($v) => $v != 0))->toBeTrue();
            }
        }
    }

    // Chart drill-downs stay on the CRM hostname.
    expect(json_encode(collect($categories)->flatMap(fn ($c) => $c['charts'])->all()))
        ->not->toContain('http://')
        ->not->toContain('https://');
});
