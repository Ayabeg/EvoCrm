<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\ContactConsent;
use App\Models\Sequence;
use App\Models\User;
use App\Services\Outbound\SequenceEnrollment;
use Illuminate\Validation\ValidationException;

it('records consent from the contact record and exposes the saved state', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->from("/crm/contacts/{$contact->id}")
        ->post("/crm/contacts/{$contact->id}/consent", [
            'channel' => 'email',
            'purpose' => 'marketing',
            'status' => 'granted',
            'source' => 'website form',
            'expires_at' => '2027-01-01',
        ])
        ->assertRedirect("/crm/contacts/{$contact->id}");

    $consent = ContactConsent::query()
        ->where('contact_id', $contact->id)
        ->where('channel', 'email')
        ->first();

    expect($consent)->not->toBeNull()
        ->and($consent->isGranted())->toBeTrue()
        ->and($consent->source)->toBe('website form')
        ->and(Activity::query()->where('contact_id', $contact->id)->where('type', 'consent_updated')->exists())->toBeTrue();

    $this->actingAs($user)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/show')
            ->where('consents.0.channel', 'email')
            ->where('consents.0.source', 'website form')
            ->where('consents.0.granted', true)
        );
});

it('blocks automated marketing enrollment after an explicit denial', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    ContactConsent::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'purpose' => 'marketing',
        'status' => ContactConsent::STATUS_DENIED,
        'revoked_at' => now(),
    ]);
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
    ]);

    expect(fn () => app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact))
        ->toThrow(ValidationException::class);
});

it('supports consent-aware contact and segment filtering', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $granted = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'email' => 'granted@example.test',
    ]);
    $denied = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'email' => 'denied@example.test',
    ]);
    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'email' => 'unknown@example.test',
    ]);

    ContactConsent::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $granted->id,
        'channel' => 'email',
        'purpose' => 'marketing',
        'status' => ContactConsent::STATUS_GRANTED,
    ]);
    ContactConsent::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $denied->id,
        'channel' => 'email',
        'purpose' => 'marketing',
        'status' => ContactConsent::STATUS_DENIED,
    ]);

    $this->actingAs($user)
        ->postJson('/crm/segments/preview', [
            'entity' => 'contact',
            'filters' => ['marketing_consent' => 'granted'],
        ])
        ->assertOk()
        ->assertJson(['count' => 1])
        ->assertJsonPath('members.0.detail', 'granted@example.test');

    $filterGroups = urlencode(json_encode([
        'logic' => 'and',
        'groups' => [[
            'logic' => 'and',
            'rules' => [[
                'field' => 'marketing_consent',
                'operator' => 'eq',
                'value' => 'unknown',
            ]],
        ]],
    ]));

    $this->actingAs($user)
        ->get('/crm/contacts?filter_groups='.$filterGroups)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('recordCount', 1)
            ->where('contacts.0.email', 'unknown@example.test')
            ->where('listView.filterFields', fn ($fields) => collect($fields)->contains(
                fn ($field) => ($field['id'] ?? '') === 'marketing_consent'
                    && ($field['options'] ?? []) === ['granted', 'denied', 'unknown']
            ))
        );
});
