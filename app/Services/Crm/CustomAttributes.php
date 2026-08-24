<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\Deal;
use App\Models\Workspace;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class CustomAttributes
{
    /**
     * @return Collection<int, CustomAttributeDefinition>
     */
    public function definitions(Workspace $workspace, string $entity): Collection
    {
        return CustomAttributeDefinition::query()
            ->forWorkspace($workspace)
            ->where('entity', $entity)
            ->orderByRaw("case when group_name is null or group_name = '' then 1 else 0 end")
            ->orderBy('group_name')
            ->orderBy('label')
            ->get();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentDefinition(CustomAttributeDefinition $definition, ?array $fillRate = null): array
    {
        $payload = [
            'id' => $definition->id,
            'entity' => $definition->entity,
            'key' => $definition->key,
            'label' => $definition->label,
            'type' => $definition->normalizedType(),
            'options' => $definition->options,
            'group' => $definition->group_name,
            'required' => (bool) $definition->required,
        ];

        if ($fillRate !== null) {
            $payload['fill_rate'] = $fillRate;
        }

        return $payload;
    }

    /**
     * @return array<string, string|null>
     */
    public function valuesFor(Workspace $workspace, string $entity, int $entityId): array
    {
        $definitions = $this->definitions($workspace, $entity);
        $values = CustomAttributeValue::query()
            ->forWorkspace($workspace)
            ->where('entity_type', $entity)
            ->where('entity_id', $entityId)
            ->get()
            ->keyBy('definition_id');

        $out = [];
        foreach ($definitions as $definition) {
            $out[$definition->key] = $values[$definition->id]->value ?? null;
        }

        return $out;
    }

    /**
     * @return array<int, array{filled: int, total: int, percent: int}>
     */
    public function fillRates(Workspace $workspace): array
    {
        $totals = [
            'contact' => Contact::query()->forWorkspace($workspace)->count(),
            'company' => Company::query()->forWorkspace($workspace)->count(),
            'deal' => Deal::query()->forWorkspace($workspace)->count(),
        ];

        $filled = CustomAttributeValue::query()
            ->forWorkspace($workspace)
            ->whereNotNull('value')
            ->where('value', '!=', '')
            ->selectRaw('definition_id, COUNT(*) as filled_count')
            ->groupBy('definition_id')
            ->pluck('filled_count', 'definition_id');

        $rates = [];
        foreach (CustomAttributeDefinition::query()->forWorkspace($workspace)->get() as $definition) {
            $total = $totals[$definition->entity] ?? 0;
            $have = (int) ($filled[$definition->id] ?? 0);

            $rates[$definition->id] = [
                'filled' => $have,
                'total' => $total,
                'percent' => $total > 0 ? (int) round(($have / $total) * 100) : 0,
            ];
        }

        return $rates;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function saveValues(Workspace $workspace, string $entity, int $entityId, array $payload, bool $enforceRequired = false): void
    {
        foreach ($this->definitions($workspace, $entity) as $definition) {
            $present = array_key_exists($definition->key, $payload)
                || array_key_exists((string) $definition->id, $payload);

            if (! $present && ! $enforceRequired) {
                continue;
            }

            $raw = $present
                ? ($payload[$definition->key] ?? $payload[(string) $definition->id] ?? null)
                : null;
            $value = $raw === null || $raw === '' ? null : (string) $raw;

            $this->assertValid($definition, $value, $enforceRequired || $present);

            if (! $present) {
                continue;
            }

            CustomAttributeValue::query()->updateOrCreate(
                [
                    'definition_id' => $definition->id,
                    'entity_type' => $entity,
                    'entity_id' => $entityId,
                ],
                [
                    'workspace_id' => $workspace->id,
                    'value' => $value,
                ]
            );
        }
    }

    private function assertValid(CustomAttributeDefinition $definition, ?string $value, bool $checkRequired): void
    {
        $key = 'attributes.'.$definition->key;

        if ($checkRequired && $definition->required && $value === null) {
            throw ValidationException::withMessages([
                $key => $definition->label.' is required.',
            ]);
        }

        if ($value === null) {
            return;
        }

        $type = $definition->normalizedType();

        if ($type === 'number' && ! is_numeric($value)) {
            throw ValidationException::withMessages([
                $key => $definition->label.' must be a number.',
            ]);
        }

        if ($type === 'date' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            throw ValidationException::withMessages([
                $key => $definition->label.' must be a date.',
            ]);
        }

        $options = $definition->options;
        if ($type === 'select' && is_array($options) && $options !== [] && ! in_array($value, $options, true)) {
            throw ValidationException::withMessages([
                $key => $definition->label.' is not a valid option.',
            ]);
        }
    }
}
