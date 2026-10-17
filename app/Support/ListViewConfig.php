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
                ['id' => 'lead_status', 'label' => 'Lead status', 'defaultVisible' => true],
                ['id' => 'company', 'label' => 'Company', 'defaultVisible' => true],
                ['id' => 'owner', 'label' => 'Owner', 'defaultVisible' => true],
                ['id' => 'city', 'label' => 'City', 'defaultVisible' => false],
                ['id' => 'wilaya', 'label' => 'Wilaya', 'defaultVisible' => false],
                ['id' => 'last_activity_at', 'label' => 'Last activity', 'defaultVisible' => false],
                ['id' => 'created_at', 'label' => 'Created', 'defaultVisible' => false],
            ],
            'deal' => [
                ['id' => 'title', 'label' => 'Deal name', 'defaultVisible' => true],
                ['id' => 'stage', 'label' => 'Stage', 'defaultVisible' => true],
                ['id' => 'amount', 'label' => 'Amount', 'defaultVisible' => true],
                ['id' => 'close_date', 'label' => 'Close date', 'defaultVisible' => true],
                ['id' => 'owner', 'label' => 'Owner', 'defaultVisible' => true],
                ['id' => 'company', 'label' => 'Company', 'defaultVisible' => true],
                ['id' => 'contact', 'label' => 'Contact', 'defaultVisible' => true],
                ['id' => 'attention', 'label' => 'Attention', 'defaultVisible' => true],
                ['id' => 'health', 'label' => 'Health', 'defaultVisible' => false],
                ['id' => 'next_step', 'label' => 'Next step', 'defaultVisible' => false],
                ['id' => 'last_activity_at', 'label' => 'Last activity', 'defaultVisible' => false],
                ['id' => 'created_at', 'label' => 'Created', 'defaultVisible' => false],
            ],
            'company' => [
                ['id' => 'name', 'label' => 'Name', 'defaultVisible' => true],
                ['id' => 'city', 'label' => 'City', 'defaultVisible' => true],
                ['id' => 'wilaya', 'label' => 'Wilaya', 'defaultVisible' => true],
                ['id' => 'owner', 'label' => 'Owner', 'defaultVisible' => true],
                ['id' => 'created_at', 'label' => 'Created', 'defaultVisible' => false],
            ],
            'ticket' => [
                ['id' => 'number', 'label' => 'Number', 'defaultVisible' => true],
                ['id' => 'subject', 'label' => 'Ticket name', 'defaultVisible' => true],
                ['id' => 'status', 'label' => 'Status', 'defaultVisible' => true],
                ['id' => 'priority', 'label' => 'Priority', 'defaultVisible' => true],
                ['id' => 'channel', 'label' => 'Channel', 'defaultVisible' => true],
                ['id' => 'contact', 'label' => 'Contact', 'defaultVisible' => true],
                ['id' => 'company', 'label' => 'Company', 'defaultVisible' => false],
                ['id' => 'owner', 'label' => 'Owner', 'defaultVisible' => true],
                ['id' => 'created_at', 'label' => 'Create date', 'defaultVisible' => true],
                ['id' => 'sla_due_at', 'label' => 'SLA', 'defaultVisible' => true],
            ],
            'quote' => [
                ['id' => 'title', 'label' => 'Quote', 'defaultVisible' => true],
                ['id' => 'amount', 'label' => 'Amount', 'defaultVisible' => true],
                ['id' => 'status', 'label' => 'Status', 'defaultVisible' => true],
                ['id' => 'owner', 'label' => 'Owner', 'defaultVisible' => true],
                ['id' => 'created_at', 'label' => 'Create date', 'defaultVisible' => true],
                ['id' => 'expires_at', 'label' => 'Expiration', 'defaultVisible' => true],
                ['id' => 'sent_at', 'label' => 'Sent', 'defaultVisible' => false],
            ],
            'lead' => [
                ['id' => 'title', 'label' => 'Title', 'defaultVisible' => true],
                ['id' => 'contact', 'label' => 'Contact', 'defaultVisible' => true],
                ['id' => 'status', 'label' => 'Status', 'defaultVisible' => true],
                ['id' => 'score', 'label' => 'Score', 'defaultVisible' => true],
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
                ['id' => 'enrolled_in_sequence', 'label' => 'Enrolled in sequence', 'type' => 'select'],
                ['id' => 'email_replied', 'label' => 'Replied to email', 'type' => 'boolean'],
                ['id' => 'email_opened', 'label' => 'Opened email', 'type' => 'boolean'],
                ['id' => 'marketing_consent', 'label' => 'Marketing consent', 'type' => 'select', 'options' => ['granted', 'denied', 'unknown']],
            ],
            'deal' => [
                ['id' => 'stage', 'label' => 'Stage', 'type' => 'select'],
                ['id' => 'owner', 'label' => 'Owner', 'type' => 'select'],
                ['id' => 'city', 'label' => 'City', 'type' => 'select'],
                ['id' => 'wilaya', 'label' => 'Wilaya', 'type' => 'select'],
                ['id' => 'created', 'label' => 'Create date', 'type' => 'select', 'options' => ['today', '7d', '30d', '90d']],
                ['id' => 'last_activity', 'label' => 'Last activity', 'type' => 'select', 'options' => ['7d', '30d', 'none']],
                ['id' => 'status', 'label' => 'Deal status', 'type' => 'select', 'options' => ['open', 'won', 'lost']],
                ['id' => 'attention', 'label' => 'Attention', 'type' => 'select', 'options' => ['needs_attention', 'overdue', 'no_next_action']],
                ['id' => 'unanswered', 'label' => 'Unanswered contact', 'type' => 'boolean'],
                ['id' => 'unassigned', 'label' => 'Unassigned', 'type' => 'boolean'],
            ],
            'company' => [
                ['id' => 'owner', 'label' => 'Owner', 'type' => 'select'],
                ['id' => 'city', 'label' => 'City', 'type' => 'select'],
                ['id' => 'wilaya', 'label' => 'Wilaya', 'type' => 'select'],
                ['id' => 'created', 'label' => 'Create date', 'type' => 'select', 'options' => ['today', '7d', '30d', '90d']],
                ['id' => 'last_activity', 'label' => 'Last activity', 'type' => 'select', 'options' => ['7d', '30d', 'none']],
                ['id' => 'unassigned', 'label' => 'Unassigned', 'type' => 'boolean'],
            ],
            'ticket' => [
                ['id' => 'status', 'label' => 'Ticket status', 'type' => 'select', 'options' => ['new', 'waiting_on_contact', 'waiting_on_us', 'closed']],
                ['id' => 'owner', 'label' => 'Owner', 'type' => 'select'],
                ['id' => 'priority', 'label' => 'Priority', 'type' => 'select', 'options' => ['low', 'medium', 'high']],
                ['id' => 'channel', 'label' => 'Channel', 'type' => 'select', 'options' => ['whatsapp_cloud', 'email', 'manual']],
                ['id' => 'unassigned', 'label' => 'Unassigned', 'type' => 'boolean'],
                ['id' => 'unanswered', 'label' => 'Unanswered', 'type' => 'boolean'],
            ],
            'quote' => [
                ['id' => 'status', 'label' => 'Quote status', 'type' => 'select', 'options' => ['draft', 'sent', 'accepted']],
                ['id' => 'owner', 'label' => 'Owner', 'type' => 'select'],
                ['id' => 'created', 'label' => 'Create date', 'type' => 'select', 'options' => ['today', '7d', '30d', '90d']],
            ],
            'lead' => [
                ['id' => 'status', 'label' => 'Lead status', 'type' => 'select', 'options' => ['new', 'working', 'qualified', 'disqualified']],
                ['id' => 'created', 'label' => 'Create date', 'type' => 'select', 'options' => ['today', '7d', '30d', '90d']],
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
    public static function normalizeColumns(string $entity, ?array $columns, array $extraDefs = []): array
    {
        $defs = array_merge(self::columns($entity), $extraDefs);
        $source = $columns ?: [];

        $ordered = collect($source)
            ->sortBy(fn (array $column) => $column['order'] ?? 0)
            ->values();

        $normalized = collect($defs)->map(function (array $def, int $index) use ($ordered) {
            $match = $ordered->firstWhere('id', $def['id']);

            return [
                'id' => $def['id'],
                'visible' => $match['visible'] ?? $def['defaultVisible'],
                'order' => $match['order'] ?? $index,
            ];
        });

        $extras = $ordered
            ->filter(fn (array $column) => str_starts_with((string) ($column['id'] ?? ''), 'custom:')
                && ! $normalized->contains(fn (array $row) => $row['id'] === $column['id']))
            ->values()
            ->map(fn (array $column, int $index) => [
                'id' => (string) $column['id'],
                'visible' => (bool) ($column['visible'] ?? false),
                'order' => $column['order'] ?? count($defs) + $index,
            ]);

        return $normalized->concat($extras)->sortBy('order')->values()->all();
    }
}
