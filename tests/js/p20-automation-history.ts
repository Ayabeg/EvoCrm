/**
 * Test-only P20 automation history proofs. Never import from an Inertia page.
 * Pest source-locks this file. Do not spawn vite-node from CI.
 */
import {
    EMPTY_EXECUTION_PAGE,
    WORKFLOW_EXECUTION_STATUSES,
    branchLabel,
    executionBadgeVariant,
    executionHistoryHref,
    executionRecordLabel,
    formatExecutionDuration,
    formatExecutionTimestamp,
} from '../../resources/js/lib/workflow-execution';
import type { WorkflowExecutionRow } from '../../resources/js/lib/workflow-execution';

function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function expectTrue(value: boolean, label: string): void {
    if (!value) {
        throw new Error(label);
    }
}

expectEqual(
    [...WORKFLOW_EXECUTION_STATUSES],
    ['pending', 'running', 'completed', 'failed', 'cancelled'],
    'execution statuses match persisted WorkflowExecution::STATUSES',
);

expectEqual(EMPTY_EXECUTION_PAGE.contract.retry_available, false, 'retry is not available');
expectEqual(EMPTY_EXECUTION_PAGE.contract.test_available, false, 'fake test run is not available');
expectEqual(EMPTY_EXECUTION_PAGE.contract.review_is_not_a_run, true, 'review is not a run');

expectEqual(
    executionHistoryHref({ page: 2, workflowId: 9, status: 'failed', execution: 4 }),
    '/crm/workflows?view=history&history_page=2&history_workflow_id=9&history_status=failed&execution=4',
    'history href stays on the automation page',
);

expectEqual(branchLabel('then'), 'THEN', 'then branch label');
expectEqual(branchLabel('else'), 'ELSE', 'else branch label');
expectEqual(branchLabel(null), 'None', 'missing branch is none, not skipped');

expectEqual(executionBadgeVariant('completed'), 'default', 'completed badge');
expectEqual(executionBadgeVariant('failed'), 'destructive', 'failed badge');
expectEqual(executionBadgeVariant('pending'), 'secondary', 'pending badge');
expectEqual(executionBadgeVariant('cancelled'), 'outline', 'cancelled badge');

expectEqual(formatExecutionTimestamp(null), 'Unknown', 'missing timestamp is unknown');
expectEqual(formatExecutionDuration(null), 'Unknown', 'missing duration is unknown');
expectEqual(formatExecutionDuration(0), '<1s', 'sub-second duration');

const hidden: WorkflowExecutionRow = {
    id: 1,
    workflow_id: 2,
    workflow_name: 'Follow-up',
    workflow_active: false,
    status: 'completed',
    status_label: 'Completed',
    is_delayed: false,
    is_terminal: true,
    can_retry: false,
    trigger: 'contact.created',
    branch: 'then',
    action: 'create_task',
    condition_passed: null,
    delay_minutes: 0,
    run_at: null,
    started_at: null,
    finished_at: null,
    duration_seconds: null,
    failure: null,
    record: {
        contact: {
            visible: false,
            kind: 'contact',
            id: 11,
            label: 'Record hidden',
            href: null,
        },
        deal: {
            visible: false,
            kind: 'deal',
            id: null,
            label: null,
            href: null,
        },
        ticket: {
            visible: false,
            kind: 'ticket',
            id: null,
            label: null,
            href: null,
        },
    },
};

expectEqual(executionRecordLabel(hidden), 'Record hidden', 'hidden records do not leak names');
expectTrue(hidden.can_retry === false, 'rows never advertise retry');

console.log('p20-automation-history proofs passed');
