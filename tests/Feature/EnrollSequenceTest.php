<?php

use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Sequence;
use App\Models\User;
use App\Services\Outbound\SuppressionService;

it('enrolls a contact on a sequence', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $sequence = Sequence::factory()->create(['workspace_id' => $user->workspace_id, 'channel' => 'email']);

    $this->actingAs($user)
        ->post("/outbound/sequences/{$sequence->id}/enroll", [
            'contact_id' => $contact->id,
        ])
        ->assertRedirect();

    expect(Enrollment::query()->where('sequence_id', $sequence->id)->where('contact_id', $contact->id)->exists())->toBeTrue();
});

it('refuses to enroll a suppressed contact', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'blocked@evotechly.dz',
    ]);
    $sequence = Sequence::factory()->create(['workspace_id' => $user->workspace_id]);

    app(SuppressionService::class)->suppress($user->workspace, 'email', 'blocked@evotechly.dz');

    $this->actingAs($user)
        ->from("/outbound/sequences/{$sequence->id}")
        ->post("/outbound/sequences/{$sequence->id}/enroll", [
            'contact_id' => $contact->id,
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('contact_id');
});
