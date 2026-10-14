<?php

use App\Enums\ChannelType;
use App\Enums\WorkspaceRole;
use App\Models\Channel;
use App\Models\Company;
use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\Message;
use App\Models\SavedFilter;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Support\Facades\File;

function wave3GapChannel(User $user): Channel
{
    return Channel::query()->firstOrCreate(
        ['workspace_id' => $user->workspace_id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WhatsApp Cloud', 'status' => 'connected'],
    );
}

function wave3GapThread(User $user, array $overrides = []): Thread
{
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $user->id,
        'first_name' => $overrides['first_name'] ?? 'Amel',
        'last_name' => $overrides['last_name'] ?? 'Hadj',
    ]);

    return Thread::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel_id' => $overrides['channel_id'] ?? wave3GapChannel($user)->id,
        'status' => $overrides['status'] ?? 'open',
        'subject' => $overrides['subject'] ?? 'Clinic quote',
        'last_message_at' => $overrides['last_message_at'] ?? now(),
    ]);
}

it('locks Desk Inbox Inertia imports to @inertiajs/react and excludes test harnesses', function () {
    $inbox = File::get(resource_path('js/pages/desk/inbox.tsx'));
    $composer = File::get(resource_path('js/evo/inbox/Composer.tsx'));
    $chrome = File::get(resource_path('js/components/crm/inbox-chrome.tsx'));
    $conversations = File::get(resource_path('js/pages/crm/conversations.tsx'));

    foreach ([$inbox, $composer, $chrome, $conversations] as $source) {
        expect($source)->not->toContain('@inertiajs/inertia-react')
            ->and($source)->not->toContain('@inertiajs/inertia')
            ->and($source)->not->toContain("from 'inertia'")
            ->and($source)->not->toContain('tests/js/p13-inbox-workspace')
            ->and($source)->not->toContain('tests/js/p14-inbox-crm-context')
            ->and($source)->not->toContain("from '@/tests/");
    }

    expect($inbox)->toContain("from '@inertiajs/react'")
        ->and($composer)->toContain("from '@inertiajs/react'")
        ->and($inbox)->toContain('Form')
        ->and($composer)->toContain('Form');
});

it('does not select a foreign thread while listing the current workspace inbox', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $own = wave3GapThread($user, ['subject' => 'Own clinic thread']);
    $foreign = wave3GapThread($other, ['subject' => 'PRIVATE FOREIGN THREAD']);

    $this->actingAs($user)
        ->get('/inbox?thread='.$foreign->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('selected', null)
            ->has('threads', 1)
            ->where('threads.0.id', $own->id)
            ->where('threads.0.subject', 'Own clinic thread')
        );

    $this->actingAs($user)
        ->from('/inbox?thread='.$own->id)
        ->post('/desk/threads/'.$foreign->id.'/reply', ['body' => 'Cross-workspace write'])
        ->assertNotFound();

    expect(Message::query()->where('thread_id', $foreign->id)->count())->toBe(0);
});

it('refuses Desk reply when the member lacks desk.manage', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $thread = wave3GapThread($owner);

    $this->actingAs($member)
        ->from('/inbox?thread='.$thread->id)
        ->post('/desk/threads/'.$thread->id.'/reply', ['body' => 'Unauthorized desk write'])
        ->assertForbidden();

    expect(Message::query()->where('thread_id', $thread->id)->count())->toBe(0);
});

it('returns saved company attributes on the company show page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'company',
            'key' => 'opened_on',
            'label' => 'Opened on',
            'type' => 'date',
            'group' => 'About',
            'required' => '0',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'company',
            'key' => 'sector',
            'label' => 'Sector',
            'type' => 'list',
            'group' => 'About',
            'options' => 'santé, retail',
        ])
        ->assertRedirect();

    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinic Atlas',
    ]);

    $this->actingAs($user)
        ->put("/crm/companies/{$company->id}/attributes", [
            'attributes' => [
                'opened_on' => '2026-03-15',
                'sector' => 'santé',
            ],
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->get("/crm/companies/{$company->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/companies/show')
            ->where('attributes.values.opened_on', '2026-03-15')
            ->where('attributes.values.sector', 'santé')
            ->has('attributes.definitions', 2)
            ->where('attributes.definitions.0.group', 'About')
            ->where('attributes.definitions.0.type', 'date')
            ->where('attributes.definitions.1.type', 'list')
            ->where('attributes.definitions.1.options', ['santé', 'retail'])
        );
});

