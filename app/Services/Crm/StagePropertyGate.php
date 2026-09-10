<?php

namespace App\Services\Crm;

use App\Models\CustomAttributeDefinition;
use App\Models\Deal;
use App\Models\Stage;
use App\Models\Workspace;
use Illuminate\Validation\ValidationException;

class StagePropertyGate
{
    public const NATIVE = [
        'amount' => 'Amount (DZD)',
        'close_date' => 'Close date',
        'next_step' => 'Next step',
        'owner_id' => 'Owner',
        'source' => 'Source',
        'lost_reason' => 'Lost reason',
    ];

    public function __construct(private CustomAttributes $attributes) {}

    /**
     * @return list<array{key: string, label: string, group: string}>
     */
    public function catalog(Workspace $workspace): array
    {
        $native = collect(self::NATIVE)
            ->map(fn (string $label, string $key) => [
                'key' => $key,
                'label' => $label,
                'group' => 'Deal',
            ])
            ->values();

        $custom = CustomAttributeDefinition::query()
            ->forWorkspace($workspace)
            ->where('entity', 'deal')
            ->orderBy('label')
            ->get()
            ->map(fn (CustomAttributeDefinition $definition) => [
                'key' => 'attr.'.$definition->key,
                'label' => $definition->label,
                'group' => filled($definition->group_name) ? $definition->group_name : 'Custom',
            ]);

        return $native->concat($custom)->values()->all();
    }

    /**
     * @return list<string>
     */
    public function allowedKeys(Workspace $workspace): array
    {
        return array_column($this->catalog($workspace), 'key');
    }

    /**
     * @return list<string>
     */
    public function missingLabels(Deal $deal, Stage $stage): array
    {
        $keys = $stage->requiredPropertyKeys();

        if ($keys === []) {
            return [];
        }

        $labels = [];
        $custom = null;

        foreach ($keys as $key) {
            if (! $this->isFilled($deal, $key, $custom)) {
                $labels[] = $this->labelFor($deal, $key);
            }
        }

        return $labels;
    }

    public function assertCanEnter(Deal $deal, Stage $stage): void
    {
        if ((int) $deal->stage_id === (int) $stage->id) {
            return;
        }

        $missing = $this->missingLabels($deal, $stage);

        if ($missing === []) {
            return;
        }

        $list = match (count($missing)) {
            1 => $missing[0],
            2 => $missing[0].' and '.$missing[1],
            default => implode(', ', array_slice($missing, 0, -1)).', and '.end($missing),
        };

        throw ValidationException::withMessages([
            'stage_id' => "Fill {$list} before moving to {$stage->name}.",
        ]);
    }

    /**
     * @param  array<string, string|null>|null  $custom
     */
    private function isFilled(Deal $deal, string $key, ?array &$custom): bool
    {
        if (str_starts_with($key, 'attr.')) {
            $custom ??= $this->customValues($deal);
            $value = $custom[substr($key, 5)] ?? null;

            return $value !== null && trim((string) $value) !== '';
        }

        return match ($key) {
            'amount' => (int) $deal->amount_cents > 0,
            'close_date' => filled($deal->close_date),
            'next_step' => filled(trim((string) $deal->next_step)),
            'owner_id' => filled($deal->owner_id),
            'source' => filled(trim((string) $deal->source)),
            'lost_reason' => filled(trim((string) $deal->lost_reason)),
            default => true,
        };
    }

    /**
     * @return array<string, string|null>
     */
    private function customValues(Deal $deal): array
    {
        if (! $deal->exists || ! $deal->workspace_id) {
            return [];
        }

        $workspace = $deal->workspace ?? Workspace::query()->find($deal->workspace_id);

        if (! $workspace instanceof Workspace) {
            return [];
        }

        return $this->attributes->valuesFor($workspace, 'deal', (int) $deal->id);
    }

    private function labelFor(Deal $deal, string $key): string
    {
        if (isset(self::NATIVE[$key])) {
            return self::NATIVE[$key];
        }

        if (str_starts_with($key, 'attr.')) {
            $workspace = $deal->workspace ?? Workspace::query()->find($deal->workspace_id);
            $attrKey = substr($key, 5);
            $definition = $workspace
                ? CustomAttributeDefinition::query()
                    ->forWorkspace($workspace)
                    ->where('entity', 'deal')
                    ->where('key', $attrKey)
                    ->first()
                : null;

            return $definition?->label ?? $attrKey;
        }

        return $key;
    }
}
