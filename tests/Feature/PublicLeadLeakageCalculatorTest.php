<?php

use App\Mail\LeadLeakageResultMail;
use App\Models\Contact;
use App\Models\ContactConsent;
use App\Models\FunnelEvent;
use App\Models\Lead;
use App\Models\LeadMagnetSubmission;
use App\Models\MeetingSchedule;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

it('renders the workspace lead leakage calculator publicly', function () {
    $workspace = User::factory()->create()->workspace;

    $this->get("/lead-magnet/{$workspace->slug}/lead-leakage-calculator")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/lead-leakage-calculator')
            ->where('offer.slug', 'lead-leakage-calculator')
            ->where('result', null));
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

    $this->get(route('lead-magnet.demo', [
        'workspace' => $user->workspace->slug,
        'submission' => $submission->id,
    ]))->assertRedirect(route('meetings.public.show', $schedule->slug));

    $this->get(route('lead-magnet.demo', [
        'workspace' => $user->workspace->slug,
        'submission' => $submission->id,
    ]))->assertRedirect(route('meetings.public.show', $schedule->slug));

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
        ->and(FunnelEvent::query()->where('event_type', FunnelEvent::TYPE_LEAD_MAGNET_SUBMITTED)->count())->toBe(1);

    Mail::assertSent(LeadLeakageResultMail::class, fn (LeadLeakageResultMail $mail): bool => $mail->hasTo('owner@clinic-atlas.test'));
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
        ->and(FunnelEvent::query()->where('event_type', FunnelEvent::TYPE_LEAD_MAGNET_SUBMITTED)->count())->toBe(1);
});
