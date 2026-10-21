<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\FunnelEvent;
use App\Models\Lead;
use App\Models\LeadMagnetOffer;
use App\Models\LeadMagnetSubmission;
use App\Models\MeetingSchedule;
use App\Models\User;
use App\Services\Funnels\ConversionFunnelQuery;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

it('records one lead-magnet attributed meeting-booked event with pipeline links', function () {
    $this->travelTo(Carbon::parse('2026-09-10 08:00:00', 'Africa/Algiers'));
    Mail::fake();

    $user = User::factory()->create();
    $schedule = MeetingSchedule::forUser($user);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'karim@clinic.dz',
    ]);
    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
    ]);
    $offer = LeadMagnetOffer::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('slug', 'lead-leakage-calculator')
        ->firstOrFail();
    $submission = LeadMagnetSubmission::query()->create([
        'workspace_id' => $user->workspace_id,
        'lead_magnet_offer_id' => $offer->id,
        'contact_id' => $contact->id,
        'lead_id' => $lead->id,
        'idempotency_key' => 'booking-test-key',
        'name' => 'Karim Hadj',
        'email' => 'karim@clinic.dz',
        'assumptions' => ['monthly_inquiries' => 10],
        'result' => ['version' => 'lead-leakage-v1'],
    ]);

    $payload = [
        'starts_at' => '2026-09-10T09:00:00+01:00',
        'first_name' => 'Karim',
        'last_name' => 'Hadj',
        'email' => 'karim@clinic.dz',
        'phone' => '0550123456',
        'lead_magnet_submission_id' => $submission->id,
    ];

    $this->post('/book/'.$schedule->slug, $payload)->assertRedirect();
    $this->post('/book/'.$schedule->slug, [...$payload, 'email' => 'other@clinic.dz'])
        ->assertSessionHasErrors('starts_at');

    $activity = Activity::query()->where('type', 'meeting')->sole();
    $event = FunnelEvent::query()
        ->where('event_type', FunnelEvent::TYPE_MEETING_BOOKED)
        ->where('subject_id', $activity->id)
        ->sole();

    expect($event->contact_id)->toBe($contact->id)
        ->and($event->lead_id)->toBe($lead->id)
        ->and($event->source)->toBe('lead_magnet')
        ->and($event->meta['lead_magnet_submission_id'])->toBe($submission->id)
        ->and(FunnelEvent::query()
            ->where('event_type', FunnelEvent::TYPE_MEETING_BOOKED)
            ->count())->toBe(1)
        ->and(app(ConversionFunnelQuery::class)
            ->forFunnel($user->workspace, null, now()->subDay(), now())['kpis']['meetings_booked'])
        ->toBe(1);
});
