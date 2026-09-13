<?php

namespace Database\Factories;

use App\Models\Workspace;
use App\Services\Identity\WorkspaceProvisioner;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Workspace>
 */
class WorkspaceFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'timezone' => 'Africa/Algiers',
            'country_code' => 'DZ',
            'default_dial_code' => '213',
            'inbox_url' => 'https://desk.evotechly.com',
            'simple_mode' => false,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Workspace $workspace): void {
            app(WorkspaceProvisioner::class)->seedDefaults($workspace);
        });
    }
}
