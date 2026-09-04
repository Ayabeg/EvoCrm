<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\User;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Crm\LeadConverter;
use App\Services\Identity\WorkspaceProvisioner;

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
        ->and($login['groups']['workspace'])->toBe((string) $user->workspace_id);
});

it('records workspace created when a workspace is provisioned', function () {
    $analytics = app(ProductAnalytics::class);
    $analytics->flushRecorded();

    $workspace = app(WorkspaceProvisioner::class)->provision('Analytics Co');

    expect($analytics->eventNames())->toContain(ProductAnalytics::WORKSPACE_CREATED)
        ->and($analytics->last(ProductAnalytics::WORKSPACE_CREATED)['properties']['name'])->toBe('Analytics Co')
        ->and($analytics->last('$groupidentify')['groups']['workspace'])->toBe((string) $workspace->id);
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
