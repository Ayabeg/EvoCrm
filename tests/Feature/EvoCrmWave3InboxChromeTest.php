<?php

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Support\Facades\Http;

it('rebuilds the inbox as HubSpot-dense chrome around the Desk embed', function () {
    $inbox = file_get_contents(resource_path('js/pages/desk/inbox.tsx'));
    $chrome = file_get_contents(resource_path('js/components/crm/inbox-chrome.tsx'))
        .file_get_contents(resource_path('js/evo/inbox/QueueNavigation.tsx'));
    $shell = file_get_contents(resource_path('js/components/crm/desk-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/components/crm/adaptive-workspace-shell.tsx'));

    expect($inbox)->toContain('data-crm="inbox-workspace"')
        ->and($inbox)->toContain('DeskShell')
        ->and($inbox)->toContain('AdaptiveWorkspaceShell')
        ->and($inbox)->toContain('InboxFolderRail')
        ->and($inbox)->toContain('InboxContactSidebar')
        ->and($inbox)->toContain('InboxEmbedSkeleton')
        ->and($inbox)->toContain('EvoDesk inbox')
        ->and($inbox)->toContain("You're all caught up")
        ->and($inbox)->toContain('No conversations')
        ->and($inbox)->toContain('Select a conversation')
        ->and($inbox)->toContain('Open ticket')
        ->and($inbox)->toContain('Assigned to me')
        ->and($inbox)->toContain('All open')
        ->and($inbox)->toContain('Continue in CRM inbox')
        ->and($inbox)->toContain('officialConnectors')
        ->and($inbox)->not->toContain('HubSpot')
        ->and($inbox)->not->toContain('Breeze')
        ->and($inbox)->not->toContain('Copilot')
        ->and($inbox)->not->toContain('Unknown Contact')
        ->and($inbox)->not->toContain('#00A4BD')
        ->and($inbox)->not->toContain('#0176D3');

    expect($chrome)->toContain('Inbox folders')
        ->and($chrome)->toContain('No owner')
        ->and($chrome)->not->toContain('#00A4BD')
        ->and($chrome)->not->toContain('#0176D3');

    expect($shell)->toContain('title="Inbox"')
        ->and($shell)->toContain("label: 'Inbox'");

    expect($workspace)->toContain('desktopGridClassName')
        ->and($workspace)->toContain('px-4 py-3');
});

it('rebuilds conversation history as a native inbox list on the same chrome', function () {
    $conversations = file_get_contents(resource_path('js/pages/crm/conversations.tsx'));

    expect($conversations)->toContain('data-crm="conversations-workspace"')
        ->and($conversations)->toContain('DeskShell')
        ->and($conversations)->toContain('EmptyState')
        ->and($conversations)->toContain('No conversation history')
        ->and($conversations)->toContain("You're all caught up")
        ->and($conversations)->toContain('Open inbox')
        ->and($conversations)->toContain('InboxContactSidebar')
        ->and($conversations)->not->toContain('max-w-6xl')
        ->and($conversations)->not->toContain("from '@/components/ui/card'")
        ->and($conversations)->not->toContain('HubSpot')
        ->and($conversations)->not->toContain('#00A4BD')
        ->and($conversations)->not->toContain('#0176D3');
});

it('serves the Desk embed on the CRM host and keeps CSP frame-ancestors', function () {
    Http::fake(['*' => Http::response('', 200)]);

    $framed = User::factory()->create();
    $framed->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    $ok = $this->actingAs($framed)->get('/inbox');
    $ok->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('embedUrl', 'https://desk.evotechly.com/')
            ->where('embedState', 'ok')
            ->has('officialConnectors')
            ->has('channels', 4)
            ->has('threads')
        );

    $csp = (string) $ok->headers->get('Content-Security-Policy');
    expect($csp)->toContain('frame-ancestors')
        ->and($csp)->toContain('https://evocrmapp.com')
        ->and($csp)->toContain('https://www.evocrmapp.com')
        ->and($csp)->toContain('https://crm.evotechly.com')
        ->and($csp)->toContain('frame-src')
        ->and($csp)->toContain('https://desk.evotechly.com');
});

it('falls back to native inbox chrome when the desk refuses framing', function () {
    Http::fake(['*' => Http::response('', 200, ['X-Frame-Options' => 'SAMEORIGIN'])]);

    $blocked = User::factory()->create();
    $blocked->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    $this->actingAs($blocked)
        ->get('/inbox')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('embedUrl', null)
            ->where('embedState', 'blocked')
            ->has('embedReason')
            ->has('threads')
        );
});

it('serves native thread chrome and conversation history when Desk is not framed', function () {
    config()->set('evosales.inbox_url', '');

    $native = User::factory()->create();
    $native->workspace->update(['inbox_url' => null]);
    $contact = Contact::factory()->create([
        'workspace_id' => $native->workspace_id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
        'owner_id' => $native->id,
        'email' => 'amel@clinique-hadj.dz',
        'phone_e164' => '+213555000111',
    ]);
    $channel = Channel::query()->firstOrCreate(
        ['workspace_id' => $native->workspace_id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WhatsApp Cloud', 'status' => 'connected'],
    );
    $thread = Thread::query()->create([
        'workspace_id' => $native->workspace_id,
        'contact_id' => $contact->id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'subject' => 'WhatsApp Cloud',
        'last_message_at' => now(),
    ]);
    Message::query()->create([
        'workspace_id' => $native->workspace_id,
        'thread_id' => $thread->id,
        'contact_id' => $contact->id,
        'direction' => 'inbound',
        'type' => 'text',
        'body' => 'Need the clinic quote today',
        'status' => 'received',
        'provider' => 'evolution_cloud',
    ]);

    $this->actingAs($native)
        ->get('/inbox?thread='.$thread->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('embedUrl', null)
            ->where('embedState', 'no-url')
            ->where('selected.id', $thread->id)
            ->where('selected.contact.first_name', 'Amel')
            ->has('threads', 1)
        );

    $this->actingAs($native)
        ->get('/conversations?thread='.$thread->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/conversations')
            ->where('selected.id', $thread->id)
            ->missing('deskUrl')
        );
});
