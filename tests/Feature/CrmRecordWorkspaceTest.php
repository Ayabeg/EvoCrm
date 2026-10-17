<?php

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Message;
use App\Models\Sequence;
use App\Models\Thread;
use App\Models\User;

it('loads the contact show workspace with associations and catch-up', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $company = Company::factory()->create(['workspace_id' => $workspace->id]);
    $contact = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
    ]);
    $pipeline = $workspace->defaultPipeline();
    Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Workspace deal',
        'currency' => 'DZD',
    ]);
    $thread = Thread::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel_id' => $workspace->channels()->first()->id,
        'status' => 'open',
        'subject' => 'WhatsApp Cloud',
        'last_message_at' => now(),
    ]);
    Message::query()->create([
        'workspace_id' => $workspace->id,
        'thread_id' => $thread->id,
        'contact_id' => $contact->id,
        'direction' => 'inbound',
        'type' => 'text',
        'body' => 'Need a callback this week',
        'status' => 'received',
        'provider' => 'evolution_cloud',
    ]);
    $sequence = Sequence::factory()->create(['workspace_id' => $workspace->id]);
    Enrollment::query()->create([
        'workspace_id' => $workspace->id,
        'sequence_id' => $sequence->id,
        'contact_id' => $contact->id,
        'status' => 'active',
    ]);

    $this->actingAs($user)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/show')
            ->has('associations.company')
            ->has('associations.deals', 1)
            ->has('associations.threads', 1)
            ->has('associations.enrollments', 1)
            ->has('catchUp.inbound', 1)
            ->where('catchUp.inbound.0.label', 'Need a callback this week')
            ->has('catchUp.outbound')
            ->has('timeline')
            ->where('timeline.0.type', 'inbound_message')
            ->where('timeline.0.body', 'Need a callback this week')
        );
});

it('loads the deal show workspace with associations and catch-up', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $company = Company::factory()->create(['workspace_id' => $workspace->id]);
    $contact = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
    ]);
    $pipeline = $workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Record workspace deal',
        'currency' => 'DZD',
        'amount_cents' => 250000,
    ]);
    $thread = Thread::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel_id' => $workspace->channels()->first()->id,
        'status' => 'open',
        'subject' => 'Deal thread',
        'last_message_at' => now(),
    ]);
    Message::query()->create([
        'workspace_id' => $workspace->id,
        'thread_id' => $thread->id,
        'contact_id' => $contact->id,
        'direction' => 'inbound',
        'type' => 'text',
        'body' => 'Can we close this month?',
        'status' => 'received',
        'provider' => 'evolution_cloud',
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'note',
        'subject' => 'Sent proposal',
        'contact_id' => $contact->id,
        'deal_id' => $deal->id,
        'owner_id' => $user->id,
        'actor_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/show')
            ->has('associations.contact')
            ->has('associations.company')
            ->has('associations.threads', 1)
            ->has('associations.quotes')
            ->has('catchUp.inbound', 1)
            ->where('catchUp.inbound.0.label', 'Can we close this month?')
            ->has('catchUp.outbound', 1)
            ->where('catchUp.outbound.0.label', 'Sent proposal')
            ->has('timeline')
        );
});

it('loads the company show workspace with associations', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $company = Company::factory()->create(['workspace_id' => $workspace->id]);
    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'company_id' => $company->id,
    ]);

    $this->actingAs($user)
        ->get("/crm/companies/{$company->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/companies/show')
            ->has('associations.contacts', 1)
            ->has('associations.deals')
            ->where('selected.contacts_count', 1)
        );
});
