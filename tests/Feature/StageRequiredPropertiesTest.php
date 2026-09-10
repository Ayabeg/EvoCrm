<?php

use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\Deal;
use App\Models\User;
use App\Services\Crm\StagePropertyGate;
use Illuminate\Validation\ValidationException;

it('lets an admin require deal fields on a stage', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $proposal = $pipeline->stageBySlug('proposal');

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'deal',
            'key' => 'clinic_beds',
            'label' => 'Clinic beds',
            'type' => 'number',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->get('/settings/pipelines')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/pipelines')
            ->has('dealProperties')
            ->where('dealProperties.0.key', 'amount')
        );

    $this->actingAs($user)
        ->patch("/settings/pipelines/{$pipeline->id}/stages/{$proposal->id}", [
            'required_properties_present' => '1',
            'required_properties' => ['close_date', 'attr.clinic_beds'],
        ])
        ->assertRedirect();

    expect($proposal->fresh()->requiredPropertyKeys())->toBe(['close_date', 'attr.clinic_beds']);
});

it('blocks a stage move until required native and custom fields are filled', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $proposal = $pipeline->stageBySlug('proposal');
    $proposal->forceFill(['required_properties' => ['amount', 'close_date', 'attr.clinic_beds']])->save();

    CustomAttributeDefinition::query()->create([
        'workspace_id' => $user->workspace_id,
        'entity' => 'deal',
        'key' => 'clinic_beds',
        'label' => 'Clinic beds',
        'type' => 'number',
    ]);

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinic pilot',
        'amount_cents' => 0,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->from("/crm/deals/{$deal->id}")
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $proposal->id])
        ->assertRedirect("/crm/deals/{$deal->id}")
        ->assertSessionHasErrors('stage_id');

    expect($deal->fresh()->stage_id)->toBe($pipeline->stageBySlug('new')->id);

    $deal->forceFill([
        'amount_cents' => 2_500_000,
        'close_date' => '2026-10-01',
    ])->save();

    $this->actingAs($user)
        ->from("/crm/deals/{$deal->id}")
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $proposal->id])
        ->assertRedirect("/crm/deals/{$deal->id}")
        ->assertSessionHasErrors('stage_id');

    CustomAttributeValue::query()->create([
        'workspace_id' => $user->workspace_id,
        'definition_id' => CustomAttributeDefinition::query()->where('key', 'clinic_beds')->value('id'),
        'entity_type' => 'deal',
        'entity_id' => $deal->id,
        'value' => '12',
    ]);

    $this->actingAs($user)
        ->from("/crm/deals/{$deal->id}")
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $proposal->id])
        ->assertRedirect("/crm/deals/{$deal->id}")
        ->assertSessionDoesntHaveErrors();

    expect($deal->fresh()->stage->slug)->toBe('proposal');
});

it('blocks creating a deal directly into a gated stage', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $demo = $pipeline->stageBySlug('demo');
    $demo->forceFill(['required_properties' => ['close_date']])->save();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->from('/crm/deals')
        ->post('/crm/deals', [
            'contact_id' => $contact->id,
            'title' => 'No close date',
            'stage_id' => $demo->id,
            'amount_dzd' => 10000,
        ])
        ->assertRedirect('/crm/deals')
        ->assertSessionHasErrors('stage_id');

    expect(Deal::query()->where('title', 'No close date')->exists())->toBeFalse();

    $this->actingAs($user)
        ->post('/crm/deals', [
            'contact_id' => $contact->id,
            'title' => 'Dated demo',
            'stage_id' => $demo->id,
            'amount_dzd' => 10000,
            'close_date' => '2026-11-01',
        ])
        ->assertRedirect('/crm/deals');

    expect(Deal::query()->where('title', 'Dated demo')->where('stage_id', $demo->id)->exists())->toBeTrue();
});

it('still allows an ungated move through the default pipeline', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Open move',
        'amount_cents' => 0,
        'currency' => 'DZD',
    ]);

    $deal->moveTo($pipeline->stageBySlug('qualified'));

    expect($deal->fresh()->stage->slug)->toBe('qualified');

    expect(fn () => app(StagePropertyGate::class)->assertCanEnter($deal->fresh(), $pipeline->stageBySlug('qualified')))
        ->not->toThrow(ValidationException::class);
});
