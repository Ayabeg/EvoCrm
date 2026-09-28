export const AGENTS_VIEW_MODES = ['grid', 'list', 'table'] as const;

export type AgentsViewMode = (typeof AGENTS_VIEW_MODES)[number];

export const DEFAULT_AGENTS_VIEW_MODE: AgentsViewMode = 'list';

export const AGENTS_VIEW_MODE_STORAGE_KEY = 'evocrm.agents.view-mode';

export function isAgentsViewMode(value: unknown): value is AgentsViewMode {
    return value === 'grid' || value === 'list' || value === 'table';
}

export function parseAgentsViewMode(
    value: unknown,
    fallback: AgentsViewMode = DEFAULT_AGENTS_VIEW_MODE,
): AgentsViewMode {
    return isAgentsViewMode(value) ? value : fallback;
}
