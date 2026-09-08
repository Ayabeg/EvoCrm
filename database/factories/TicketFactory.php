<?php

namespace Database\Factories;

use App\Models\Contact;
use App\Models\Ticket;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ticket>
 */
class TicketFactory extends Factory
{
    public function definition(): array
    {
        $workspace = Workspace::factory();

        return [
            'workspace_id' => $workspace,
            'contact_id' => Contact::factory()->state(['workspace_id' => $workspace]),
            'subject' => fake()->sentence(4),
            'status' => Ticket::STATUS_NEW,
            'priority' => Ticket::PRIORITY_MEDIUM,
            'channel' => Ticket::CHANNEL_MANUAL,
        ];
    }
}
