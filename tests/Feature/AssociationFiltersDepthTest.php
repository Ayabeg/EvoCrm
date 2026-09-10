<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('filters contacts by won deals, minimum amount, and associated company', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Clinique Hydra']);

    $wonContact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Won',
        'company_id' => $company->id,
    ]);
    $openContact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Open',
    ]);
    $smallContact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Small',
        'company_id' => $company->id,
    ]);

    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $wonContact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('won')->id,
        'title' => 'Won clinic',
        'amount_cents' => 5_000_000,
        'currency' => 'DZD',
    ]);
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $openContact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => 'Open clinic',
        'amount_cents' => 1_000_000,
        'currency' => 'DZD',
    ]);
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $smallContact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('qualified')->id,
        'title' => 'Small clinic',
        'amount_cents' => 50_000,
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get('/crm/contacts?has_won_deal=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('contacts', 1)
            ->where('contacts.0.id', $wonContact->id)
            ->where('listView.filterFields', fn ($fields) => collect($fields)->contains(fn ($field) => ($field['id'] ?? '') === 'has_won_deal')));

    $this->actingAs($user)
        ->get('/crm/contacts?deal_min_amount=20000')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('contacts', 1)
            ->where('contacts.0.id', $wonContact->id));

    $this->actingAs($user)
        ->get('/crm/contacts?has_company=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('contacts', 2)
            ->where('contacts', fn ($rows) => collect($rows)->pluck('id')->sort()->values()->all() === collect([$wonContact->id, $smallContact->id])->sort()->values()->all()));
});

it('filters companies by deal stage and deals by associated company', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Oran Labs']);
    $other = Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'No deal co']);
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $linked = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => 'Linked deal',
        'amount_cents' => 800_000,
        'currency' => 'DZD',
    ]);
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('qualified')->id,
        'title' => 'Unlinked deal',
        'amount_cents' => 400_000,
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get('/crm/companies?deal_stage=proposal')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('companies', 1)
            ->where('companies.0.id', $company->id)
            ->where('listView.filterFields', fn ($fields) => collect($fields)->contains(fn ($field) => ($field['id'] ?? '') === 'deal_stage')));

    $this->actingAs($user)
        ->get('/crm/deals?has_associated_company=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('deals', 1)
            ->where('deals.0.id', $linked->id)
            ->where('listView.filterFields', fn ($fields) => collect($fields)->contains(fn ($field) => ($field['id'] ?? '') === 'has_associated_company')));

    expect($other->id)->not->toBe($company->id);
});
