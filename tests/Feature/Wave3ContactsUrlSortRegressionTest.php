<?php

use App\Models\Contact;
use App\Models\User;

/**
 * Product regression: the list-query contract writes ?sort=&direction=
 * (see resources/js/lib/list-query/serialize.ts and P03C), but
 * CrmFilter::resolve() never reads those request keys. Leave this
 * failing until the backend overlays URL sort on the saved/default sort.
 */
it('applies URL-owned Contacts sort and direction to the list', function () {
    $user = User::factory()->create();

    $zeta = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Zineb',
        'last_name' => 'Zidane',
        'created_at' => now()->subDay(),
    ]);
    $alpha = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
        'created_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts?sort=name&direction=asc')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->has('contacts', 2)
            ->where('contacts.0.id', $alpha->id)
            ->where('contacts.1.id', $zeta->id)
            ->where('activeFilters.sort.field', 'name')
            ->where('activeFilters.sort.direction', 'asc')
            ->where('listView.sort.field', 'name')
            ->where('listView.sort.direction', 'asc')
        );
});
