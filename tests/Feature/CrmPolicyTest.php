<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Quote;
use App\Models\User;

function policyForeignDeal(User $owner, string $title = 'Owner deal'): Deal
{
    $pipeline = $owner->workspace->defaultPipeline();

    return Deal::query()->create([
        'workspace_id' => $owner->workspace_id,
        'contact_id' => Contact::factory()->create([
            'workspace_id' => $owner->workspace_id,
        ])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => $title,
        'amount_cents' => 250_000,
        'currency' => 'DZD',
    ]);
}

function policyEditorInOtherWorkspace(): User
{
    return User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => ['crm.edit'],
    ]);
}

it('forbids a member from updating a contact deal or quote in another workspace', function () {
    $owner = User::factory()->create();
    $member = policyEditorInOtherWorkspace();

    $contact = Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'first_name' => 'Leaked',
        'email' => 'leaked@example.test',
    ]);
    $deal = policyForeignDeal($owner, 'Owner deal');
    $quote = Quote::query()->create([
        'workspace_id' => $owner->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'notes' => 'Keep me',
        'total_cents' => 250_000,
    ]);

    $this->actingAs($member)
        ->put("/crm/contacts/{$contact->id}", [
            'first_name' => 'Hacked',
            'email' => 'hacked@example.test',
        ])
        ->assertForbidden();

    $this->actingAs($member)
        ->put("/crm/deals/{$deal->id}", [
            'title' => 'Hacked deal',
        ])
        ->assertForbidden();

    $this->actingAs($member)
        ->put("/crm/quotes/{$quote->id}", [
            'notes' => 'Hacked quote',
        ])
        ->assertForbidden();

    expect($contact->fresh()->first_name)->toBe('Leaked')
        ->and($deal->fresh()->title)->toBe('Owner deal')
        ->and($quote->fresh()->notes)->toBe('Keep me');
});

it('still lets a member with crm.edit update a contact in their own workspace', function () {
    $member = policyEditorInOtherWorkspace();
    $contact = Contact::factory()->create([
        'workspace_id' => $member->workspace_id,
        'first_name' => 'Own',
        'email' => 'own@example.test',
    ]);

    $this->actingAs($member)
        ->put("/crm/contacts/{$contact->id}", [
            'first_name' => 'Updated',
            'email' => 'own@example.test',
        ])
        ->assertRedirect();

    expect($contact->fresh()->first_name)->toBe('Updated');
});

it('keeps public quote acceptance token-gated and outside CRM policies', function () {
    $owner = User::factory()->create();
    $deal = policyForeignDeal($owner, 'Public quote deal');
    $quote = Quote::query()->create([
        'workspace_id' => $owner->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'sent',
        'currency' => 'DZD',
        'total_cents' => 250_000,
        'public_token' => 'policy-public-accept',
        'token_expires_at' => now()->addDay(),
        'sent_at' => now(),
    ]);

    $this->post('/q/policy-public-accept/accept')->assertRedirect();

    expect($quote->fresh()->status)->toBe('accepted')
        ->and($quote->fresh()->accepted_at)->not->toBeNull();
});
