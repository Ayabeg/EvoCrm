<?php

use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\Deal;
use App\Models\User;

it('exposes calculated attributes as list columns and renders their values', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
    ]);
    $definition = CustomAttributeDefinition::query()->create([
        'workspace_id' => $user->workspace_id,
        'entity' => 'contact',
        'key' => 'score',
        'label' => 'Lead score',
        'type' => 'calculated',
        'formula' => ['expression' => '10+5'],
    ]);
    CustomAttributeValue::query()->create([
        'workspace_id' => $user->workspace_id,
        'definition_id' => $definition->id,
        'entity_type' => 'contact',
        'entity_id' => $contact->id,
        'value' => null,
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->contains(fn ($def) => ($def['id'] ?? '') === 'custom:score'))
            ->where('contacts', fn ($rows) => collect($rows)->contains(fn ($row) => (int) ($row['id'] ?? 0) === $contact->id
                && ($row['attributes']['score'] ?? null) === '15')));
});

it('filters contacts by associated deal stage and open deals', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $proposal = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Proposal',
    ]);
    $won = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Won',
    ]);
    $none = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'None',
    ]);

    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $proposal->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => 'Open clinic',
        'amount_cents' => 100000,
        'currency' => 'DZD',
    ]);
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $won->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('won')->id,
        'title' => 'Closed clinic',
        'amount_cents' => 200000,
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts?deal_stage=proposal')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('contacts', 1)
            ->where('contacts.0.id', $proposal->id)
            ->where('listView.filterFields', fn ($fields) => collect($fields)->contains(fn ($field) => ($field['id'] ?? '') === 'deal_stage')));

    $this->actingAs($user)
        ->get('/crm/contacts?has_open_deal=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('contacts', 1)
            ->where('contacts.0.id', $proposal->id));

    expect($none->id)->not->toBe($proposal->id);
});
