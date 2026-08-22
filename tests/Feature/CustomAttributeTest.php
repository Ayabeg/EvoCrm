<?php

use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\User;

it('defines a custom attribute and saves a contact value', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'contact',
            'key' => 'beds',
            'label' => 'Beds',
            'type' => 'number',
        ])
        ->assertRedirect();

    $definition = CustomAttributeDefinition::query()->where('key', 'beds')->first();
    expect($definition)->not->toBeNull();

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
