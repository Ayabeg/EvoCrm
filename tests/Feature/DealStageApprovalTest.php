<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\DealStageApproval;
use App\Models\User;
use Illuminate\Validation\ValidationException;

function approvalDeal(User $user): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Approval deal',
        'amount_cents' => 1_000_000,
        'currency' => 'DZD',
    ]);
}

it('creates a pending approval instead of entering a protected stage', function () {
    $user = User::factory()->create();
    $deal = approvalDeal($user);
    $target = $user->workspace->defaultPipeline()->stageBySlug('proposal');
    $target->forceFill(['requires_approval' => true])->save();

    expect(fn () => $deal->moveTo($target, $user))->toThrow(ValidationException::class);

    $approval = DealStageApproval::query()->where('deal_id', $deal->id)->latest('id')->first();

    expect($approval)->not->toBeNull()
        ->and($approval->status)->toBe(DealStageApproval::STATUS_PENDING)
        ->and($approval->stage_id)->toBe($target->id)
        ->and($approval->requested_by)->toBe($user->id)
        ->and($deal->fresh()->stage_id)->not->toBe($target->id);
});

it('lets an admin approve and consume a protected stage transition', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Admin,
    ]);
    $deal = approvalDeal($owner);
    $target = $owner->workspace->defaultPipeline()->stageBySlug('proposal');
    $target->forceFill(['requires_approval' => true])->save();

    expect(fn () => $deal->moveTo($target, $owner))->toThrow(ValidationException::class);
    $approval = DealStageApproval::query()->where('deal_id', $deal->id)->latest('id')->firstOrFail();

    $this->actingAs($admin)
        ->post("/crm/deals/{$deal->id}/stage-approvals/{$approval->id}/approve")
        ->assertRedirect();

    $deal->fresh()->moveTo($target, $owner);

    expect($deal->fresh()->stage_id)->toBe($target->id)
        ->and($approval->fresh()->status)->toBe(DealStageApproval::STATUS_APPROVED)
        ->and($approval->fresh()->consumed_at)->not->toBeNull();
});

it('restricts stage approval decisions to workspace administrators', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);
    $deal = approvalDeal($owner);
    $target = $owner->workspace->defaultPipeline()->stageBySlug('proposal');
    $target->forceFill(['requires_approval' => true])->save();

    expect(fn () => $deal->moveTo($target, $owner))->toThrow(ValidationException::class);
    $approval = DealStageApproval::query()->where('deal_id', $deal->id)->latest('id')->firstOrFail();

    $this->actingAs($member)
        ->post("/crm/deals/{$deal->id}/stage-approvals/{$approval->id}/approve")
        ->assertForbidden();

    expect($approval->fresh()->status)->toBe(DealStageApproval::STATUS_PENDING);
});
