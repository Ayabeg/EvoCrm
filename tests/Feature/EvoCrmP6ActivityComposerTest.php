<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\User;

it('exposes the Salesforce icon composer and HubSpot log-call fields', function () {
    $composer = file_get_contents(resource_path('js/components/crm/activity-composer.tsx'));
    $chrome = file_get_contents(resource_path('js/components/crm/record-chrome.tsx'));
    $panel = file_get_contents(resource_path('js/components/crm/record-activity-panel.tsx'));
    $controller = file_get_contents(app_path('Http/Controllers/Crm/ActivityController.php'));

    expect($composer)->toContain('activity-composer')
        ->and($composer)->toContain("label: 'Email'")
        ->and($composer)->toContain("label: 'Call'")
        ->and($composer)->toContain("label: 'Task'")
        ->and($composer)->toContain("label: 'Event'")
        ->and($composer)->toContain('Left voicemail')
        ->and($composer)->toContain('name="outcome"')
        ->and($composer)->toContain('name="direction"')
        ->and($composer)->toContain('name="logged_at"')
        ->and($composer)->toContain('Log call')
        ->and($chrome)->toContain('LogCallForm')
        ->and($panel)->toContain('ActivityComposer')
        ->and($controller)->toContain('outcome')
        ->and($controller)->toContain('direction')
        ->and($controller)->toContain('logged_at');
});

it('logs a call with outcome and direction onto the contact timeline', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->post('/crm/activities', [
            'type' => 'call',
            'outcome' => 'Left voicemail',
            'direction' => 'outbound',
            'logged_at' => now('Africa/Algiers')->toDateTimeString(),
            'body' => 'Tried twice',
            'contact_id' => $contact->id,
        ])
        ->assertRedirect();

    $call = Activity::query()->where('contact_id', $contact->id)->where('type', 'call')->first();

    expect($call)->not->toBeNull()
        ->and($call->meta['outcome'])->toBe('Left voicemail')
        ->and($call->meta['direction'])->toBe('outbound')
        ->and($call->body)->toBe('Tried twice')
        ->and($call->subject)->toContain('Left voicemail');
});
