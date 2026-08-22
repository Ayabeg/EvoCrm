<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\User;

it('creates a unique Algeria-first contact on the workspace', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->post('/crm/contacts', [
            'first_name' => 'Amine',
            'last_name' => 'Test',
            'phone' => '0550199001',
            'email' => 'amine.test@evotechly.dz',
            'company_id' => $company->id,
        ])
        ->assertRedirect();

    $contact = Contact::query()->forWorkspace($user->workspace)->where('email', 'amine.test@evotechly.dz')->first();

    expect($contact)->not->toBeNull()
        ->and($contact->phone_e164)->toStartWith('+213')
        ->and($contact->company_id)->toBe($company->id);
});
