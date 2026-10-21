<?php

use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\Mailbox;
use App\Models\OutboundCampaign;
use App\Models\OutboundMessage;
use App\Models\SavedFilter;
use App\Models\User;
use App\Services\Crm\ContactCsvImporter;
use App\Services\Crm\LeadScorer;
use App\Services\Enrichment\EnrichmentPersister;
use App\Services\Enrichment\EnrichmentService;
use App\Services\Outbound\CampaignService;
use App\Services\Outbound\ImapReplyPoller;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

it('runs the outbound acquisition path from import through reply and pipeline', function () {
    $this->travelTo(Carbon::parse('2026-10-21 10:00:00', 'Africa/Algiers'));
    config(['services.google.places_key' => 'test-places-key']);
    Http::preventStrayRequests();
    Http::fake([
        'https://clinique-atlas.dz' => Http::response(
            '<html><head><title>Clinique Atlas</title></head><body>Ecrivez hello@clinique-atlas.dz</body></html>',
            200,
        ),
        'https://clinique-atlas.dz/*' => Http::response(
            '<html><head><title>Clinique Atlas</title></head><body>Ecrivez hello@clinique-atlas.dz</body></html>',
            200,
        ),
        'https://places.googleapis.com/v1/places:searchText' => Http::response([
            'places' => [[
                'id' => 'ChIJ-atlas',
                'displayName' => ['text' => 'Clinique Atlas'],
                'formattedAddress' => 'Hydra, Alger, Algeria',
                'location' => ['latitude' => 36.75, 'longitude' => 3.06],
                'googleMapsUri' => 'https://maps.google.com/?cid=123',
            ]],
        ], 200),
    ]);

    $user = User::factory()->create();
    $mailbox = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
    ]);

    $batch = app(ContactCsvImporter::class)->createBatch(
        $user->workspace,
        $user,
        UploadedFile::fake()->createWithContent('acquisition.csv', <<<'CSV'
First Name,Last Name,Email,Phone Number,Company Name,City
Amine,Benali,hello@clinique-atlas.dz,0550123456,Clinique Atlas,Algiers
CSV),
    );
    app(ContactCsvImporter::class)->process($batch);

    $contact = Contact::query()
        ->forWorkspace($user->workspace)
        ->with('company')
        ->where('email', 'hello@clinique-atlas.dz')
        ->firstOrFail();
    $contact->forceFill([
        'last_activity_at' => now(),
        'meta' => ['website' => 'https://clinique-atlas.dz'],
    ])->save();
    $contact->company?->forceFill(['domain' => 'clinique-atlas.dz'])->save();

    app(EnrichmentService::class)->enrich(
        $user->workspace,
        EnrichmentRun::TARGET_CONTACT,
        (int) $contact->id,
    );

    $verification = app(EnrichmentPersister::class)->persistProposal(
        $user->workspace,
        EnrichmentRun::TARGET_CONTACT,
        $contact->fresh() ?? $contact,
        'email_verifier',
        'email',
        $contact->email,
        0.99,
        ['evidence_url' => 'https://verifier.example.test/check'],
        EnrichmentRun::VERIFICATION_VERIFIED,
    );

    expect($verification->verification_status)->toBe(EnrichmentRun::VERIFICATION_VERIFIED)
        ->and(data_get($contact->fresh()->meta, 'email_verification.status'))->toBe(EnrichmentRun::VERIFICATION_VERIFIED);

    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $contact->company_id,
        'source' => 'inbound',
        'payload' => ['fields' => ['need' => 'sales automation']],
    ]);
    $score = app(LeadScorer::class)->score($lead, $user);

    expect($score['score'])->toBeGreaterThanOrEqual(80)
        ->and($lead->fresh()->deal)->not->toBeNull();

    $filter = SavedFilter::query()->create([
        'workspace_id' => $user->workspace_id,
        'entity' => 'contact',
        'name' => 'Verified acquisition prospects',
        'filters' => ['data_quality_min' => $score['data_quality']],
    ]);
    $campaign = OutboundCampaign::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Acquisition workflow',
        'status' => OutboundCampaign::STATUS_DRAFT,
        'saved_filter_id' => $filter->id,
        'mailbox_id' => $mailbox->id,
        'subject' => 'Bonjour {{first_name}}',
        'body' => 'Nous pouvons aider {{first_name}}.',
        'created_by' => $user->id,
    ]);

    $preview = app(CampaignService::class)->preview($campaign);
    expect($preview['audience_count'])->toBe(1)
        ->and($preview['eligible_count'])->toBe(1);

    app(CampaignService::class)->expand($campaign);
    $this->artisan('outbound:run')->assertSuccessful();

    $message = OutboundMessage::query()
        ->where('campaign_id', $campaign->id)
        ->where('contact_id', $contact->id)
        ->firstOrFail();
    expect($message->status)->toBe('sent');

    $reply = app(ImapReplyPoller::class)->recordContactReply($mailbox, $contact, [
        'subject' => 'Re: Bonjour Amine',
        'body' => 'Oui, parlons-en.',
        'message_id' => '<reply-1@example.dz>',
    ]);

    expect($reply->direction)->toBe('in')
        ->and($message->fresh()->replied_at)->not->toBeNull()
        ->and($contact->fresh()->leads()->first()->deal)->not->toBeNull();
});
