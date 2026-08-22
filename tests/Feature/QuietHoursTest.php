<?php

use App\Models\Contact;
use App\Models\QuietHours;
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
