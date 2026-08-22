<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Sequence;
use App\Models\Thread;
use App\Models\User;

it('loads contact associations for company, deal, thread, and enrollment', function () {
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
        'title' => 'Assoc deal',
        'currency' => 'DZD',
    ]);
    Thread::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel_id' => $workspace->channels()->first()->id,
        'status' => 'open',
        'subject' => 'WhatsApp Cloud',
        'last_message_at' => now(),
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
            ->component('crm/contacts/hub')
            ->has('associations.company')
            ->has('associations.deals', 1)
            ->has('associations.threads', 1)
            ->has('associations.enrollments', 1)
        );
});
