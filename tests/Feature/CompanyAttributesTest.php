<?php

use App\Models\Company;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\User;

it('saves company attributes through the dedicated update route', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'company',
            'key' => 'beds',
            'label' => 'Beds',
            'type' => 'number',
            'group' => 'About',
            'required' => '0',
        ])
        ->assertRedirect();

    $definition = CustomAttributeDefinition::query()->where('key', 'beds')->first();
    expect($definition)->not->toBeNull();

    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->put("/crm/companies/{$company->id}/attributes", [
            'attributes' => ['beds' => '42'],
        ])
        ->assertRedirect();

    expect(CustomAttributeValue::query()
        ->where('definition_id', $definition->id)
        ->where('entity_type', 'company')
        ->where('entity_id', $company->id)
        ->value('value'))->toBe('42');
});

it('enforces required company attributes on the dedicated route', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'company',
            'key' => 'license',
            'label' => 'License',
            'type' => 'text',
            'required' => '1',
        ])
        ->assertRedirect();

    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->from("/crm/companies/{$company->id}")
        ->put("/crm/companies/{$company->id}/attributes", [
            'attributes' => ['license' => ''],
        ])
        ->assertRedirect("/crm/companies/{$company->id}")
        ->assertSessionHasErrors('attributes.license');
});
