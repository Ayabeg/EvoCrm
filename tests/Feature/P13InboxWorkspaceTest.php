<?php

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

function p13Channel(User $user, ChannelType $type = ChannelType::WhatsAppCloud): Channel
{
    return Channel::query()->firstOrCreate(
        ['workspace_id' => $user->workspace_id, 'type' => $type],
        ['name' => $type === ChannelType::WhatsAppCloud ? 'WhatsApp Cloud' : $type->value, 'status' => 'connected'],
    );
}

function p13Thread(User $user, array $overrides = []): Thread
{
    $contact = $overrides['contact'] ?? Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $overrides['owner_id'] ?? $user->id,
        'first_name' => $overrides['first_name'] ?? 'Amel',
        'last_name' => $overrides['last_name'] ?? 'Hadj',
    ]);
    unset($overrides['contact'], $overrides['owner_id'], $overrides['first_name'], $overrides['last_name']);

    return Thread::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel_id' => $overrides['channel_id'] ?? p13Channel($user)->id,
        'status' => $overrides['status'] ?? 'open',
        'subject' => $overrides['subject'] ?? 'Clinic quote',
        'unread_count' => $overrides['unread_count'] ?? 0,
        'last_message_at' => $overrides['last_message_at'] ?? now(),
    ]);
}

it('locks P13 native four-pane inbox without a third implementation', function () {
    $inbox = File::get(resource_path('js/pages/desk/inbox.tsx'));
    $chrome = File::get(resource_path('js/components/crm/inbox-chrome.tsx'))
        .File::get(resource_path('js/evo/inbox/Composer.tsx'))
        .File::get(resource_path('js/evo/inbox/ConversationRow.tsx'))
        .File::get(resource_path('js/evo/inbox/QueueNavigation.tsx'))
        .File::get(resource_path('js/evo/inbox/MessageThread.tsx'))
        .File::get(resource_path('js/evo/inbox/marks.tsx'));
    $workspace = File::get(resource_path('js/lib/inbox-workspace.ts'));
    $controller = File::get(app_path('Http/Controllers/Desk/InboxController.php'));
    $shell = File::get(resource_path('js/components/crm/adaptive-workspace-shell.tsx'));
    $conversations = File::get(resource_path('js/pages/crm/conversations.tsx'));
    $jsRunner = File::get(base_path('tests/js/p13-inbox-workspace.ts'));

    expect($inbox)->toContain('data-crm="inbox-workspace"')
        ->and($inbox)->toContain('AdaptiveWorkspaceShell')
        ->and($inbox)->toContain('data-inbox="native"')
        ->and($inbox)->toContain('data-inbox="embed"')
        ->and($inbox)->toContain('EvoDesk inbox')
        ->and($inbox)->toContain('Continue in CRM inbox')
        ->and($inbox)->toContain('Assigned to me')
        ->and($inbox)->toContain('All open')
        ->and($inbox)->toContain('Select a conversation')
        ->and($inbox)->toContain('Open ticket')
        ->and($inbox)->toContain('overflow-x-hidden')
        ->and($inbox)->toContain('InboxComposer')
        ->and($inbox)->toContain('InboxMessageThread')
        ->and($inbox)->toContain('InboxContactSidebar')
        ->and($inbox)->not->toContain('InboxV2')
        ->and($inbox)->not->toContain('NewInbox')
        ->and($inbox)->not->toContain('IntercomInbox')
        ->and($inbox)->not->toContain('QuickRecordDrawer')
        ->and($inbox)->not->toContain('DealPipelineBoard')
        ->and($inbox)->not->toContain('DealAttentionEvaluator')
        ->and($inbox)->not->toContain('dangerouslySetInnerHTML')
        ->and($inbox)->not->toContain('Official WhatsApp');

    expect($chrome)->toContain('data-inbox="context-host"')
        ->and($chrome)->toContain('data-inbox="composer"')
        ->and($chrome)->toContain('Send as resolved')
        ->and($chrome)->toContain("t('Send')")
        ->and($chrome)->toContain('Filter by name or subject')
        ->and($chrome)->toContain('whitespace-pre-wrap')
        ->and($chrome)->not->toContain('dangerouslySetInnerHTML')
        ->and($chrome)->not->toContain('QuickRecordDrawer');

    expect($workspace)->toContain('normalizeInboxFolder')
        ->and($workspace)->toContain('isStaleInboxVisit')
        ->and($workspace)->toContain('inboxThreadMatchesRequest')
        ->and($workspace)->toContain('resolveInboxRequestedThreadId')
        ->and($workspace)->toContain('groupInboxMessages')
        ->and($workspace)->not->toContain('instagram');

    expect($inbox)->toContain('router.cancelAll')
        ->and($inbox)->toContain('conversation-pending')
        ->and($inbox)->toContain('pendingThreadId')
        ->and($inbox)->toContain('selectedMatchesRequest');

    expect($controller)->toContain('folderCounts')
        ->and($controller)->toContain('applySearch')
        ->and($controller)->not->toContain('InboxV2')
        ->and($controller)->not->toContain('ChannelType::WhatsAppCloud');

    expect($shell)->toContain('px-4 py-3')
        ->and($conversations)->toContain('data-crm="conversations-workspace"')
        ->and($jsRunner)->toContain('instagram is not a real inbox folder');
});

