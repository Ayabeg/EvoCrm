<?php

namespace Database\Factories;

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Thread;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Thread>
 */
class ThreadFactory extends Factory
{
    public function definition(): array
    {
        $workspace = Workspace::factory()->create();
        $channel = Channel::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'type' => ChannelType::WhatsAppCloud],
            ['name' => 'WhatsApp Cloud', 'status' => 'connected']
        );

        return [
            'workspace_id' => $workspace->id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
            'channel_id' => $channel->id,
            'status' => 'open',
            'subject' => 'WhatsApp Cloud',
            'last_message_at' => now(),
        ];
    }
}
