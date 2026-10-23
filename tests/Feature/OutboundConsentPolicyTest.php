<?php

use App\Models\Contact;
use App\Models\ContactConsent;
use App\Models\OutboundCampaign;
use App\Models\Sequence;
use App\Models\User;
use App\Services\Outbound\CampaignService;
use App\Services\Outbound\OutboundEligibility;
use App\Services\Outbound\SequenceEnrollment;
use Illuminate\Validation\ValidationException;

it('blocks outbound enrollment and campaign eligibility without consent by default', function () {
    config(['evosales.outbound.require_marketing_consent' => true]);

    $user = User::factory()->create();
    $contact = Contact::factory()->withVerifiedEmail()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'prospect@example.dz',
    ]);
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
    ]);
    $sequence->steps()->create([
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'subject' => 'Hello',
        'body' => 'Hello',
    ]);

    expect(fn () => app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact))
        ->toThrow(ValidationException::class);

    $campaign = OutboundCampaign::factory()->create(['workspace_id' => $user->workspace_id]);
    $preview = app(CampaignService::class)->preview($campaign);

    expect($preview['eligible_count'])->toBe(0)
        ->and($preview['reasons']['Contact has no recorded marketing consent for this channel.'])->toBe(1);
});

it('allows a documented cold-outreach mode while still blocking explicit denial', function () {
    config(['evosales.outbound.require_marketing_consent' => false]);

    $user = User::factory()->create();
    $contact = Contact::factory()->withVerifiedEmail()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'prospect@example.dz',
    ]);

    expect(app(OutboundEligibility::class)->reason($user->workspace, $contact, 'email'))->toBeNull();

    ContactConsent::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'purpose' => 'marketing',
        'status' => ContactConsent::STATUS_DENIED,
        'source' => 'unsubscribe',
        'captured_at' => now(),
    ]);

    expect(app(OutboundEligibility::class)->reason($user->workspace, $contact, 'email'))
        ->toBe('Contact has not granted marketing consent for this channel.');
});

it('applies the explicit campaign verification policy during preview', function () {
    config([
        'evosales.outbound.block_unknown_verification' => false,
        'evosales.outbound.require_marketing_consent' => false,
    ]);

    $user = User::factory()->create();
    Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'campaign-unknown@clinic.dz',
        'meta' => ['email_verification' => ['status' => 'unknown']],
    ]);
    $campaign = OutboundCampaign::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email_verification_policy' => 'allow_unknown',
    ]);

    expect(app(CampaignService::class)->preview($campaign))
        ->toMatchArray([
            'audience_count' => 1,
            'eligible_count' => 1,
            'ineligible_count' => 0,
        ]);
});

it('fails closed when verification provenance belongs to a different current email', function () {
    config([
        'evosales.outbound.block_unknown_verification' => true,
        'evosales.outbound.require_marketing_consent' => false,
    ]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'current@clinic.dz',
        'meta' => [
            'email_verification' => [
                'email' => 'old@clinic.dz',
                'status' => 'verified',
            ],
        ],
    ]);

    expect(app(OutboundEligibility::class)->reason($user->workspace, $contact, 'email'))
        ->toBe('Contact email verification is unknown.');
});
