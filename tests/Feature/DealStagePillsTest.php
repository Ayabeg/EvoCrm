<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('exposes colored stage pills with counts above the deals board', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    foreach (['new', 'new', 'qualified', 'won'] as $slug) {
        Deal::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $pipeline->stageBySlug($slug)->id,
            'title' => 'Pill '.$slug,
            'currency' => 'DZD',
        ]);
    }

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/hub')
            ->has('stagePills', 6)
            ->where('stagePills.0.name', 'New')
            ->where('stagePills.0.slug', 'new')
            ->where('stagePills.0.count', 2)
            ->where('stagePills.1.name', 'Qualified')
            ->where('stagePills.1.count', 1)
            ->where('stagePills.4.name', 'Won')
            ->where('stagePills.4.count', 1)
            ->where('stagePills.5.name', 'Lost')
            ->where('stagePills.5.count', 0)
        );
});
