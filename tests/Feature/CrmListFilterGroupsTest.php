<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\Ticket;
use App\Models\User;

function listFilterGroups(array $groups, string $logic = 'and'): string
{
    return json_encode([
        'logic' => $logic,
        'groups' => $groups,
    ], JSON_THROW_ON_ERROR);
}

it('executes filter_groups on the contact index and isolates workspaces', function () {
    $user = User::factory()->create();
    $foreign = User::factory()->create();

    $kept = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amina',
        'last_name' => 'Benali',
        'city' => 'Hydra',
        'wilaya' => 'Alger',
    ]);
    Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Karim',
        'city' => 'Oran',
        'wilaya' => 'Oran',
    ]);
    Contact::factory()->create([
        'workspace_id' => $foreign->workspace_id,
        'first_name' => 'Foreign',
        'city' => 'Hydra',
        'wilaya' => 'Alger',
    ]);

    $groups = listFilterGroups([[
        'logic' => 'and',
        'rules' => [
            ['field' => 'city', 'operator' => 'eq', 'value' => 'Hydra'],
        ],
    ]]);

    $this->actingAs($user)
        ->get('/crm/contacts?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->has('contacts', 1)
            ->where('contacts.0.id', $kept->id)
            ->where('recordCount', 1)
        );

    $this->actingAs($foreign)
        ->get('/crm/contacts?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->has('contacts', 1)
            ->where('contacts.0.first_name', 'Foreign')
        );
});

it('executes filter_groups on the deal index and isolates workspaces', function () {
    $user = User::factory()->create();
    $foreign = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $foreignPipeline = $foreign->workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $foreignContact = Contact::factory()->create(['workspace_id' => $foreign->workspace_id]);

    $kept = Deal::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'owner_id' => null,
        'title' => 'Équipement bloc opératoire',
    ]);
    Deal::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'owner_id' => $user->id,
        'title' => 'Owned deal',
    ]);
    Deal::factory()->create([
        'workspace_id' => $foreign->workspace_id,
        'contact_id' => $foreignContact->id,
        'pipeline_id' => $foreignPipeline->id,
        'stage_id' => $foreignPipeline->stageBySlug('new')->id,
        'owner_id' => null,
        'title' => 'Foreign unassigned',
    ]);

    $groups = listFilterGroups([[
        'logic' => 'and',
        'rules' => [
            ['field' => 'unassigned', 'operator' => 'is_true'],
        ],
    ]]);

    $this->actingAs($user)
        ->get('/crm/deals?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->has('deals', 1)
            ->where('deals.0.id', $kept->id)
        );

    $this->actingAs($foreign)
        ->get('/crm/deals?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->has('deals', 1)
            ->where('deals.0.title', 'Foreign unassigned')
        );
});

it('executes filter_groups on the deal board and isolates workspaces', function () {
    $user = User::factory()->create();
    $foreign = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $foreignPipeline = $foreign->workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $foreignContact = Contact::factory()->create(['workspace_id' => $foreign->workspace_id]);

    $kept = Deal::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'owner_id' => null,
        'title' => 'Équipement bloc opératoire',
    ]);
    Deal::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'owner_id' => $user->id,
        'title' => 'Owned deal',
    ]);
    Deal::factory()->create([
        'workspace_id' => $foreign->workspace_id,
        'contact_id' => $foreignContact->id,
        'pipeline_id' => $foreignPipeline->id,
        'stage_id' => $foreignPipeline->stageBySlug('new')->id,
        'owner_id' => null,
        'title' => 'Foreign unassigned',
    ]);

    $groups = listFilterGroups([[
        'logic' => 'and',
        'rules' => [
            ['field' => 'unassigned', 'operator' => 'is_true'],
        ],
    ]]);

    $this->actingAs($user)
        ->get('/crm/deals/board?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/board')
            ->has('deals', 1)
            ->where('deals.0.id', $kept->id)
        );

    $this->actingAs($foreign)
        ->get('/crm/deals/board?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/board')
            ->has('deals', 1)
            ->where('deals.0.title', 'Foreign unassigned')
        );
});

