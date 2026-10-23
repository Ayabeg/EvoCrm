<?php

use App\Jobs\DeliverLeadMagnetSubmission;
use App\Jobs\EnrichRecordJob;
use App\Mail\LeadLeakageResultMail;
use App\Models\Contact;
use App\Models\ContactConsent;
use App\Models\FunnelEvent;
use App\Models\Lead;
use App\Models\LeadMagnetSubmission;
use App\Models\MeetingSchedule;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

it('renders the workspace lead leakage calculator publicly', function () {
    $workspace = User::factory()->create()->workspace;

    $this->get("/lead-magnet/{$workspace->slug}/lead-leakage-calculator")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/lead-leakage-calculator')
            ->where('offer.slug', 'lead-leakage-calculator')
            ->where('result', null));

    expect(FunnelEvent::query()
        ->where('event_type', FunnelEvent::TYPE_VISIT)
        ->where('source', 'lead_magnet')
        ->whereJsonContains('meta->offer', 'lead-leakage-calculator')
        ->count())->toBe(1);
});

it('records a bounded lead-magnet form-start event', function () {
    $workspace = User::factory()->create()->workspace;

    $this->get("/lead-magnet/{$workspace->slug}/lead-leakage-calculator/track?event=form_started")
        ->assertNoContent();

    expect(FunnelEvent::query()
        ->where('workspace_id', $workspace->id)
        ->where('event_type', FunnelEvent::TYPE_LEAD_MAGNET_FORM_STARTED)
        ->where('source', 'lead_magnet')
        ->whereJsonContains('meta->offer', 'lead-leakage-calculator')
        ->count())->toBe(1);

    $this->get("/lead-magnet/{$workspace->slug}/lead-leakage-calculator/track?event=unknown")
        ->assertNotFound();
});

it('offers the configured booking flow and records a deduplicated demo request', function () {
    $user = User::factory()->create();
    $schedule = MeetingSchedule::forUser($user);
    $key = (string) Str::uuid();

    $response = $this->post("/lead-magnet/{$user->workspace->slug}/lead-leakage-calculator", [
        'submission_key' => $key,
        'monthly_inquiries' => 10,
        'average_customer_value' => 1000,
        'inquiry_to_customer_rate' => 20,
        'missed_inquiry_rate' => 10,
        'delayed_response_rate' => 10,
        'follow_up_dropoff_rate' => 10,
    ])->assertOk();

    $submission = LeadMagnetSubmission::query()->where('idempotency_key', $key)->firstOrFail();

    $response->assertInertia(fn ($page) => $page->where('offer.demo_url', $schedule->publicUrl()));

    $demoUrl = URL::signedRoute('lead-magnet.demo', [
        'workspace' => $user->workspace->slug,
        'submission' => $submission->id,
    ]);

    $this->get($demoUrl)->assertRedirect();

    $this->get($demoUrl)->assertRedirect();

    $this->get('/book/'.$schedule->slug.'?lead_magnet_submission_id='.$submission->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('lead_magnet_submission_id', null)
            ->where('lead_magnet_booking_url', null));

    expect(FunnelEvent::query()
        ->where('event_type', FunnelEvent::TYPE_DEMO_REQUESTED)
        ->where('subject_id', $submission->id)
        ->count())->toBe(1);
});

it('persists a calculator submission, creates the shared lead, and records separate consent', function () {
    Mail::fake();
    $workspace = User::factory()->create()->workspace;
    $key = (string) Str::uuid();

    $response = $this->post("/lead-magnet/{$workspace->slug}/lead-leakage-calculator", [
        'submission_key' => $key,
        'monthly_inquiries' => 100,
        'average_customer_value' => 1000,
        'inquiry_to_customer_rate' => 20,
        'missed_inquiry_rate' => 10,
        'delayed_response_rate' => 20,
        'follow_up_dropoff_rate' => 25,
        'name' => 'Clinic Atlas',
        'email' => 'owner@clinic-atlas.test',
        'company' => 'Clinic Atlas',
        'marketing_consent' => true,
        'utm_source' => 'test',
    ]);

    $response->assertOk()->assertInertia(fn ($page) => $page
        ->component('public/lead-leakage-calculator')
        ->where('result.total_lost_inquiries', 46)
        ->where('submission.contact_created', true)
        ->where('submission.marketing_consent_recorded', true));

    $submission = LeadMagnetSubmission::query()->where('idempotency_key', $key)->firstOrFail();
    $contact = Contact::query()->where('email', 'owner@clinic-atlas.test')->firstOrFail();

    expect($submission->contact_id)->toBe($contact->id)
        ->and(Lead::query()->where('contact_id', $contact->id)->count())->toBe(1)
        ->and($submission->delivery_status)->toBe('accepted')
        ->and($submission->accepted_at)->not->toBeNull()
        ->and(ContactConsent::query()->where('contact_id', $contact->id)->where('purpose', 'marketing')->value('status'))
        ->toBe(ContactConsent::STATUS_GRANTED)
        ->and(FunnelEvent::query()->where('event_type', FunnelEvent::TYPE_LEAD_MAGNET_SUBMITTED)->count())->toBe(1)
        ->and(FunnelEvent::query()
            ->where('event_type', FunnelEvent::TYPE_LEAD_MAGNET_USED)
            ->where('subject_id', $submission->id)
            ->count())->toBe(1);

    Mail::assertSent(LeadLeakageResultMail::class, fn (LeadLeakageResultMail $mail): bool => $mail->hasTo('owner@clinic-atlas.test'));
});

