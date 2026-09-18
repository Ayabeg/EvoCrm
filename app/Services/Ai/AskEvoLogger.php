<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;

/**
 * Operational metadata only. Never log prompts, answers, facts, or secrets.
 */
final class AskEvoLogger
{
    /**
     * Operational keys only. Lengths and ids — never question text or fact values.
     *
     * @var list<string>
     */
    private const ALLOWED = [
        'workspace_id',
        'user_id',
        'context_kind',
        'entity_type',
        'entity_id',
        'scope_key',
        'question_chars',
        'fact_count',
        'outcome',
        'source',
        'latency_ms',
    ];

    /**
     * @param  array<string, int|string|bool|null>  $meta
     */
    public function record(string $event, array $meta): void
    {
        $safe = [];

        foreach ($meta as $key => $value) {
            if (! in_array($key, self::ALLOWED, true)) {
                continue;
            }

            $safe[$key] = $value;
        }

        Log::info('ask_evo.'.$event, $safe);
    }
}
