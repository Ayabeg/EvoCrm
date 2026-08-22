<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Workspace;
use App\Services\Identity\WorkspaceProvisioner;

it('moves a deal through the default Evotechly pipeline', function () {
    $workspace = Workspace::factory()->create();
    app(WorkspaceProvisioner::class)->seedDefaults($workspace);
    $pipeline = $workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Pilot',
        'amount_cents' => 100000,
        'currency' => 'DZD',
    ]);

    foreach (['qualified', 'demo', 'proposal', 'won'] as $slug) {
        $deal->moveTo($pipeline->stageBySlug($slug));
        expect($deal->fresh()->stage->slug)->toBe($slug);
    }

    expect($deal->fresh()->closed_at)->not->toBeNull();
});

it('rejects a stage from another pipeline', function () {
    $workspace = Workspace::factory()->create();
    $other = Workspace::factory()->create();
    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $workspace->defaultPipeline()->id,
        'stage_id' => $workspace->defaultPipeline()->stageBySlug('new')->id,
        'title' => 'Pilot',
        'currency' => 'DZD',
    ]);

    expect(fn () => $deal->moveTo($other->defaultPipeline()->stageBySlug('qualified')))
        ->toThrow(InvalidArgumentException::class);
});
