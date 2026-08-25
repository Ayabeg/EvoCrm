<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('creates a contact from the create drawer and can add another', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/crm/contacts')
        ->post('/crm/contacts', [
            'first_name' => 'Drawer',
            'last_name' => 'One',
            'email' => 'drawer.one@evotechly.dz',
        ])
        ->assertRedirect('/crm/contacts');

    $this->actingAs($user)
        ->from('/crm/contacts')
        ->post('/crm/contacts', [
            'first_name' => 'Drawer',
            'last_name' => 'Two',
            'email' => 'drawer.two@evotechly.dz',
            'add_another' => '1',
        ])
        ->assertRedirect('/crm/contacts?create=1');

    expect(Contact::query()->forWorkspace($user->workspace)->where('first_name', 'Drawer')->count())->toBe(2);

    $this->actingAs($user)
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->has('members')
            ->has('companies')
        );
});

it('creates a company and a deal from the create drawer fields', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Keep existing']);
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->from('/crm/companies')
        ->post('/crm/companies', ['name' => 'Drawer Co'])
        ->assertRedirect();

    $this->actingAs($user)
        ->from('/crm/deals')
        ->post('/crm/deals', [
            'title' => 'Drawer deal',
            'contact_id' => $contact->id,
            'amount_dzd' => 1500,
        ])
        ->assertRedirect();

    expect(Company::query()->forWorkspace($user->workspace)->where('name', 'Drawer Co')->exists())->toBeTrue()
        ->and(Company::query()->forWorkspace($user->workspace)->whereKey($company->id)->exists())->toBeTrue()
        ->and(Deal::query()->forWorkspace($user->workspace)->where('title', 'Drawer deal')->exists())->toBeTrue();
});
