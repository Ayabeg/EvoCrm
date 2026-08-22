<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\Thread;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    public function definition(): array
    {
        $thread = Thread::factory()->create();

        return [
            'workspace_id' => $thread->workspace_id,
            'thread_id' => $thread->id,
            'contact_id' => $thread->contact_id,
            'direction' => 'inbound',
            'type' => 'text',
            'body' => fake()->sentence(),
            'status' => 'received',
            'provider' => 'evolution_cloud',
        ];
    }
}
