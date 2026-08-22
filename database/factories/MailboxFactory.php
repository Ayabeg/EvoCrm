<?php

namespace Database\Factories;

use App\Models\Mailbox;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Mailbox>
 */
class MailboxFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => 'Evotechly SMTP',
            'from_name' => 'Evotechly',
            'from_address' => 'hello@evotechly.dz',
            'host' => 'smtp.example.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'hello@evotechly.dz',
            'password' => 'secret-mailbox-password',
            'is_default' => true,
            'enabled' => true,
        ];
    }
}
