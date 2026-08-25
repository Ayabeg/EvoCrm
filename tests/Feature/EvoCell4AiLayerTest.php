<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Services\Ai\RecordInsight;

it('returns pipeline forecast band with low and high range', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    Deal::factory()->create([
        'workspace_id' => $workspace->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'amount_cents' => 10_000_000,
        'currency' => 'DZD',
    ]);

    $band = app(RecordInsight::class)->pipelineForecastBand($workspace, $pipeline);

    expect($band['low_cents'])->toBeLessThan($band['high_cents'])
        ->and($band['band_label'])->toBeString();
});

it('uses keyword-ranked activities for ask evo retrieval', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'type' => 'note',
        'subject' => 'Pricing discussion with procurement',
        'body' => 'They asked about enterprise tier.',
    ]);

    $result = app(RecordInsight::class)->ask($contact, 'What was said about pricing?');

    expect($result['answer'])->toContain('record');
});
