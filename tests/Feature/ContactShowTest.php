<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('renders the contact record with key information and associations', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'lead_status' => 'open',
        'first_name' => 'Beghanem Beghanem',
        'last_name' => 'Beghanem',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Linked deal',
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/show')
            ->where('contact.lead_status', 'open')
            ->where('contact.display_name', 'Beghanem Beghanem')
            ->has('associations.company')
            ->has('associations.deals', 1)
            ->has('timeline')
            ->has('dealsKanban.stages')
            ->has('dealsKanban.deals', 1)
            ->has('askEvo.summary')
        );
});

it('deduplicates repeated contact name parts in displayName', function () {
    $contact = Contact::factory()->make([
        'first_name' => 'Beghanem',
        'last_name' => 'Beghanem',
    ]);

    expect($contact->displayName())->toBe('Beghanem');
});
