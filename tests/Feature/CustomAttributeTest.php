<?php

use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\Deal;
use App\Models\User;

it('defines a custom attribute and saves a contact value', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'contact',
            'key' => 'beds',
            'label' => 'Beds',
            'type' => 'number',
            'group' => 'About',
            'required' => '0',
        ])
        ->assertRedirect();

    $definition = CustomAttributeDefinition::query()->where('key', 'beds')->first();
    expect($definition)->not->toBeNull()
        ->and($definition->type)->toBe('number')
        ->and($definition->group_name)->toBe('About')
        ->and($definition->required)->toBeFalse();

    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->put("/crm/contacts/{$contact->id}", [
            'first_name' => $contact->first_name,
            'last_name' => $contact->last_name,
            'attributes' => ['beds' => '80'],
        ])
        ->assertRedirect();

    expect(CustomAttributeValue::query()
        ->where('definition_id', $definition->id)
        ->where('entity_id', $contact->id)
        ->value('value'))->toBe('80');
});

it('creates a typed contact property and shows the saved value on the record', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'contact',
            'key' => 'opened_on',
            'label' => 'Opened on',
            'type' => 'date',
            'group' => 'About',
            'required' => '1',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'contact',
            'key' => 'sector',
            'label' => 'Sector',
            'type' => 'select',
            'group' => 'About',
            'options' => 'santé, retail',
        ])
        ->assertRedirect();

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Clinic',
    ]);

    $this->actingAs($user)
        ->put("/crm/contacts/{$contact->id}/attributes", [
            'attributes' => [
                'opened_on' => '2026-03-15',
                'sector' => 'santé',
            ],
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/hub')
            ->where('attributes.values.opened_on', '2026-03-15')
            ->where('attributes.values.sector', 'santé')
            ->has('attributes.definitions', 2)
            ->where('attributes.definitions.0.group', 'About')
            ->where('attributes.definitions.0.required', true)
            ->where('attributes.definitions.0.type', 'date')
            ->where('attributes.definitions.1.type', 'select')
            ->where('attributes.definitions.1.options', ['santé', 'retail'])
        );
});

it('creates a deal property and shows the value on the deal record', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinic expansion',
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'deal',
            'key' => 'competitor',
            'label' => 'Competitor',
            'type' => 'text',
            'group' => 'Deal details',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->put("/crm/deals/{$deal->id}/attributes", [
            'attributes' => ['competitor' => 'Kommo'],
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/hub')
            ->where('attributes.values.competitor', 'Kommo')
            ->has('attributes.definitions', 1)
            ->where('attributes.definitions.0.label', 'Competitor')
            ->where('attributes.definitions.0.group', 'Deal details')
        );
});

it('reports fill rate on the attributes settings page', function () {
    $user = User::factory()->create();
    Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $filled = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'contact',
            'key' => 'beds',
            'label' => 'Beds',
            'type' => 'number',
            'group' => 'About',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->put("/crm/contacts/{$filled->id}/attributes", [
            'attributes' => ['beds' => '40'],
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->get('/settings/attributes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/attributes')
            ->has('definitions', 1)
            ->where('definitions.0.key', 'beds')
            ->where('definitions.0.group', 'About')
            ->where('definitions.0.type', 'number')
            ->where('definitions.0.fill_rate.filled', 1)
            ->where('definitions.0.fill_rate.total', 2)
            ->where('definitions.0.fill_rate.percent', 50)
        );
});

it('rejects an empty required property on the record', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'contact',
            'key' => 'opened_on',
            'label' => 'Opened on',
            'type' => 'date',
            'required' => '1',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->from("/crm/contacts/{$contact->id}")
        ->put("/crm/contacts/{$contact->id}/attributes", [
            'attributes' => ['opened_on' => ''],
        ])
        ->assertRedirect("/crm/contacts/{$contact->id}")
        ->assertSessionHasErrors('attributes.opened_on');
});
