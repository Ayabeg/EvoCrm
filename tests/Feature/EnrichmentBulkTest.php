<?php

use App\Enums\WorkspaceRole;
use App\Jobs\EnrichRecordJob;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

it('queues only workspace records for bulk enrichment', function () {
    Queue::fake();

    $user = User::factory()->create();
    $mine = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $other = Company::factory()->create();

    $this->actingAs($user)
        ->from('/crm/companies')
        ->post('/crm/enrichment/bulk', [
            'target_type' => 'company',
            'ids' => [$mine->id, $other->id],
        ])
        ->assertRedirect('/crm/companies')
        ->assertSessionHas('status', 'Queued enrichment for 1 record(s); 1 skipped.');

    Queue::assertPushed(EnrichRecordJob::class, function (EnrichRecordJob $job) use ($user, $mine): bool {
        return $job->workspaceId === $user->workspace_id
            && $job->targetType === 'company'
            && $job->targetId === $mine->id
            && $job->uniqueId() === "{$user->workspace_id}:company:{$mine->id}";
    });
});

it('requires the CRM bulk permission for bulk enrichment', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $company = Company::factory()->create(['workspace_id' => $member->workspace_id]);

    $this->actingAs($member)
        ->post('/crm/enrichment/bulk', [
            'target_type' => 'company',
            'ids' => [$company->id],
        ])
        ->assertForbidden();
});
