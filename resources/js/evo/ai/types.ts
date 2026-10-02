/**
 * Shared agent message contracts for Evo AI surfaces.
 * Optional fields stay empty on the Ask Evo production path.
 */

export type AgentToolStatus = 'running' | 'done' | 'error';

export type AgentToolCall = {
    id: string;
    name: string;
    status: AgentToolStatus;
    input?: string;
    output?: string;
    error?: string;
};

export type AgentApprovalStatus = 'pending' | 'approved' | 'denied';

export type AgentApproval = {
    id: string;
    title: string;
    description?: string;
    action?: string;
    payload?: Record<string, unknown>;
    status: AgentApprovalStatus;
};

export type AgentPlanStep = {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'done' | 'error';
};

export type AgentPlan = {
    title: string;
    steps: AgentPlanStep[];
};

export type AgentProgress = {
    label: string;
    current: number;
    total: number;
};

export type AgentTaskItem = {
    id: string;
    label: string;
    done: boolean;
};

export const evoFocus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evo-focus focus-visible:ring-offset-2 focus-visible:ring-offset-evo-canvas';
