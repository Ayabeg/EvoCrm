<?php

namespace App\Support;

class ListViewConfig
{
    /**
     * @return array<int, array{id: string, label: string, defaultVisible: bool}>
     */
    public static function columns(string $entity): array
    {
        return match ($entity) {
            'contact' => [
                ['id' => 'name', 'label' => 'Name', 'defaultVisible' => true],
                ['id' => 'email', 'label' => 'Email', 'defaultVisible' => true],
                ['id' => 'phone', 'label' => 'Phone', 'defaultVisible' => true],
                ['id' => 'company', 'label' => 'Company', 'defaultVisible' => true],
                ['id' => 'owner', 'label' => 'Owner', 'defaultVisible' => true],
                ['id' => 'city', 'label' => 'City', 'defaultVisible' => false],
                ['id' => 'wilaya', 'label' => 'Wilaya', 'defaultVisible' => false],
                ['id' => 'last_activity_at', 'label' => 'Last activity', 'defaultVisible' => false],
                ['id' => 'created_at', 'label' => 'Created', 'defaultVisible' => false],
            ],
            'deal' => [
                ['id' => 'title', 'label' => 'Deal name', 'defaultVisible' => true],
                ['id' => 'amount', 'label' => 'Amount', 'defaultVisible' => true],
                ['id' => 'stage', 'label' => 'Stage', 'defaultVisible' => true],
                ['id' => 'owner', 'label' => 'Owner', 'defaultVisible' => true],
                ['id' => 'close_date', 'label' => 'Close date', 'defaultVisible' => true],
                ['id' => 'last_activity_at', 'label' => 'Last activity', 'defaultVisible' => false],
                ['id' => 'company', 'label' => 'Company', 'defaultVisible' => false],
                ['id' => 'contact', 'label' => 'Contact', 'defaultVisible' => false],
                ['id' => 'created_at', 'label' => 'Created', 'defaultVisible' => false],
            ],
            'company' => [
                ['id' => 'name', 'label' => 'Name', 'defaultVisible' => true],
                ['id' => 'city', 'label' => 'City', 'defaultVisible' => true],
                ['id' => 'wilaya', 'label' => 'Wilaya', 'defaultVisible' => true],
                ['id' => 'owner', 'label' => 'Owner', 'defaultVisible' => true],
                ['id' => 'created_at', 'label' => 'Created', 'defaultVisible' => false],
            ],
            default => [],
        };
    }

    /**
     * @return array<int, array{id: string, label: string, type: string, options?: array<int, string>}>
     */
    public static function filterFields(string $entity): array
    {
        return match ($entity) {
            'contact' => [
                ['id' => 'owner', 'label' => 'Owner', 'type' => 'select'],
                ['id' => 'city', 'label' => 'City', 'type' => 'select'],
                ['id' => 'wilaya', 'label' => 'Wilaya', 'type' => 'select'],
                ['id' => 'created', 'label' => 'Create date', 'type' => 'select', 'options' => ['today', '7d', '30d', '90d']],
                ['id' => 'last_activity', 'label' => 'Last activity', 'type' => 'select', 'options' => ['7d', '30d', 'none']],
                ['id' => 'status', 'label' => 'Lead status', 'type' => 'select', 'options' => ['new', 'working', 'qualified', 'disqualified']],
                ['id' => 'unanswered', 'label' => 'Unanswered', 'type' => 'boolean'],
                ['id' => 'unassigned', 'label' => 'Unassigned', 'type' => 'boolean'],
            ],
            'deal' => [
                ['id' => 'stage', 'label' => 'Stage', 'type' => 'select'],
                ['id' => 'owner', 'label' => 'Owner', 'type' => 'select'],
                ['id' => 'city', 'label' => 'City', 'type' => 'select'],
                ['id' => 'wilaya', 'label' => 'Wilaya', 'type' => 'select'],
                ['id' => 'created', 'label' => 'Create date', 'type' => 'select', 'options' => ['today', '7d', '30d', '90d']],
                ['id' => 'last_activity', 'label' => 'Last activity', 'type' => 'select', 'options' => ['7d', '30d', 'none']],
                ['id' => 'status', 'label' => 'Deal status', 'type' => 'select', 'options' => ['open', 'won', 'lost']],
                ['id' => 'unanswered', 'label' => 'Unanswered contact', 'type' => 'boolean'],
                ['id' => 'unassigned', 'label' => 'Unassigned', 'type' => 'boolean'],
            ],
            'company' => [
                ['id' => 'owner', 'label' => 'Owner', 'type' => 'select'],
                ['id' => 'city', 'label' => 'City', 'type' => 'select'],
                ['id' => 'wilaya', 'label' => 'Wilaya', 'type' => 'select'],
                ['id' => 'created', 'label' => 'Create date', 'type' => 'select', 'options' => ['today', '7d', '30d', '90d']],
                ['id' => 'last_activity', 'label' => 'Last activity', 'type' => 'select', 'options' => ['7d', '30d', 'none']],
                ['id' => 'status', 'label' => 'Deal status', 'type' => 'select', 'options' => ['open', 'won', 'lost']],
                ['id' => 'unassigned', 'label' => 'Unassigned', 'type' => 'boolean'],
            ],
            default => [],
        };
    }

    /**
     * @return array{field: string, direction: string}
     */
    public static function defaultSort(string $entity): array
    {
        return match ($entity) {
            'deal' => ['field' => 'close_date', 'direction' => 'asc'],
            default => ['field' => 'created_at', 'direction' => 'desc'],
        };
    }

    /**
     * @param  array<int, array{id: string, visible?: bool, order?: int}>|null  $columns
     * @return array<int, array{id: string, visible: bool, order: int}>
     */
    public static function normalizeColumns(string $entity, ?array $columns): array
    {
        $defs = self::columns($entity);
        $source = $columns ?: [];

        $ordered = collect($source)
            ->sortBy(fn (array $column) => $column['order'] ?? 0)
            ->values();

        return collect($defs)->map(function (array $def, int $index) use ($ordered) {
            $match = $ordered->firstWhere('id', $def['id']);

            return [
                'id' => $def['id'],
                'visible' => $match['visible'] ?? $def['defaultVisible'],
                'order' => $match['order'] ?? $index,
            ];
        })->sortBy('order')->values()->all();
    }
}
