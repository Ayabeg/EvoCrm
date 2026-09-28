import { useCallback, useSyncExternalStore } from 'react';
import {
    AGENTS_VIEW_MODE_STORAGE_KEY,
    DEFAULT_AGENTS_VIEW_MODE,
    parseAgentsViewMode,
} from '@/lib/desk/agents-view-mode';
import type { AgentsViewMode } from '@/lib/desk/agents-view-mode';

let current: AgentsViewMode = DEFAULT_AGENTS_VIEW_MODE;
let hydrated = false;
const listeners = new Set<() => void>();

function readStored(): AgentsViewMode {
    if (typeof window === 'undefined') {
        return DEFAULT_AGENTS_VIEW_MODE;
    }

    try {
        return parseAgentsViewMode(
            window.localStorage.getItem(AGENTS_VIEW_MODE_STORAGE_KEY),
        );
    } catch {
        return DEFAULT_AGENTS_VIEW_MODE;
    }
}

function getSnapshot(): AgentsViewMode {
    if (!hydrated) {
        hydrated = true;
        current = readStored();
    }

    return current;
}

function getServerSnapshot(): AgentsViewMode {
    return DEFAULT_AGENTS_VIEW_MODE;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

function publish(next: AgentsViewMode): void {
    if (next === current && hydrated) {
        return;
    }

    hydrated = true;
    current = next;

    try {
        window.localStorage.setItem(AGENTS_VIEW_MODE_STORAGE_KEY, next);
    } catch {
        // Persist is optional; the in-memory mode still updates.
    }

    listeners.forEach((listener) => listener());
}

export function useAgentsViewMode(): [AgentsViewMode, (value: string) => void] {
    const mode = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    const setMode = useCallback((value: string) => {
        publish(parseAgentsViewMode(value, current));
    }, []);

    return [mode, setMode];
}
