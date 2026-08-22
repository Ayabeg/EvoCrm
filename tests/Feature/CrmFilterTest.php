<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\SavedFilter;
use App\Models\User;

it('filters contacts by wilaya, unanswered, and unassigned', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $alger = Company::factory()->create(['workspace_id' => $workspace->id, 'city' => 'Alger', 'wilaya' => 'Alger']);
    $oran = Company::factory()->create(['workspace_id' => $workspace->id, 'city' => 'Oran', 'wilaya' => 'Oran']);

    $kept = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'company_id' => $alger->id,
        'city' => 'Alger',
        'wilaya' => 'Alger',
        'owner_id' => null,
        'unanswered' => true,
    ]);
    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'company_id' => $oran->id,
        'city' => 'Oran',
        'wilaya' => 'Oran',
        'owner_id' => $user->id,
        'unanswered' => false,
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts?wilaya=Alger&unanswered=1&unassigned=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/hub')
            ->has('contacts', 1)
            ->where('contacts.0.id', $kept->id)
        );
});

it('saves a reusable list filter', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/filters', [
            'name' => 'Unanswered Alger',
            'entity' => 'contact',
            'city' => 'Alger',
            'unanswered' => true,
        ])
        ->assertRedirect();

    expect(SavedFilter::query()->where('name', 'Unanswered Alger')->exists())->toBeTrue();
});
