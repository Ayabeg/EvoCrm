<?php

namespace App\Support;

use App\Models\Lead;
use InvalidArgumentException;

final class LeadPath
{
    /**
     * Salesforce Path labels mapped onto existing lead statuses.
     * Contacted and Nurturing both persist as `working`; the step lives in payload.path_step.
     *
     * @var list<array{key: string, label: string, status: string}>
     */
    public const STEPS = [
        ['key' => 'new', 'label' => 'New', 'status' => 'new'],
        ['key' => 'contacted', 'label' => 'Contacted', 'status' => 'working'],
        ['key' => 'nurturing', 'label' => 'Nurturing', 'status' => 'working'],
        ['key' => 'unqualified', 'label' => 'Unqualified', 'status' => 'disqualified'],
        ['key' => 'converted', 'label' => 'Converted', 'status' => 'qualified'],
    ];

    public static function current(Lead $lead): string
    {
        $payload = is_array($lead->payload) ? $lead->payload : [];
        $step = $payload['path_step'] ?? null;

        return match ($lead->status) {
            'qualified' => 'converted',
            'disqualified' => 'unqualified',
            'new' => 'new',
            default => in_array($step, ['contacted', 'nurturing'], true)
                ? (string) $step
                : 'contacted',
        };
    }

    /**
     * @return array{steps: list<array{key: string, label: string, status: string}>, current: string, next: string|null, complete: bool}
     */
    public static function present(Lead $lead): array
    {
        $current = self::current($lead);
        $keys = array_column(self::STEPS, 'key');
        $index = array_search($current, $keys, true);
        $next = is_int($index) ? ($keys[$index + 1] ?? null) : null;

        return [
            'steps' => self::STEPS,
            'current' => $current,
            'next' => $next,
            'complete' => $current === 'converted',
        ];
    }

    public static function apply(Lead $lead, string $step): void
    {
        if ($step === 'converted') {
            throw new InvalidArgumentException('Converted is reached through Convert, not Path.');
        }

        $match = collect(self::STEPS)->firstWhere('key', $step);

        if (! is_array($match)) {
            throw new InvalidArgumentException("Unknown path step [{$step}].");
        }

        $payload = is_array($lead->payload) ? $lead->payload : [];
        $payload['path_step'] = $step;

        $lead->forceFill([
            'status' => $match['status'],
            'payload' => $payload,
        ])->save();
    }
}
