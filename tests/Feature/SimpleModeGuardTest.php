<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;

function simpleModeGuardOwner(): User
{
    $workspace = app(WorkspaceProvisioner::class)->provision('Guard Clinic');

    return User::factory()->create([
        'workspace_id' => $workspace->id,
        'role' => WorkspaceRole::Owner,
    ]);
}

it('forbids hidden power routes while simple mode is on', function () {
    $user = simpleModeGuardOwner();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)->get('/crm/tickets')->assertForbidden();
    $this->actingAs($user)->get('/crm/tickets/board')->assertForbidden();
    $this->actingAs($user)->get('/ads')->assertForbidden();
    $this->actingAs($user)->get('/outbound/warmup')->assertForbidden();
    $this->actingAs($user)->get('/crm/report-builder')->assertForbidden();
    $this->actingAs($user)
        ->post("/crm/contacts/{$contact->id}/ask", ['question' => 'What next?'])
        ->assertForbidden();
});

it('keeps the retired /leads redirect while simple mode is on', function () {
    $user = simpleModeGuardOwner();

    $this->actingAs($user)
        ->get('/leads')
        ->assertRedirect('/crm/deals/board');
});

it('still creates one deal when a lead is qualified in simple mode', function () {
    $user = simpleModeGuardOwner();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $lead = Lead::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $contact->company_id,
        'title' => 'Clinic intake',
        'source' => 'manual',
        'status' => 'working',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    $stage = $pipeline->stageBySlug('qualified');

    $this->actingAs($user)
        ->from("/crm/leads/{$lead->id}")
        ->post("/crm/leads/{$lead->id}/qualify", [
            'mode' => 'create',
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage->id,
            'owner_id' => $user->id,
            'amount_cents' => 1_800_000,
        ])
        ->assertRedirect();

    $lead->refresh();

    expect($lead->status)->toBe('qualified')
        ->and($lead->deal)->not->toBeNull()
        ->and(Deal::query()->forWorkspace($user->workspace)->count())->toBe(1);
});

it('keeps power routes available on existing full-product workspaces', function () {
    $user = User::factory()->create();

    expect($user->workspace->simple_mode)->toBeFalse();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('simpleMode', false)
            ->where('features.tickets', true)
            ->where('features.sms', true));

    $this->actingAs($user)->get('/crm/tickets')->assertOk();
});
