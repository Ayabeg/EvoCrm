<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\User;

function conversionLead(User $user, array $overrides = []): Lead
{
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Benali',
    ]);

    return Lead::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $contact->company_id,
        'title' => $overrides['title'] ?? 'Clinic intake',
        'source' => $overrides['source'] ?? 'meta_ads',
        'status' => $overrides['status'] ?? 'working',
    ]);
}

it('creates a linked deal when a lead is qualified', function () {
    $user = User::factory()->create();
    $lead = conversionLead($user);
    $pipeline = $user->workspace->defaultPipeline();
    $stage = $pipeline->stageBySlug('qualified');

    $this->actingAs($user)
        ->from("/crm/leads/{$lead->id}")
        ->post("/crm/leads/{$lead->id}/qualify", [
            'mode' => 'create',
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage->id,
            'owner_id' => $user->id,
            'amount_cents' => 1_800_000,
        ])
        ->assertRedirect();

    $lead->refresh();
    $deal = $lead->deal;

    expect($lead->status)->toBe('qualified')
        ->and($lead->qualified_at)->not->toBeNull()
        ->and($lead->payload['path_step'] ?? null)->toBe('converted')
        ->and($deal)->not->toBeNull()
        ->and($deal->lead_id)->toBe($lead->id)
        ->and($deal->contact_id)->toBe($lead->contact_id)
        ->and($deal->source)->toBe('meta_ads')
        ->and($deal->pipeline_id)->toBe($pipeline->id)
        ->and($deal->stage_id)->toBe($stage->id)
        ->and($deal->owner_id)->toBe($user->id)
        ->and($deal->amount_cents)->toBe(1_800_000)
        ->and(Activity::query()
            ->where('deal_id', $deal->id)
            ->where('type', 'lead_converted')
            ->exists())->toBeTrue();
});

it('links an existing contact deal instead of creating another', function () {
    $user = User::factory()->create();
    $lead = conversionLead($user);
    $pipeline = $user->workspace->defaultPipeline();
    $existing = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $lead->contact_id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Existing clinic deal',
        'amount_cents' => 900_000,
        'currency' => 'DZD',
        'source' => 'manual',
    ]);

    $this->actingAs($user)
        ->post("/crm/leads/{$lead->id}/qualify", [
            'mode' => 'link',
            'deal_id' => $existing->id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $pipeline->stageBySlug('qualified')->id,
            'owner_id' => $user->id,
            'amount_cents' => 1_200_000,
        ])
        ->assertRedirect();

    expect(Deal::query()->forWorkspace($user->workspace)->count())->toBe(1)
        ->and($existing->fresh()->lead_id)->toBe($lead->id)
        ->and($existing->fresh()->source)->toBe('meta_ads')
        ->and($lead->fresh()->deal?->id)->toBe($existing->id);
});

it('does not create a second deal when qualify is submitted twice', function () {
    $user = User::factory()->create();
    $lead = conversionLead($user);
    $pipeline = $user->workspace->defaultPipeline();
    $payload = [
        'mode' => 'create',
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'owner_id' => $user->id,
        'amount_cents' => 500_000,
    ];

    $this->actingAs($user)
        ->post("/crm/leads/{$lead->id}/qualify", $payload)
        ->assertRedirect();

    $this->actingAs($user)
        ->post("/crm/leads/{$lead->id}/qualify", $payload)
        ->assertRedirect();

    expect(Deal::query()->forWorkspace($user->workspace)->where('lead_id', $lead->id)->count())->toBe(1)
        ->and(Deal::query()->forWorkspace($user->workspace)->count())->toBe(1);
});

it('rejects linking a deal from another workspace', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $lead = conversionLead($user);
    $foreign = Deal::query()->create([
        'workspace_id' => $other->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $other->workspace_id])->id,
        'pipeline_id' => $other->workspace->defaultPipeline()->id,
        'stage_id' => $other->workspace->defaultPipeline()->stageBySlug('new')->id,
        'title' => 'Foreign deal',
        'amount_cents' => 100_000,
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->post("/crm/leads/{$lead->id}/qualify", [
            'mode' => 'link',
            'deal_id' => $foreign->id,
        ])
        ->assertNotFound();

    expect($lead->fresh()->deal)->toBeNull()
        ->and($foreign->fresh()->lead_id)->toBeNull();
});

it('exposes conversion fields on the lead record page', function () {
    $user = User::factory()->create();
    $lead = conversionLead($user);
    $pipeline = $user->workspace->defaultPipeline();
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $lead->contact_id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Open clinic deal',
        'amount_cents' => 250_000,
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get("/crm/leads/{$lead->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/show')
            ->has('pipelines')
            ->has('members')
            ->has('contactDeals', 1)
            ->has('path.steps', 5)
            ->where('path.current', 'contacted')
            ->where('pipelines.0.id', $pipeline->id)
        );
});
