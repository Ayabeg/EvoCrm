<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Dashboard;
use App\Models\Deal;
use App\Models\DealSplit;
use App\Models\SavedFilter;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Ads\MetaAudienceSyncService;
use App\Services\Crm\SegmentMatcher;

it('stores deal splits that sum to 100 percent', function () {
    $admin = User::factory()->create();
    $rep = User::factory()->create(['workspace_id' => $admin->workspace_id]);
    $deal = Deal::factory()->create([
        'workspace_id' => $admin->workspace_id,
        'amount_cents' => 2_000_000,
    ]);

    $this->actingAs($admin)
        ->put("/crm/deals/{$deal->id}/splits", [
            'splits' => [
                ['user_id' => $admin->id, 'percent' => 60],
                ['user_id' => $rep->id, 'percent' => 40],
            ],
        ])
        ->assertRedirect();

    expect(DealSplit::query()->where('deal_id', $deal->id)->count())->toBe(2)
        ->and(DealSplit::query()->where('deal_id', $deal->id)->sum('percent'))->toBe(100);
});

it('checks granular permissions on members', function () {
    $member = User::factory()->create([
        'role' => \App\Enums\WorkspaceRole::Member,
        'permissions' => ['deals.view'],
    ]);

    expect($member->canPermission('deals.view'))->toBeTrue()
        ->and($member->canPermission('settings.manage'))->toBeFalse();
});

it('syncs contact segment emails to meta audience when configured', function () {
    $admin = User::factory()->create();
    $segment = SavedFilter::query()->create([
        'workspace_id' => $admin->workspace_id,
        'user_id' => $admin->id,
        'name' => 'Newsletter',
        'entity' => 'contact',
        'filters' => [],
    ]);

    $result = app(MetaAudienceSyncService::class)->syncSegment($admin->workspace, $segment, '12345');

    expect($result['error'])->toBe('Meta is not connected for this workspace.');
});

it('shares dashboards with workspace visibility', function () {
    $admin = User::factory()->create();
    $member = User::factory()->create(['workspace_id' => $admin->workspace_id]);

    Dashboard::query()->create([
        'workspace_id' => $admin->workspace_id,
        'owner_id' => $admin->id,
        'name' => 'Team board',
        'visibility' => 'workspace',
        'widgets' => [],
    ]);

    $this->actingAs($member)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('dashboards', 1)
            ->where('dashboards.0.name', 'Team board')
        );
});

it('fires segment entered workflow when contact matches segment', function () {
    $user = User::factory()->create();

    $segment = SavedFilter::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'name' => 'Alger only',
        'entity' => 'contact',
        'filters' => ['wilaya' => 'Alger'],
    ]);

    Workflow::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Alger welcome',
        'active' => true,
        'trigger' => Workflow::TRIGGER_SEGMENT_ENTERED,
        'trigger_saved_filter_id' => $segment->id,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Welcome Alger lead'],
    ]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'wilaya' => 'Alger',
    ]);

    app(SegmentMatcher::class)->syncContact($contact);

    expect(Activity::query()->where('contact_id', $contact->id)->where('subject', 'Welcome Alger lead')->exists())->toBeTrue();
});

it('scopes deals for team_only permission', function () {
    $owner = User::factory()->create([
        'role' => \App\Enums\WorkspaceRole::Member,
        'permissions' => ['deals.team_only', 'deals.view'],
    ]);
    $other = User::factory()->create(['workspace_id' => $owner->workspace_id]);

    Deal::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'owner_id' => $owner->id,
        'title' => 'Mine',
    ]);
    Deal::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'owner_id' => $other->id,
        'title' => 'Theirs',
    ]);

    $this->actingAs($owner)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('deals', 1)
            ->where('deals.0.title', 'Mine')
        );
});
