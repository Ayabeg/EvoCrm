<?php

namespace App\Services\Identity;

use App\Enums\ChannelType;
use App\Enums\WorkspaceRole;
use App\Models\Channel;
use App\Models\Pipeline;
use App\Models\Product;
use App\Models\QuietHours;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Funnels\ConversionFunnelProvisioner;
use Illuminate\Support\Str;

class WorkspaceProvisioner
{
    public function provision(string $name = 'Evotechly', ?User $owner = null): Workspace
    {
        $workspace = Workspace::query()->create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'timezone' => 'Africa/Algiers',
            'country_code' => 'DZ',
            'default_dial_code' => '213',
            'inbox_url' => config('evosales.inbox_url'),
        ]);

        $this->seedDefaults($workspace);

        if ($owner) {
            $owner->forceFill([
                'workspace_id' => $workspace->id,
                'role' => WorkspaceRole::Owner,
            ])->save();
        }

        return $workspace;
    }

    public function seedDefaults(Workspace $workspace): void
    {
        $pipeline = Pipeline::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'is_default' => true],
            ['name' => 'Sales']
        );

        foreach (config('evosales.pipeline') as $stage) {
            $pipeline->stages()->firstOrCreate(
                ['slug' => $stage['slug'], 'workspace_id' => $workspace->id],
                [
                    'name' => $stage['name'],
                    'position' => $stage['position'],
                    'is_won' => $stage['is_won'],
                    'is_lost' => $stage['is_lost'],
                    'probability' => $stage['probability'] ?? null,
                ]
            );
        }

        Channel::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'type' => ChannelType::WhatsAppCloud],
            ['name' => 'WhatsApp Cloud', 'status' => 'not_connected']
        );

        Channel::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'type' => ChannelType::Telegram],
            ['name' => 'Telegram', 'status' => 'later']
        );

        Channel::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'type' => ChannelType::Email],
            ['name' => 'Email', 'status' => 'not_connected']
        );

        app(ConversionFunnelProvisioner::class)->provision($workspace);

        QuietHours::query()->firstOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'timezone' => 'Africa/Algiers',
                'starts_at' => config('evosales.quiet_hours.starts_at'),
                'ends_at' => config('evosales.quiet_hours.ends_at'),
                'enabled' => true,
            ]
        );

        $this->seedCatalog($workspace);
    }

    /**
     * Local Evotechly catalog until Evostock sync. Idempotent on sku.
     */
    public function seedCatalog(Workspace $workspace): void
    {
        foreach (config('evosales.catalog', []) as $row) {
            $sku = (string) ($row['sku'] ?? '');
            $name = (string) ($row['name'] ?? '');

            if ($sku === '' || $name === '') {
                continue;
            }

            Product::query()->firstOrCreate(
                ['workspace_id' => $workspace->id, 'sku' => $sku],
                [
                    'name' => $name,
                    'unit_cents' => (int) round(((float) ($row['unit_dzd'] ?? 0)) * 100),
                    'currency' => 'DZD',
                    'active' => true,
                ]
            );
        }
    }

    public function forUser(User $user): Workspace
    {
        if ($user->workspace) {
            $this->seedDefaults($user->workspace);

            return $user->workspace;
        }

        return $this->provision(config('evosales.company', 'Evotechly'), $user);
    }
}
