<?php

namespace App\Services\Crm;

use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\Workspace;
use Illuminate\Support\Collection;

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
            ->orderBy('label')
            ->get();
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
     * @param  array<string, mixed>  $payload
     */
    public function saveValues(Workspace $workspace, string $entity, int $entityId, array $payload): void
    {
        foreach ($this->definitions($workspace, $entity) as $definition) {
            if (! array_key_exists($definition->key, $payload) && ! array_key_exists((string) $definition->id, $payload)) {
                continue;
            }

            $raw = $payload[$definition->key] ?? $payload[(string) $definition->id] ?? null;
            $value = $raw === null || $raw === '' ? null : (string) $raw;

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
}
