<?php

namespace Database\Factories;

use App\Enums\ConnectorProvider;
use App\Enums\ConnectorStatus;
use App\Models\Connector;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Connector>
 */
class ConnectorFactory extends Factory
{
    public function definition(): array
    {
        $provider = ConnectorProvider::WhatsAppCloud;

        return [
            'workspace_id' => Workspace::factory(),
            'provider' => $provider,
            'intent' => $provider->intent(),
            'status' => ConnectorStatus::NotConnected,
            'config' => null,
            'connected_at' => null,
        ];
    }
}