it('scopes inbox folders and name search without exposing another workspace', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $channel = p13Channel($user);
    $open = p13Thread($user, [
        'channel_id' => $channel->id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
        'subject' => 'Clinic quote',
        'status' => 'open',
    ]);
    $closed = p13Thread($user, [
        'channel_id' => $channel->id,
        'first_name' => 'Karim',
        'last_name' => 'Said',
        'subject' => 'Closed loop',
        'status' => 'closed',
        'owner_id' => null,
    ]);
    p13Thread($other, ['first_name' => 'Amel', 'subject' => 'Other workspace']);

    $this->actingAs($user)
        ->get('/inbox?folder=closed')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('folder', 'closed')
            ->where('folderCounts.closed', 1)
            ->where('folderCounts.open', 1)
            ->has('threads', 1)
            ->where('threads.0.id', $closed->id)
            ->has('channels', 4)
        );

    $this->actingAs($user)
        ->get('/inbox?q=Amel')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('q', 'Amel')
            ->has('threads', 1)
            ->where('threads.0.id', $open->id)
        );

    $this->actingAs($user)
        ->get('/inbox?folder=instagram')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('folder', 'all')
            ->has('threads', 2)
        );
});

it('aligns whatsapp folder counts with whatsapp-only lists and exposes email folders', function () {
    $user = User::factory()->create();
    $whatsapp = p13Channel($user, ChannelType::WhatsApp);
    $cloud = p13Channel($user, ChannelType::WhatsAppCloud);
    $email = p13Channel($user, ChannelType::Email);

    foreach (range(1, 3) as $index) {
        p13Thread($user, [
            'channel_id' => $whatsapp->id,
            'first_name' => 'Wa'.$index,
            'subject' => 'WhatsApp '.$index,
        ]);
    }

    foreach (range(1, 2) as $index) {
        p13Thread($user, [
            'channel_id' => $cloud->id,
            'first_name' => 'Cloud'.$index,
            'subject' => 'Cloud '.$index,
        ]);
    }

    $emailThread = p13Thread($user, [
        'channel_id' => $email->id,
        'first_name' => 'Mail',
        'last_name' => 'Desk',
        'subject' => 'Invoice follow-up',
    ]);

    $this->actingAs($user)
        ->get('/inbox?folder=whatsapp')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('folder', 'whatsapp')
            ->where('folderCounts.whatsapp', 3)
            ->where('folderCounts.whatsapp_cloud', 2)
            ->where('folderCounts.email', 1)
            ->has('threads', 3)
            ->where('threads.0.channel.type', ChannelType::WhatsApp->value)
            ->where('threads.1.channel.type', ChannelType::WhatsApp->value)
            ->where('threads.2.channel.type', ChannelType::WhatsApp->value)
            ->has('channels', 4)
            ->where('channels.2.key', 'instagram')
            ->where('channels.3.key', 'facebook')
        );

    $this->actingAs($user)
        ->get('/inbox?folder=whatsapp_cloud')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('folder', 'whatsapp_cloud')
            ->where('folderCounts.whatsapp_cloud', 2)
            ->has('threads', 2)
            ->where('threads.0.channel.type', ChannelType::WhatsAppCloud->value)
            ->where('threads.1.channel.type', ChannelType::WhatsAppCloud->value)
        );

    $this->actingAs($user)
        ->get('/inbox?folder=email')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('folder', 'email')
            ->where('folderCounts.email', 1)
            ->has('threads', 1)
            ->where('threads.0.id', $emailThread->id)
            ->where('threads.0.channel.type', ChannelType::Email->value)
        );
});

it('keeps selected thread, send, and ticket routes on the existing desk contracts', function () {
    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => null]);
    $thread = p13Thread($user, ['first_name' => 'Amel']);
    Message::query()->create([
        'workspace_id' => $user->workspace_id,
        'thread_id' => $thread->id,
        'contact_id' => $thread->contact_id,
        'direction' => 'inbound',
        'type' => 'text',
        'body' => 'Need the clinic quote today',
        'status' => 'received',
        'provider' => 'evolution_cloud',
    ]);

    $this->actingAs($user)
        ->get('/inbox?thread='.$thread->id.'&context=0')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('embedUrl', null)
            ->where('selected.id', $thread->id)
            ->where('contextOpen', false)
        );

    $this->actingAs($user)
        ->from('/inbox?thread='.$thread->id)
        ->post("/desk/threads/{$thread->id}/reply", ['body' => 'Sending the quote'])
        ->assertRedirect();

    $message = Message::query()->where('thread_id', $thread->id)->where('direction', 'outbound')->latest('id')->first();
    expect($message)->not->toBeNull()
        ->and($message->body)->toBe('Sending the quote');

    $this->actingAs($user)
        ->get('/conversations?thread='.$thread->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/conversations'));
});

it('does not issue per-thread contact queries on the inbox list', function () {
    $user = User::factory()->create();
    $channel = p13Channel($user);

    foreach (['Amel', 'Karim', 'Nour'] as $name) {
        $thread = p13Thread($user, [
            'channel_id' => $channel->id,
            'first_name' => $name,
        ]);
        Message::query()->create([
            'workspace_id' => $user->workspace_id,
            'thread_id' => $thread->id,
            'contact_id' => $thread->contact_id,
            'direction' => 'inbound',
            'type' => 'text',
            'body' => $name.' ping',
            'status' => 'received',
            'provider' => 'evolution_cloud',
        ]);
    }

    DB::flushQueryLog();
    DB::enableQueryLog();

    $this->actingAs($user)->get('/inbox')->assertOk();

    $perThreadContact = collect(DB::getQueryLog())->filter(function (array $query): bool {
        $sql = strtolower($query['query']);
        $fromContacts = str_contains($sql, 'from "contacts"') || str_contains($sql, 'from `contacts`');
        $single = (bool) preg_match('/["`]contacts["`]\.["`]id["`]\s*=\s*\?/', $sql);
        $batched = str_contains($sql, ' in (');

        return $fromContacts && $single && ! $batched;
    });

    expect($perThreadContact->count())->toBe(0);
});
