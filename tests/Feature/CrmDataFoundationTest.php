<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\ContactConsent;
use App\Models\Deal;
use App\Models\DealProbabilitySnapshot;
use App\Models\RecordRelationship;
use App\Models\User;
use Illuminate\Database\QueryException;

it('supports account hierarchies, consent, relationships, attribution, and deal probability history', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $parent = Company::factory()->create([
        'workspace_id' => $workspace->id,
        'account_type' => 'customer',
    ]);
    $child = Company::factory()->create([
        'workspace_id' => $workspace->id,
        'parent_company_id' => $parent->id,
        'account_type' => 'subsidiary',
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'company_id' => $child->id,
        'source' => 'campaign',
        'source_detail' => 'linkedin',
        'source_campaign' => 'q4-enterprise',
        'source_medium' => 'paid-social',
        'first_touch_at' => now()->subDays(4),
        'last_touch_at' => now(),
    ]);

    $relationship = RecordRelationship::query()->create([
        'workspace_id' => $workspace->id,
        'from_type' => Company::class,
        'from_id' => $parent->id,
        'to_type' => Contact::class,
        'to_id' => $contact->id,
        'relationship_type' => 'economic_buyer',
        'meta' => ['confidence' => 0.9],
    ]);
    $consent = ContactConsent::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'purpose' => 'marketing',
        'status' => ContactConsent::STATUS_GRANTED,
        'source' => 'web_form',
        'captured_at' => now(),
    ]);

    $pipeline = $workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'company_id' => $child->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('qualified')->id,
        'title' => 'Enterprise expansion',
        'amount_cents' => 2_500_000,
        'currency' => 'DZD',
    ]);
    $snapshot = DealProbabilitySnapshot::query()->create([
        'workspace_id' => $workspace->id,
        'deal_id' => $deal->id,
        'stage_id' => $deal->stage_id,
        'probability' => 25,
        'amount_cents' => $deal->amount_cents,
        'reason' => 'stage_change',
        'recorded_by' => $user->id,
        'recorded_at' => now(),
    ]);

    expect($child->fresh()->parentCompany->is($parent))->toBeTrue()
        ->and($parent->fresh()->subsidiaries->contains(fn (Company $subsidiary): bool => $subsidiary->is($child)))->toBeTrue()
        ->and($contact->fresh()->source_campaign)->toBe('q4-enterprise')
        ->and($consent->fresh()->isGranted())->toBeTrue()
        ->and($relationship->fresh()->fromRecord->is($parent))->toBeTrue()
        ->and($relationship->fresh()->toRecord->is($contact))->toBeTrue()
        ->and($parent->fresh()->outgoingRelationships->contains(fn (RecordRelationship $edge): bool => $edge->is($relationship)))->toBeTrue()
        ->and($contact->fresh()->incomingRelationships->contains(fn (RecordRelationship $edge): bool => $edge->is($relationship)))->toBeTrue()
        ->and($snapshot->fresh()->deal->is($deal))->toBeTrue()
        ->and($deal->fresh()->probabilitySnapshots->contains(fn (DealProbabilitySnapshot $history): bool => $history->is($snapshot)))->toBeTrue();
});

it('prevents duplicate consent records for the same contact channel and purpose', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $attributes = [
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'purpose' => 'marketing',
    ];

    ContactConsent::query()->create($attributes + ['status' => ContactConsent::STATUS_GRANTED]);

    expect(fn () => ContactConsent::query()->create($attributes + ['status' => ContactConsent::STATUS_DENIED]))
        ->toThrow(QueryException::class);
});
