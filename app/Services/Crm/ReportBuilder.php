<?php

namespace App\Services\Crm;

use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\Deal;
use App\Models\SavedReport;
use App\Models\Workspace;

class ReportBuilder
{
    public function __construct(private CrmFilter $filter) {}

    /**
     * @return array{metric: string, value: int|float, groups?: array<int, array{label: string, value: int|float}>}
     */
    public function run(SavedReport $report): array
    {
        $workspace = $report->workspace;
        $filters = $report->filters ?? [];
        $entity = $report->entity;
        $metric = $report->metric ?? 'count';

        $query = match ($entity) {
            'contact' => Contact::query()->forWorkspace($workspace),
            'deal' => Deal::query()->forWorkspace($workspace),
            default => null,
        };

        if (! $query) {
            return ['metric' => $metric, 'value' => 0];
        }

        $this->filter->apply($entity, $query, $filters);

        if ($metric === 'sum_amount' && $entity === 'deal') {
            return ['metric' => $metric, 'value' => (int) $query->sum('amount_cents')];
        }

        if ($report->group_by && $entity === 'deal') {
            $column = match ($report->group_by) {
                'stage' => 'stage_id',
                'owner' => 'owner_id',
                default => null,
            };

            if ($column) {
                $groups = $query->clone()
                    ->selectRaw("{$column} as group_key, count(*) as cnt, sum(amount_cents) as total")
                    ->groupBy($column)
                    ->get()
                    ->map(fn ($row) => [
                        'label' => (string) $row->group_key,
                        'value' => $metric === 'sum_amount' ? (int) $row->total : (int) $row->cnt,
                    ])
                    ->all();

                return ['metric' => $metric, 'value' => $query->count(), 'groups' => $groups];
            }
        }

        return ['metric' => $metric, 'value' => $query->count()];
    }

    /**
     * Cross-object: reply rate by wilaya (contacts with outbound + reply flag).
     *
     * @return array{metric: string, groups: array<int, array{label: string, value: float, count: int}>}
     */
    public function replyRateByWilaya(Workspace $workspace): array
    {
        $rows = Contact::query()
            ->forWorkspace($workspace)
            ->whereNotNull('wilaya')
            ->withCount([
                'outboundMessages as sent_count' => fn ($q) => $q->where('direction', 'out')->where('status', 'sent'),
                'outboundMessages as replied_count' => fn ($q) => $q->where('direction', 'out')->whereNotNull('replied_at'),
            ])
            ->get()
            ->groupBy('wilaya')
            ->map(function ($group, $wilaya) {
                $sent = (int) $group->sum('sent_count');
                $replied = (int) $group->sum('replied_count');

                return [
                    'label' => (string) $wilaya,
                    'value' => $sent > 0 ? round(($replied / $sent) * 100, 1) : 0.0,
                    'count' => $sent,
                ];
            })
            ->sortByDesc('value')
            ->values()
            ->all();

        return ['metric' => 'reply_rate_by_wilaya', 'groups' => $rows];
    }
}
