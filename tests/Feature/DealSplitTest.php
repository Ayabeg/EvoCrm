<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\DealSplit;
use App\Models\User;

function splitDeal(User $user): Deal
{
    $pipeline = $user->workspace->defaultPipeline();

    return Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Split deal',
        'amount_cents' => 1_000_000,
        'currency' => 'DZD',
    ]);
}

it('rejects split totals that are not 100 percent', function () {
    $admin = User::factory()->create();
    $rep = User::factory()->create(['workspace_id' => $admin->workspace_id]);
    $deal = splitDeal($admin);

    $this->actingAs($admin)
        ->put("/crm/deals/{$deal->id}/splits", [
            'splits' => [
                ['user_id' => $admin->id, 'percent' => 60],
                ['user_id' => $rep->id, 'percent' => 30],
            ],
        ])
        ->assertStatus(422);

    expect(DealSplit::query()->where('deal_id', $deal->id)->count())->toBe(0);
});

it('rejects a teammate from another workspace', function () {
    $admin = User::factory()->create();
    $foreign = User::factory()->create();
    $deal = splitDeal($admin);

    $this->actingAs($admin)
        ->put("/crm/deals/{$deal->id}/splits", [
            'splits' => [
                ['user_id' => $admin->id, 'percent' => 50],
                ['user_id' => $foreign->id, 'percent' => 50],
            ],
        ])
        ->assertNotFound();
});

it('forbids members from editing splits', function () {
    $member = User::factory()->create(['role' => WorkspaceRole::Member]);
    $deal = splitDeal($member);

    $this->actingAs($member)
        ->put("/crm/deals/{$deal->id}/splits", [
            'splits' => [
                ['user_id' => $member->id, 'percent' => 100],
            ],
        ])
        ->assertForbidden();
});

it('shows current splits on the deal record', function () {
    $admin = User::factory()->create();
    $rep = User::factory()->create(['workspace_id' => $admin->workspace_id]);
    $deal = splitDeal($admin);

    DealSplit::query()->create([
        'deal_id' => $deal->id,
        'user_id' => $admin->id,
        'percent' => 70,
        'amount_cents' => 700_000,
    ]);
    DealSplit::query()->create([
        'deal_id' => $deal->id,
        'user_id' => $rep->id,
        'percent' => 30,
        'amount_cents' => 300_000,
    ]);

    $this->actingAs($admin)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('splits', 2)
            ->where('canManageSplits', true)
        );
});
