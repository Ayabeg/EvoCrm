<?php

use App\Jobs\DeliverLeadMagnetSubmission;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\FunnelEvent;
use App\Models\Lead;
use App\Models\LeadMagnetSubmission;
use App\Models\MeetingSchedule;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

it('carries a lead-magnet visitor through CRM creation, booking, and funnel analytics', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();
    Queue::fake();

    $user = User::factory()->create();
    $schedule = MeetingSchedule::forUser($user);
    $key = (string) Str::uuid();

    $this->post("/lead-magnet/{$user->workspace->slug}/lead-leakage-calculator", [
        'submission_key' => $key,
        'monthly_inquiries' => 100,
        'average_customer_value' => 1000,
        'inquiry_to_customer_rate' => 20,
        'missed_inquiry_rate' => 10,
        'delayed_response_rate' => 20,
        'follow_up_dropoff_rate' => 25,
        'name' => 'Karim Hadj',
        'email' => 'karim@clinic.dz',
        'company' => 'Clinic Atlas',
    ])->assertOk();

    $submission = LeadMagnetSubmission::query()
        ->where('idempotency_key', $key)
        ->firstOrFail();
    $contact = Contact::query()->where('email', 'karim@clinic.dz')->firstOrFail();

    expect($submission->contact_id)->toBe($contact->id)
        ->and($submission->lead_id)->not->toBeNull()
        ->and(Lead::query()->whereKey($submission->lead_id)->exists())->toBeTrue();

    Queue::assertPushed(DeliverLeadMagnetSubmission::class);

    $this->get(URL::signedRoute('lead-magnet.demo', [
        'workspace' => $user->workspace->slug,
        'submission' => $submission->id,
    ]))->assertRedirect();

    $this->post(URL::signedRoute('meetings.public.show', [
        'slug' => $schedule->slug,
        'lead_magnet_submission_id' => $submission->id,
    ]), [
        'starts_at' => '2026-09-10T09:00:00+01:00',
        'first_name' => 'Karim',
        'last_name' => 'Hadj',
        'email' => 'karim@clinic.dz',
        'phone' => '0550123456',
        'lead_magnet_submission_id' => $submission->id,
    ])->assertRedirect();

    $meeting = Activity::query()->where('type', 'meeting')->sole();

    expect(FunnelEvent::query()
        ->where('event_type', FunnelEvent::TYPE_LEAD_MAGNET_SUBMITTED)
        ->where('subject_id', $submission->id)
        ->count())->toBe(1)
        ->and(FunnelEvent::query()
            ->where('event_type', FunnelEvent::TYPE_DEMO_REQUESTED)
            ->where('subject_id', $submission->id)
            ->count())->toBe(1)
        ->and(FunnelEvent::query()
            ->where('event_type', FunnelEvent::TYPE_MEETING_BOOKED)
            ->where('subject_id', $meeting->id)
            ->where('source', 'lead_magnet')
            ->count())->toBe(1);
});
