<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Services\Crm\PipelineManager;

function listDeal(User $user, int $pipelineId, string $title): Deal
{
    $pipeline = $user->workspace->pipelines()->whereKey($pipelineId)->firstOrFail();

    return Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stages()->orderBy('position')->first()->id,
        'title' => $title,
        'amount_cents' => 100_000,
        'currency' => 'DZD',
    ]);
}

it('scopes the deals list and export to the selected pipeline', function () {
    $user = User::factory()->create();
    $default = $user->workspace->defaultPipeline();
    $second = app(PipelineManager::class)->create($user->workspace, 'Enterprise');

    listDeal($user, $default->id, 'Default deal');
    listDeal($user, $second->id, 'Enterprise deal');

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pipeline.id', $default->id)
            ->has('deals', 1)
            ->where('deals.0.title', 'Default deal')
            ->has('pipelines', 2)
        );

    $this->actingAs($user)
        ->get('/crm/deals?pipeline='.$second->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pipeline.id', $second->id)
            ->has('deals', 1)
            ->where('deals.0.title', 'Enterprise deal')
        );

    $csv = $this->actingAs($user)
        ->get('/crm/deals/export?pipeline='.$second->id)
        ->assertOk()
        ->streamedContent();

    expect($csv)->toContain('Enterprise deal')->not->toContain('Default deal');
});

it('creates a deal on the selected pipeline and ignores a foreign one', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $second = app(PipelineManager::class)->create($user->workspace, 'Enterprise');

    $this->actingAs($user)
        ->post('/crm/deals', [
            'title' => 'Enterprise intake',
            'pipeline_id' => $second->id,
            'contact_name' => 'Sara Founder',
        ])
        ->assertRedirect();

    expect(Deal::query()->where('title', 'Enterprise intake')->value('pipeline_id'))->toBe($second->id);

    $this->actingAs($user)
        ->get('/crm/deals?pipeline='.$other->workspace->defaultPipeline()->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('pipeline.id', $user->workspace->defaultPipeline()->id));
});
