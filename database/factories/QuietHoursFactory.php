<?php

namespace Database\Factories;

use App\Models\QuietHours;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuietHours>
 */
class QuietHoursFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'timezone' => 'Africa/Algiers',
            'starts_at' => '21:00',
            'ends_at' => '08:00',
            'enabled' => true,
        ];
    }
}