it('rejects invalid date and list company attributes without persisting them', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'company',
            'key' => 'opened_on',
            'label' => 'Opened on',
            'type' => 'date',
            'required' => '0',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'company',
            'key' => 'sector',
            'label' => 'Sector',
            'type' => 'list',
            'options' => 'santé, retail',
        ])
        ->assertRedirect();

    $date = CustomAttributeDefinition::query()->where('key', 'opened_on')->firstOrFail();
    $list = CustomAttributeDefinition::query()->where('key', 'sector')->firstOrFail();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->from("/crm/companies/{$company->id}")
        ->put("/crm/companies/{$company->id}/attributes", [
            'attributes' => ['opened_on' => '15/03/2026'],
        ])
        ->assertRedirect("/crm/companies/{$company->id}")
        ->assertSessionHasErrors('attributes.opened_on');

    $this->actingAs($user)
        ->from("/crm/companies/{$company->id}")
        ->put("/crm/companies/{$company->id}/attributes", [
            'attributes' => ['sector' => 'unknown'],
        ])
        ->assertRedirect("/crm/companies/{$company->id}")
        ->assertSessionHasErrors('attributes.sector');

    expect(CustomAttributeValue::query()
        ->whereIn('definition_id', [$date->id, $list->id])
        ->where('entity_id', $company->id)
        ->exists())->toBeFalse();
});

it('forbids company attribute updates for members without crm.edit', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);

    $this->actingAs($owner)
        ->post('/settings/attributes', [
            'entity' => 'company',
            'key' => 'beds',
            'label' => 'Beds',
            'type' => 'number',
            'required' => '0',
        ])
        ->assertRedirect();

    $definition = CustomAttributeDefinition::query()->where('key', 'beds')->firstOrFail();
    $company = Company::factory()->create(['workspace_id' => $owner->workspace_id]);

    $this->actingAs($member)
        ->put("/crm/companies/{$company->id}/attributes", [
            'attributes' => ['beds' => '12'],
        ])
        ->assertForbidden();

    expect(CustomAttributeValue::query()
        ->where('definition_id', $definition->id)
        ->where('entity_id', $company->id)
        ->exists())->toBeFalse();
});

it('persists company attributes through the main company update route', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/settings/attributes', [
            'entity' => 'company',
            'key' => 'beds',
            'label' => 'Beds',
            'type' => 'number',
            'required' => '0',
        ])
        ->assertRedirect();

    $definition = CustomAttributeDefinition::query()->where('key', 'beds')->firstOrFail();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinic Atlas',
    ]);

    $this->actingAs($user)
        ->from("/crm/companies/{$company->id}")
        ->put("/crm/companies/{$company->id}", [
            'name' => 'Clinic Atlas',
            'attributes' => ['beds' => '8'],
        ])
        ->assertRedirect();

    expect(CustomAttributeValue::query()
        ->where('definition_id', $definition->id)
        ->where('entity_type', 'company')
        ->where('entity_id', $company->id)
        ->value('value'))->toBe('8');
});

it('applies a saved Contacts filter through filter_id URL state', function () {
    $user = User::factory()->create();
    $kept = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amel',
        'city' => 'Alger',
        'wilaya' => 'Alger',
    ]);
    Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Karim',
        'city' => 'Oran',
        'wilaya' => 'Oran',
    ]);

    $this->actingAs($user)
        ->from('/crm/contacts')
        ->post('/crm/filters', [
            'name' => 'Alger clinics',
            'entity' => 'contact',
            'city' => 'Alger',
        ])
        ->assertRedirect();

    $saved = SavedFilter::query()->where('name', 'Alger clinics')->firstOrFail();

    $this->actingAs($user)
        ->get('/crm/contacts?filter_id='.$saved->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->has('contacts', 1)
            ->where('contacts.0.id', $kept->id)
            ->where('activeFilters.filter_id', $saved->id)
            ->where('activeFilters.city', 'Alger')
        );
});

it('keeps Contacts list chrome off the broken tablecn module and on shared overflow', function () {
    $contacts = File::get(resource_path('js/pages/crm/contacts/index.tsx'));
    $shell = File::get(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = File::get(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $keys = File::get(resource_path('js/lib/list-query/keys.ts'));

    expect($contacts)->toContain('CrmListShell')
        ->and($contacts)->toContain('resultMode="shared-table"')
        ->and($contacts)->toContain('data-crm="contacts-workspace"')
        ->and($contacts)->not->toContain('crm-list/tablecn')
        ->and($contacts)->not->toContain('data-contact-tablecn');

    expect(File::get(resource_path('css/approved-v02.css')))
        ->not->toContain('data-contact-tablecn')
        ->not->toContain("[data-tablecn='data-table']");

    expect($shell)->toContain('DataWorkspace')
        ->and($workspace)->toContain('PAGE_OVERFLOW_CLASS')
        ->and($keys)->toContain("'sort'")
        ->and($keys)->toContain("'direction'");
});
