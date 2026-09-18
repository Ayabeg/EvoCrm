<?php

namespace App\Services\Crm;

use App\Models\WorkflowExecution;
use Carbon\CarbonInterface;

final class WorkflowExecutionOutcome
{
    /**
     * @param  array<string, mixed>|null  $resultSummary
     * @param  array<string, mixed>|null  $actionParameters
     */
    public function __construct(
        public readonly string $status,
        public readonly ?string $branch,
        public readonly ?string $action,
        public readonly ?bool $conditionPassed,
        public readonly ?array $resultSummary,
        public readonly ?string $errorSummary,
        public readonly ?array $actionParameters,
        public readonly CarbonInterface $startedAt,
        public readonly CarbonInterface $finishedAt,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function attributes(WorkflowExecutionRedactor $redactor): array
    {
        return [
            'branch' => $this->branch,
            'action' => $this->action,
            'condition_passed' => $this->conditionPassed,
            'action_parameters' => $this->actionParameters !== null
                ? $redactor->redactParameters($this->actionParameters)
                : null,
            'result_summary' => $redactor->redactResult($this->resultSummary),
            'error_summary' => $redactor->redactError($this->errorSummary),
            'started_at' => $this->startedAt,
            'finished_at' => $this->finishedAt,
            'status' => $this->status,
        ];
    }

    public function succeeded(): bool
    {
        return $this->status === WorkflowExecution::STATUS_COMPLETED;
    }
}
