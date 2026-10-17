<?php

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Lead;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use App\Support\LeadPath;
use Inertia\Testing\AssertableInertia as Assert;

function pathLead(User $user, array $overrides = []): Lead
{
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Benali',
        'email' => 'amine@example.dz',
        'phone' => '0550123456',
        'owner_id' => $user->id,
        'city' => 'Alger',
        'wilaya' => 'Alger',
    ]);

    return Lead::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $contact->company_id,
        'title' => $overrides['title'] ?? 'Clinic intake',
        'source' => $overrides['source'] ?? 'meta_ads',
        'status' => $overrides['status'] ?? 'new',
        'payload' => $overrides['payload'] ?? null,
    ]);
}

it('exposes Salesforce Path steps and a WhatsApp rail on the lead record', function () {
    $user = User::factory()->create(['name' => 'Alex Smith']);
    $lead = pathLead($user);

    $channel = Channel::query()->firstOrCreate(
        ['workspace_id' => $user->workspace_id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WhatsApp Cloud', 'status' => 'connected'],
    );
    $thread = Thread::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $lead->contact_id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'subject' => 'WhatsApp Cloud',
        'last_message_at' => now(),
    ]);
    Message::query()->create([
        'workspace_id' => $user->workspace_id,
        'thread_id' => $thread->id,
        'contact_id' => $lead->contact_id,
        'direction' => 'inbound',
        'type' => 'text',
        'body' => 'Salaam, still interested',
        'status' => 'received',
        'provider' => 'evolution_cloud',
    ]);

    $this->actingAs($user)
        ->get("/crm/leads/{$lead->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('crm/leads/show')
            ->where('path.current', 'new')
            ->where('path.next', 'contacted')
            ->where('path.complete', false)
            ->where('path.steps.0.label', 'New')
            ->where('path.steps.1.label', 'Contacted')
            ->where('path.steps.2.label', 'Nurturing')
            ->where('path.steps.3.label', 'Unqualified')
            ->where('path.steps.4.label', 'Converted')
            ->where('whatsapp.thread_id', $thread->id)
            ->where('whatsapp.last_message', 'Salaam, still interested')
            ->has('members')
        );
});

it('maps Path steps onto existing lead statuses and stores the working sub-step', function () {
    $user = User::factory()->create();
    $lead = pathLead($user);

    $this->actingAs($user)
        ->from("/crm/leads/{$lead->id}")
        ->put("/crm/leads/{$lead->id}", ['path_step' => 'contacted'])
        ->assertRedirect("/crm/leads/{$lead->id}");

    expect($lead->fresh()->status)->toBe('working')
        ->and($lead->fresh()->payload['path_step'])->toBe('contacted')
        ->and(LeadPath::current($lead->fresh()))->toBe('contacted');

    $this->actingAs($user)
        ->put("/crm/leads/{$lead->id}", ['path_step' => 'nurturing'])
        ->assertRedirect();

    expect($lead->fresh()->status)->toBe('working')
        ->and(LeadPath::current($lead->fresh()))->toBe('nurturing');

    $this->actingAs($user)
        ->put("/crm/leads/{$lead->id}", ['path_step' => 'unqualified'])
        ->assertRedirect();

    expect($lead->fresh()->status)->toBe('disqualified')
        ->and(LeadPath::current($lead->fresh()))->toBe('unqualified');
});

it('rejects Converted as a Path PATCH so conversion stays on the qualify dialog', function () {
    $user = User::factory()->create();
    $lead = pathLead($user);

    $this->actingAs($user)
        ->put("/crm/leads/{$lead->id}", ['path_step' => 'converted'])
        ->assertSessionHasErrors('path_step');

    expect($lead->fresh()->status)->toBe('new');

    $this->actingAs($user)
        ->put("/crm/leads/{$lead->id}", ['status' => 'qualified'])
        ->assertSessionHasErrors('status');
});

it('changes the linked contact owner from the lead record', function () {
    $user = User::factory()->create(['name' => 'Alex Smith']);
    $assignee = User::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'John Smith',
    ]);
    $lead = pathLead($user);

    $this->actingAs($user)
        ->from("/crm/leads/{$lead->id}")
        ->put("/crm/leads/{$lead->id}", ['owner_id' => $assignee->id])
        ->assertRedirect("/crm/leads/{$lead->id}");

    expect($lead->contact->fresh()->owner_id)->toBe($assignee->id);
});

it('saves a single lead field without requiring the full form', function () {
    $user = User::factory()->create();
    $lead = pathLead($user, ['title' => 'Clinic intake']);

    $this->actingAs($user)
        ->put("/crm/leads/{$lead->id}", [
            'source' => 'whatsapp_cloud',
            'source_detail' => 'algiers-clinic',
            'source_campaign' => 'ramadan-2026',
            'source_medium' => 'whatsapp',
        ])
        ->assertRedirect();

    expect($lead->fresh()->title)->toBe('Clinic intake')
        ->and($lead->fresh()->source)->toBe('whatsapp_cloud')
        ->and($lead->fresh()->source_detail)->toBe('algiers-clinic')
        ->and($lead->fresh()->source_campaign)->toBe('ramadan-2026')
        ->and($lead->fresh()->source_medium)->toBe('whatsapp');
});

it('does not render Slack chrome on the lead record', function () {
    $show = file_get_contents(resource_path('js/pages/crm/leads/show.tsx'));
    $path = file_get_contents(resource_path('js/components/crm/record-path.tsx'));
    $dialog = file_get_contents(resource_path('js/components/crm/lead-conversion-dialog.tsx'));
    $owner = file_get_contents(resource_path('js/components/crm/lead-owner-dialog.tsx'));
    $edit = file_get_contents(resource_path('js/components/crm/lead-edit-dialog.tsx'));

    expect($show)->toContain('RecordPath')
        ->and($show)->toContain('LeadConversionDialog')
        ->and($show)->toContain('LeadOwnerDialog')
        ->and($show)->toContain('LeadEditDialog')
        ->and($show)->toContain('WhatsApp')
        ->and($show)->toContain('Desk')
        ->and($show)->toContain('About')
        ->and($show)->toContain('Get in Touch')
        ->and($show)->not->toContain('Slack')
        ->and($path)->toContain('Mark Status as Complete')
        ->and($dialog)->toContain('Convert')
        ->and($dialog)->not->toContain('>Qualify<')
        ->and($owner)->toContain('Change Owner')
        ->and($edit)->toContain('Edit');
});
