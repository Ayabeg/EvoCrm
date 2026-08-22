<?php

use App\Models\Contact;
use App\Models\Workspace;
use App\Services\Outbound\OutboundDispatcher;
use App\Services\Outbound\SuppressionService;

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

    $this->get('/unsubscribe?email=stop@evotechly.dz&workspace='.$workspace->id)
        ->assertOk();

    expect(app(SuppressionService::class)->isSuppressed($workspace, 'stop@evotechly.dz'))->toBeTrue();
});
