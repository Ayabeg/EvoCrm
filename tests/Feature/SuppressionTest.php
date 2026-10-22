<?php

use App\Models\Contact;
use App\Models\Workspace;
use App\Services\Outbound\OutboundDispatcher;
use App\Services\Outbound\SuppressionService;
use Illuminate\Support\Facades\URL;

it('blocks outbound when the recipient is suppressed', function () {
    $workspace = Workspace::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'email' => 'optout@example.dz',
        'phone' => '0550000001',
    ]);

    app(SuppressionService::class)->suppress($workspace, 'email', 'optout@example.dz');

    $message = app(OutboundDispatcher::class)->dispatch($workspace, $contact, [
        'channel' => 'email',
        'to_address' => 'optout@example.dz',
        'subject' => 'Hello',
        'body' => 'Please ignore',
    ]);

    expect($message->status)->toBe('failed');
    expect($message->failure_reason)->toContain('suppression');
});

it('writes suppression from the public unsubscribe URL', function () {
    $workspace = Workspace::factory()->create();
    $url = URL::signedRoute('unsubscribe', [
        'email' => 'stop@evotechly.dz',
        'workspace' => $workspace->id,
    ]);

    $this->get($url)
        ->assertOk();

    expect(app(SuppressionService::class)->isSuppressed($workspace, 'stop@evotechly.dz'))->toBeFalse();

    $this->post($url)
        ->assertOk();

    expect(app(SuppressionService::class)->isSuppressed($workspace, 'stop@evotechly.dz'))->toBeTrue();
});

it('rejects tampered unsubscribe workspace or address parameters', function () {
    $workspace = Workspace::factory()->create();
    $other = Workspace::factory()->create();
    $url = URL::signedRoute('unsubscribe', [
        'email' => 'stop@evotechly.dz',
        'workspace' => $workspace->id,
    ]);

    $this->get($url.'&workspace='.$other->id)->assertForbidden();

    expect(app(SuppressionService::class)->isSuppressed($workspace, 'stop@evotechly.dz'))->toBeFalse()
        ->and(app(SuppressionService::class)->isSuppressed($other, 'stop@evotechly.dz'))->toBeFalse();
});
