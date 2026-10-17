/**
 * P20 execution history contract. Replay is explicit and only available for failed runs.
 */

export const WORKFLOW_EXECUTION_STATUSES = [
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
] as const;

export type WorkflowExecutionStatus =
    (typeof WORKFLOW_EXECUTION_STATUSES)[number];

export type WorkflowExecutionRecordRef = {
    visible: boolean;
    kind: 'contact' | 'deal' | 'ticket';
    id: number | null;
    label: string | null;
    href: string | null;
};

export type WorkflowExecutionRow = {
    id: number;
    workflow_id: number;
    workflow_name: string;
    workflow_active: boolean;
    status: WorkflowExecutionStatus | string;
    status_label: string;
    is_delayed: boolean;
    is_terminal: boolean;
    can_retry: boolean;
    trigger: string | null;
    branch: 'then' | 'else' | string | null;
    action: string | null;
    condition_passed: boolean | null;
    delay_minutes: number;
    run_at: string | null;
    started_at: string | null;
    finished_at: string | null;
    duration_seconds: number | null;
    failure: string | null;
    record: {
        contact: WorkflowExecutionRecordRef;
        deal: WorkflowExecutionRecordRef;
        ticket: WorkflowExecutionRecordRef;
    };
    error?: string | null;
    result?: Record<string, unknown> | null;
    action_parameters?: Record<string, unknown> | null;
    inspect_href?: string;
};

export type WorkflowExecutionPage = {
    data: WorkflowExecutionRow[];
    paginator: {
        page: number;
        last_page: number;
        per_page: number;
        total: number;
        prev_href: string | null;
        next_href: string | null;
    };
    filters: {
        workflow_id: number | null;
        status: string | null;
    };
    metrics: {
        pending: number;
        running: number;
        completed: number;
        failed: number;
        cancelled: number;
    };
    selected: WorkflowExecutionRow | null;
    contract: {
        retry_available: boolean;
        test_available: boolean;
        review_is_not_a_run: boolean;
        disable_cancels_pending: boolean;
        disable_does_not_rewrite_history: boolean;
        delete_removes_history: boolean;
        states: string[];
        secret_redaction: string[];
    };
};

export const EMPTY_EXECUTION_PAGE: WorkflowExecutionPage = {
    data: [],
    paginator: {
        page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
        prev_href: null,
        next_href: null,
    },
    filters: {
        workflow_id: null,
        status: null,
    },
    metrics: {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
    },
    selected: null,
    contract: {
        retry_available: true,
        test_available: false,
        review_is_not_a_run: true,
        disable_cancels_pending: true,
        disable_does_not_rewrite_history: true,
        delete_removes_history: true,
        states: [...WORKFLOW_EXECUTION_STATUSES],
        secret_redaction: [],
    },
};

export function executionHistoryHref(params: {
    page?: number;
    workflowId?: number | null;
    status?: string | null;
    execution?: number | null;
}): string {
    const search = new URLSearchParams();
    search.set('view', 'history');

    if (params.page && params.page > 1) {
        search.set('history_page', String(params.page));
    }

    if (params.workflowId) {
        search.set('history_workflow_id', String(params.workflowId));
    }

    if (params.status) {
        search.set('history_status', params.status);
    }

    if (params.execution) {
        search.set('execution', String(params.execution));
    }

    return `/crm/workflows?${search.toString()}`;
}

export function formatExecutionTimestamp(iso: string | null): string {
    if (!iso) {
        return 'Unknown';
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatExecutionDuration(seconds: number | null): string {
    if (seconds === null || seconds < 0) {
        return 'Unknown';
    }

    if (seconds < 1) {
        return '<1s';
    }

    if (seconds < 60) {
        return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
}

export function executionRecordLabel(row: WorkflowExecutionRow): string {
    const parts = [row.record.contact, row.record.deal, row.record.ticket]
        .filter((item) => item.id !== null)
        .map((item) => item.label ?? 'Record hidden');

    return parts.length > 0 ? parts.join(' · ') : 'No linked record';
}

export function branchLabel(branch: string | null): string {
    if (branch === 'then') {
        return 'THEN';
    }

    if (branch === 'else') {
        return 'ELSE';
    }

    return 'None';
}

export function executionBadgeVariant(
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'completed') {
        return 'default';
    }

    if (status === 'failed') {
        return 'destructive';
    }

    if (status === 'pending' || status === 'running') {
        return 'secondary';
    }

    return 'outline';
}