it('does not expose internal delivery errors through the public calculator contract', function () {
    Queue::fake();
    $workspace = User::factory()->create()->workspace;
    $key = (string) Str::uuid();
    $payload = [
        'submission_key' => $key,
        'monthly_inquiries' => 20,
        'average_customer_value' => 500,
        'inquiry_to_customer_rate' => 10,
        'missed_inquiry_rate' => 5,
        'delayed_response_rate' => 5,
        'follow_up_dropoff_rate' => 5,
        'email' => 'owner@clinic-atlas.test',
    ];

    $this->post("/lead-magnet/{$workspace->slug}/lead-leakage-calculator", $payload)->assertOk();
    $submission = LeadMagnetSubmission::query()->where('idempotency_key', $key)->firstOrFail();
    $submission->forceFill([
        'delivery_status' => 'failed',
        'delivery_error' => 'Authorization: Bearer internal-secret-value',
    ])->save();

    $this->post("/lead-magnet/{$workspace->slug}/lead-leakage-calculator", $payload)
        ->assertInertia(fn ($page) => $page
            ->where('submission.delivery_status', 'failed')
            ->missing('submission.delivery_error'));
});

it('redacts delivery diagnostics before persisting them', function () {
    Queue::fake();
    $workspace = User::factory()->create()->workspace;
    $key = (string) Str::uuid();

    $this->post("/lead-magnet/{$workspace->slug}/lead-leakage-calculator", [
        'submission_key' => $key,
        'monthly_inquiries' => 20,
        'average_customer_value' => 500,
        'inquiry_to_customer_rate' => 10,
        'missed_inquiry_rate' => 5,
        'delayed_response_rate' => 5,
        'follow_up_dropoff_rate' => 5,
        'email' => 'owner@clinic-atlas.test',
    ])->assertOk();

    $submission = LeadMagnetSubmission::query()->where('idempotency_key', $key)->firstOrFail();

    (new DeliverLeadMagnetSubmission($submission->id))->failed(
        new RuntimeException('SMTP failed for owner@clinic.dz at https://smtp.example.com using Authorization: Bearer secret-value'),
    );

    expect($submission->fresh()->delivery_status)->toBe('failed')
        ->and($submission->fresh()->delivery_error)->not->toContain('owner@clinic.dz')
        ->and($submission->fresh()->delivery_error)->not->toContain('https://smtp.example.com')
        ->and($submission->fresh()->delivery_error)->not->toContain('Bearer secret-value');
});

it('does not create a contact for an anonymous calculator use and is idempotent', function () {
    $workspace = User::factory()->create()->workspace;
    $key = (string) Str::uuid();
    $payload = [
        'submission_key' => $key,
        'monthly_inquiries' => 20,
        'average_customer_value' => 500,
        'inquiry_to_customer_rate' => 10,
        'missed_inquiry_rate' => 0,
        'delayed_response_rate' => 0,
        'follow_up_dropoff_rate' => 0,
    ];

    $this->post("/lead-magnet/{$workspace->slug}/lead-leakage-calculator", $payload)->assertOk();
    $this->post("/lead-magnet/{$workspace->slug}/lead-leakage-calculator", $payload)->assertOk();

    expect(LeadMagnetSubmission::query()->where('idempotency_key', $key)->count())->toBe(1)
        ->and(Contact::query()->where('workspace_id', $workspace->id)->count())->toBe(0)
        ->and(FunnelEvent::query()->where('event_type', FunnelEvent::TYPE_LEAD_MAGNET_SUBMITTED)->count())->toBe(1)
        ->and(FunnelEvent::query()->where('event_type', FunnelEvent::TYPE_LEAD_MAGNET_USED)->count())->toBe(1);
});

it('queues permitted public enrichment separately from marketing consent', function () {
    Mail::fake();
    Queue::fake();
    $workspace = User::factory()->create()->workspace;

    $this->post("/lead-magnet/{$workspace->slug}/lead-leakage-calculator", [
        'submission_key' => (string) Str::uuid(),
        'monthly_inquiries' => 20,
        'average_customer_value' => 500,
        'inquiry_to_customer_rate' => 10,
        'missed_inquiry_rate' => 5,
        'delayed_response_rate' => 5,
        'follow_up_dropoff_rate' => 5,
        'email' => 'owner@clinic-atlas.test',
        'enrichment_consent' => true,
        'marketing_consent' => false,
    ])->assertOk();

    $contact = Contact::query()->where('email', 'owner@clinic-atlas.test')->firstOrFail();

    Queue::assertPushed(EnrichRecordJob::class, fn (EnrichRecordJob $job): bool => $job->workspaceId === $workspace->id
        && $job->targetType === 'contact'
        && $job->targetId === $contact->id
    );
});
