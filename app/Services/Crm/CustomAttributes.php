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
     * @param  array{filled: int, total: int, percent: int}|null  $fillRate
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
            if ($definition->type === 'calculated') {
                $out[$definition->key] = $this->evaluateFormula($workspace, $entity, $entityId, $definition);

                continue;
            }

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
            $raw = $this->rawFromPayload($payload, $definition);
            $present = $raw !== null || $this->payloadHasKey($payload, $definition);

            if (! $present && ! $enforceRequired) {
                continue;
            }

            $value = $raw === null || $raw === '' ? null : (string) $raw;

            $this->assertValid($definition, $value, true);

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

        $options = $definition->optionList();
        if ($type === 'list' && $options !== [] && ! in_array($value, $options, true)) {
            throw ValidationException::withMessages([
                $key => $definition->label.' is not a valid option.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function payloadHasKey(array $payload, CustomAttributeDefinition $definition): bool
    {
        if (array_key_exists($definition->key, $payload)) {
            return true;
        }

        foreach (array_keys($payload) as $key) {
            if ((string) $key === (string) $definition->id) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function rawFromPayload(array $payload, CustomAttributeDefinition $definition): mixed
    {
        if (array_key_exists($definition->key, $payload)) {
            return $payload[$definition->key];
        }

        foreach ($payload as $key => $value) {
            if ((string) $key === (string) $definition->id) {
                return $value;
            }
        }

        return null;
    }

    protected function evaluateFormula(Workspace $workspace, string $entity, int $entityId, CustomAttributeDefinition $definition): ?string
    {
        $formula = $definition->formula;
        if (! is_array($formula) || ! filled($formula['expression'] ?? null)) {
            return null;
        }

        $expression = (string) $formula['expression'];
        $amount = 0;

        if ($entity === 'deal') {
            $deal = Deal::query()->forWorkspace($workspace)->find($entityId);
            $amount = $deal ? ((int) $deal->amount_cents) / 100 : 0;
        }

        $expression = str_replace('{deal.amount}', (string) $amount, $expression);

        if (! preg_match('/^[0-9+\-*\/().\s]+$/', $expression)) {
            return null;
        }

        try {
            $result = eval('return '.$expression.';');
        } catch (\Throwable) {
            return null;
        }

        return is_numeric($result) ? (string) round((float) $result, 2) : null;
    }
}
