<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Sequence;
use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;

function seedBulkWorkspace(User $user): void
{
    app(WorkspaceProvisioner::class)->seedDefaults($user->workspace);
}

it('blocks members without bulk permission', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $contact = Contact::factory()->create(['workspace_id' => $member->workspace_id]);

    $this->actingAs($member)
        ->post('/crm/contacts/bulk', [
            'action' => 'assign_owner',
            'ids' => [$contact->id],
            'owner_id' => $member->id,
        ])
        ->assertForbidden();
});

it('assigns an owner only to workspace contacts', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);
    $mine = Contact::factory()->create(['workspace_id' => $owner->workspace_id]);
    $other = Contact::factory()->create();

    $this->actingAs($owner)
        ->post('/crm/contacts/bulk', [
            'action' => 'assign_owner',
            'ids' => [$mine->id, $other->id],
            'owner_id' => $member->id,
        ])
        ->assertRedirect();

    expect($mine->fresh()->owner_id)->toBe($member->id)
        ->and($other->fresh()->owner_id)->not->toBe($member->id);
});

it('enrolls selected contacts into a workspace sequence', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $contact = Contact::factory()->withVerifiedEmail()->create(['workspace_id' => $owner->workspace_id]);
    $sequence = Sequence::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'name' => 'Welcome',
        'channel' => 'email',
        'active' => true,
    ]);

    $this->actingAs($owner)
        ->post('/crm/contacts/bulk', [
            'action' => 'enroll_sequence',
            'ids' => [$contact->id],
            'sequence_id' => $sequence->id,
        ])
        ->assertRedirect();

    expect(Enrollment::query()
        ->where('contact_id', $contact->id)
        ->where('sequence_id', $sequence->id)
        ->exists())->toBeTrue();
});

it('moves selected deals to a valid pipeline stage', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    seedBulkWorkspace($owner);
    $pipeline = $owner->workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $owner->workspace_id]);
    $deal = Deal::query()->create([
        'workspace_id' => $owner->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Move me',
        'amount_cents' => 1000,
        'currency' => 'DZD',
    ]);
    $qualified = $pipeline->stageBySlug('qualified');

    $this->actingAs($owner)
        ->post('/crm/deals/bulk', [
            'action' => 'move_stage',
            'ids' => [$deal->id],
            'stage_id' => $qualified->id,
        ])
        ->assertRedirect();

    expect($deal->fresh()->stage_id)->toBe($qualified->id);
});

it('safely deletes only workspace-scoped records', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $mine = Contact::factory()->create(['workspace_id' => $owner->workspace_id]);
    $other = Contact::factory()->create();

    $this->actingAs($owner)
        ->post('/crm/contacts/bulk', [
            'action' => 'delete',
            'ids' => [$mine->id, $other->id],
        ])
        ->assertRedirect();

    expect(Contact::query()->find($mine->id))->toBeNull()
        ->and(Contact::query()->find($other->id))->not->toBeNull();
});