it('executes filter_groups on the ticket index and isolates workspaces', function () {
    $user = User::factory()->create();
    $foreign = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $foreignContact = Contact::factory()->create(['workspace_id' => $foreign->workspace_id]);

    $kept = Ticket::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'subject' => 'Pompe à perfusion',
        'priority' => Ticket::PRIORITY_HIGH,
        'status' => Ticket::STATUS_NEW,
    ]);
    Ticket::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'subject' => 'Low priority',
        'priority' => Ticket::PRIORITY_LOW,
        'status' => Ticket::STATUS_NEW,
    ]);
    Ticket::factory()->create([
        'workspace_id' => $foreign->workspace_id,
        'contact_id' => $foreignContact->id,
        'subject' => 'Foreign high',
        'priority' => Ticket::PRIORITY_HIGH,
        'status' => Ticket::STATUS_NEW,
    ]);

    $groups = listFilterGroups([[
        'logic' => 'and',
        'rules' => [
            ['field' => 'priority', 'operator' => 'eq', 'value' => Ticket::PRIORITY_HIGH],
        ],
    ]]);

    $this->actingAs($user)
        ->get('/crm/tickets?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/index')
            ->has('tickets', 1)
            ->where('tickets.0.id', $kept->id)
        );

    $this->actingAs($foreign)
        ->get('/crm/tickets?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/index')
            ->has('tickets', 1)
            ->where('tickets.0.subject', 'Foreign high')
        );
});

it('executes filter_groups on the quote index and isolates workspaces', function () {
    $user = User::factory()->create();
    $foreign = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $foreignPipeline = $foreign->workspace->defaultPipeline();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id, 'company_id' => $company->id]);
    $foreignCompany = Company::factory()->create(['workspace_id' => $foreign->workspace_id]);
    $foreignContact = Contact::factory()->create(['workspace_id' => $foreign->workspace_id, 'company_id' => $foreignCompany->id]);

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinique El Djazair',
        'amount_cents' => 1_280_000_00,
        'currency' => 'DZD',
    ]);
    $otherDeal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Accepted quote deal',
        'amount_cents' => 10_000,
        'currency' => 'DZD',
    ]);
    $foreignDeal = Deal::query()->create([
        'workspace_id' => $foreign->workspace_id,
        'contact_id' => $foreignContact->id,
        'company_id' => $foreignCompany->id,
        'owner_id' => $foreign->id,
        'pipeline_id' => $foreignPipeline->id,
        'stage_id' => $foreignPipeline->stageBySlug('new')->id,
        'title' => 'Foreign draft',
        'amount_cents' => 10_000,
        'currency' => 'DZD',
    ]);

    $kept = Quote::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'total_cents' => 1_280_000_00,
        'expires_at' => now()->addDays(14),
    ]);
    Quote::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $otherDeal->id,
        'status' => 'accepted',
        'currency' => 'DZD',
        'total_cents' => 10_000,
        'expires_at' => now()->addDays(14),
    ]);
    Quote::query()->create([
        'workspace_id' => $foreign->workspace_id,
        'deal_id' => $foreignDeal->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'total_cents' => 10_000,
        'expires_at' => now()->addDays(14),
    ]);

    $groups = listFilterGroups([[
        'logic' => 'and',
        'rules' => [
            ['field' => 'status', 'operator' => 'eq', 'value' => 'draft'],
        ],
    ]]);

    $this->actingAs($user)
        ->get('/crm/quotes?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->has('quotes', 1)
            ->where('quotes.0.id', $kept->id)
        );

    $this->actingAs($foreign)
        ->get('/crm/quotes?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->has('quotes', 1)
            ->where('quotes.0.title', 'Foreign draft')
        );
});

it('executes filter_groups on the lead index and isolates workspaces', function () {
    $user = User::factory()->create();
    $foreign = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $foreignContact = Contact::factory()->create(['workspace_id' => $foreign->workspace_id]);

    $kept = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'title' => 'Cabinet Dr. Amrani',
        'status' => 'new',
    ]);
    Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'title' => 'Qualified inbound',
        'status' => 'qualified',
    ]);
    Lead::factory()->create([
        'workspace_id' => $foreign->workspace_id,
        'contact_id' => $foreignContact->id,
        'title' => 'Foreign new',
        'status' => 'new',
    ]);

    $groups = listFilterGroups([[
        'logic' => 'and',
        'rules' => [
            ['field' => 'status', 'operator' => 'eq', 'value' => 'new'],
        ],
    ]]);

    $this->actingAs($user)
        ->get('/crm/leads?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/index')
            ->has('leads', 1)
            ->where('leads.0.id', $kept->id)
            ->has('activeFilters')
            ->has('savedFilters')
        );

    $this->actingAs($foreign)
        ->get('/crm/leads?'.http_build_query(['filter_groups' => $groups]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/index')
            ->has('leads', 1)
            ->where('leads.0.title', 'Foreign new')
        );
});
