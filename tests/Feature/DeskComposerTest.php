<?php

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;

it('stores a desk composer reply even when Evolution Cloud is disconnected', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id, 'phone' => '0550188001']);
    $channel = Channel::query()->firstOrCreate(
        ['workspace_id' => $workspace->id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WhatsApp Cloud', 'status' => 'not_connected']
    );

    $thread = Thread::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'subject' => 'WhatsApp Cloud',
        'last_message_at' => now(),
    ]);

    $this->actingAs($user)
        ->post("/desk/threads/{$thread->id}/reply", [
            'body' => 'Session reply from CRM history',
        ])
        ->assertRedirect();

    $message = Message::query()->where('thread_id', $thread->id)->latest('id')->first();

    expect($message)->not->toBeNull()
        ->and($message->direction)->toBe('outbound')
        ->and($message->body)->toBe('Session reply from CRM history')
        ->and($message->status)->toBe('failed')
        ->and($message->failure_reason)->toContain('Evolution is not connected');
});
