<?php

use App\Models\AuditEvent;
use App\Models\Company;
use App\Models\Contact;
use App\Models\ContactConsent;
use App\Models\Message;
use App\Models\RecordRelationship;
use App\Models\Thread;
use App\Models\User;

it('lets an ApiV1 token list contacts in its own workspace', function () {
    $user = User::factory()->create();
    $mine = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Own',
        'email' => 'own@workspace.test',
    ]);
    $foreign = Contact::factory()->create([
        'first_name' => 'Foreign',
        'email' => 'foreign@other.test',
    ]);

    $this->withToken(apiToken($user))
        ->getJson('/api/v1/contacts')
        ->assertOk()
        ->assertJsonPath('data.0.id', $mine->id)
        ->assertJsonMissing(['email' => 'foreign@other.test']);

    expect($foreign->workspace_id)->not->toBe($user->workspace_id);
});

it('cannot read another workspace contact via ApiV1', function () {
    $user = User::factory()->create();
    $foreign = Contact::factory()->create([
        'first_name' => 'Other',
        'email' => 'other@workspace.test',
    ]);

    $this->withToken(apiToken($user))
        ->getJson('/api/v1/contacts/'.$foreign->id)
        ->assertNotFound();
});

it('returns contact attribution, consent, relationships, and a unified timeline', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'source' => 'campaign',
        'source_campaign' => 'ramadan-2026',
    ]);
    ContactConsent::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'purpose' => 'marketing',
        'status' => ContactConsent::STATUS_GRANTED,
        'source' => 'web_form',
        'captured_at' => now(),
    ]);
    RecordRelationship::query()->create([
        'workspace_id' => $user->workspace_id,
        'from_type' => Company::class,
        'from_id' => $company->id,
        'to_type' => Contact::class,
        'to_id' => $contact->id,
        'relationship_type' => 'decision_maker',
    ]);
    $thread = Thread::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel_id' => $user->workspace->channels()->first()->id,
        'status' => 'open',
        'subject' => 'Inbound request',
        'last_message_at' => now(),
    ]);
    Message::query()->create([
        'workspace_id' => $user->workspace_id,
        'thread_id' => $thread->id,
        'contact_id' => $contact->id,
        'direction' => 'inbound',
        'type' => 'text',
        'body' => 'Please send the proposal.',
        'status' => 'received',
        'provider' => 'desk',
    ]);

    $this->withToken(apiToken($user))
        ->getJson('/api/v1/contacts/'.$contact->id)
        ->assertOk()
        ->assertJsonPath('data.source_campaign', 'ramadan-2026')
        ->assertJsonPath('data.consents.0.granted', true)
        ->assertJsonPath('data.relationships.0.relationship_type', 'decision_maker')
        ->assertJsonPath('data.timeline.0.timeline_type', 'inbound_message')
        ->assertJsonPath('data.timeline.0.body', 'Please send the proposal.');
});

it('requires a Sanctum token to list contacts', function () {
    $this->getJson('/api/v1/contacts')->assertUnauthorized();
});

it('upserts contact consent and records the governance audit event', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->withToken(apiToken($user))
        ->postJson('/api/v1/contacts/'.$contact->id.'/consents', [
            'channel' => 'email',
            'purpose' => 'marketing',
            'status' => 'granted',
            'source' => 'web_form',
        ])
        ->assertCreated()
        ->assertJsonPath('data.granted', true)
        ->assertJsonPath('data.status', 'granted');

    $this->withToken(apiToken($user))
        ->postJson('/api/v1/contacts/'.$contact->id.'/consents', [
            'channel' => 'email',
            'purpose' => 'marketing',
            'status' => 'denied',
            'source' => 'unsubscribe',
        ])
        ->assertOk()
        ->assertJsonPath('data.granted', false)
        ->assertJsonPath('data.status', 'denied');

    expect(ContactConsent::query()
        ->where('contact_id', $contact->id)
        ->where('channel', 'email')
        ->where('purpose', 'marketing')
        ->count())->toBe(1);

    expect(AuditEvent::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('action', 'contact.consent_updated')
        ->count())->toBe(2);
});
