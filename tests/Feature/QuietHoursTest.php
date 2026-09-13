<?php

use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Models\QuietHours;
use App\Models\Sequence;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Outbound\OutboundDispatcher;
use App\Services\Outbound\QuietHoursGuard;
use Illuminate\Support\Carbon;

it('blocks automated outbound during Africa/Algiers quiet hours', function () {
    $workspace = Workspace::factory()->create();
    QuietHours::query()->where('workspace_id', $workspace->id)->update([
        'enabled' => true,
        'timezone' => 'Africa/Algiers',
        'starts_at' => '21:00',
        'ends_at' => '08:00',
    ]);

    $guard = app(QuietHoursGuard::class);
    expect($guard->blocks($workspace, Carbon::parse('2026-08-22 22:30:00', 'Africa/Algiers')))->toBeTrue();
    expect($guard->blocks($workspace, Carbon::parse('2026-08-22 10:00:00', 'Africa/Algiers')))->toBeFalse();

    $this->travelTo(Carbon::parse('2026-08-22 22:15:00', 'Africa/Algiers'));

    $contact = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'email' => 'night@example.dz',
    ]);

    $message = app(OutboundDispatcher::class)->dispatch($workspace, $contact, [
        'channel' => 'email',
        'to_address' => 'night@example.dz',
        'subject' => 'Night',
        'body' => 'Should not send',
    ]);

    expect($message->status)->toBe('failed');
    expect($message->failure_reason)->toContain('quiet hours');
});

it('skips a sequence send during default Africa/Algiers quiet hours', function () {
    $this->travelTo(Carbon::parse('2026-08-23 22:30:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'night-seq@example.dz',
    ]);
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
        'active' => true,
    ]);
    $sequence->steps()->create([
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'subject' => 'Night sequence',
        'body' => 'Should defer',
    ]);
    $enrollment = Enrollment::query()->create([
        'workspace_id' => $user->workspace_id,
        'sequence_id' => $sequence->id,
        'contact_id' => $contact->id,
        'status' => 'active',
        'next_step' => 1,
        'next_run_at' => now()->subMinute(),
    ]);

    $this->artisan('outbound:run')->assertSuccessful();

    expect(OutboundMessage::query()->where('sequence_id', $sequence->id)->count())->toBe(0);
    expect($enrollment->refresh()->status)->toBe('active');
    expect($enrollment->next_run_at->format('H:i'))->toBe('08:00');
});
