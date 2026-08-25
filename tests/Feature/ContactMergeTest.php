<?php

use App\Enums\ChannelType;
use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Lead;
use App\Models\Message;
use App\Models\Sequence;
use App\Models\Thread;
use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;

function seedMergeWorkspace(User $user): void
{
    app(WorkspaceProvisioner::class)->seedDefaults($user->workspace);
}

it('blocks members without merge permission from duplicate review', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);

    $this->actingAs($member)->get('/crm/contacts/duplicates')->assertForbidden();
    $this->actingAs($member)
        ->post('/crm/contacts/merge', [
            'survivor_id' => 1,
            'absorbed_id' => 2,
        ])
        ->assertForbidden();
});

it('groups duplicate contacts by shared email or phone', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'first_name' => 'Amine',
        'email' => 'amine@example.test',
        'phone' => '0550123456',
    ]);
    Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'first_name' => 'A.',
        'email' => 'amine@example.test',
        'phone' => '0550000001',
    ]);
    Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'first_name' => 'Sara',
        'email' => 'sara@example.test',
        'phone' => '0550987654',
    ]);

    $this->actingAs($owner)
        ->get('/crm/contacts/duplicates')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/duplicates')
            ->has('groups', 1)
            ->where('groups.0.contacts', fn ($contacts) => count($contacts) === 2));
});

it('merges a duplicate into the survivor and keeps associations', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    seedMergeWorkspace($owner);
    $workspace = $owner->workspace;

    $survivor = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'first_name' => 'Amine',
        'last_name' => 'Benali',
        'email' => 'amine@example.test',
        'phone' => '0550123456',
        'city' => 'Algiers',
    ]);
    $absorbed = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'first_name' => 'A.',
        'last_name' => 'B.',
        'email' => 'amine.old@example.test',
        'phone' => '0550000099',
        'city' => 'Oran',
        'external_id' => '101',
    ]);

    $pipeline = $workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $absorbed->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Rebuild',
        'amount_cents' => 100000,
        'currency' => 'DZD',
    ]);
    $lead = Lead::factory()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $absorbed->id,
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'note',
        'subject' => 'Called yesterday',
        'contact_id' => $absorbed->id,
    ]);
    $channel = Channel::query()->firstOrCreate(
        ['workspace_id' => $workspace->id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WhatsApp Cloud', 'status' => 'connected'],
    );
    $thread = Thread::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $absorbed->id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'subject' => 'WhatsApp',
    ]);
    $message = Message::query()->create([
        'workspace_id' => $workspace->id,
        'thread_id' => $thread->id,
        'contact_id' => $absorbed->id,
        'direction' => 'inbound',
        'type' => 'text',
        'body' => 'Hello',
        'status' => 'received',
    ]);
    $sequence = Sequence::factory()->create(['workspace_id' => $workspace->id]);
    $enrollment = Enrollment::query()->create([
        'workspace_id' => $workspace->id,
        'sequence_id' => $sequence->id,
        'contact_id' => $absorbed->id,
        'status' => 'active',
        'next_step' => 1,
    ]);
    $definition = CustomAttributeDefinition::query()->create([
        'workspace_id' => $workspace->id,
        'entity' => 'contact',
        'key' => 'segment',
        'label' => 'Segment',
        'type' => 'text',
    ]);
    CustomAttributeValue::query()->create([
        'workspace_id' => $workspace->id,
        'definition_id' => $definition->id,
        'entity_type' => 'contact',
        'entity_id' => $absorbed->id,
        'value' => 'Enterprise',
    ]);

    $this->actingAs($owner)
        ->post('/crm/contacts/merge', [
            'survivor_id' => $survivor->id,
            'absorbed_id' => $absorbed->id,
            'values' => [
                'first_name' => $survivor->first_name,
                'last_name' => $survivor->last_name,
                'email' => $survivor->email,
                'phone' => $absorbed->phone,
                'city' => $absorbed->city,
                'external_id' => $absorbed->external_id,
            ],
        ])
        ->assertRedirect();

    expect(Contact::query()->find($absorbed->id))->toBeNull()
        ->and($survivor->fresh()->phone_e164)->toBe('+213550000099')
        ->and($survivor->fresh()->city)->toBe('Oran')
        ->and($survivor->fresh()->external_id)->toBe('101')
        ->and($deal->fresh()->contact_id)->toBe($survivor->id)
        ->and($lead->fresh()->contact_id)->toBe($survivor->id)
        ->and($thread->fresh()->contact_id)->toBe($survivor->id)
        ->and($message->fresh()->contact_id)->toBe($survivor->id)
        ->and($enrollment->fresh()->contact_id)->toBe($survivor->id)
        ->and(Activity::query()->where('contact_id', $survivor->id)->where('subject', 'Called yesterday')->exists())->toBeTrue()
        ->and(CustomAttributeValue::query()
            ->where('entity_type', 'contact')
            ->where('entity_id', $survivor->id)
            ->value('value'))->toBe('Enterprise')
        ->and(Activity::query()
            ->where('contact_id', $survivor->id)
            ->where('type', 'merge')
            ->exists())->toBeTrue();
});

it('rejects merging contacts from another workspace', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $other = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $survivor = Contact::factory()->create(['workspace_id' => $owner->workspace_id]);
    $absorbed = Contact::factory()->create(['workspace_id' => $other->workspace_id]);

    $this->actingAs($owner)
        ->post('/crm/contacts/merge', [
            'survivor_id' => $survivor->id,
            'absorbed_id' => $absorbed->id,
            'values' => ['first_name' => $survivor->first_name],
        ])
        ->assertNotFound();

    expect(Contact::query()->find($absorbed->id))->not->toBeNull();
});
