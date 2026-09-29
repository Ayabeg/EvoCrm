import { useSyncExternalStore } from 'react';

export type AgentsWorkspaceView = 'directory' | 'agent';
export type AgentsDirectoryTab = 'agents' | 'chats';

export type AgentsWorkspaceState = {
    view: AgentsWorkspaceView;
    selectedAgentId: string | null;
    selectedChatId: string | null;
    selectedChatByAgent: Record<string, string>;
    tab: AgentsDirectoryTab;
};

export type AgentsWorkspaceAction =
    | { type: 'select-agent'; agentId: string }
    | { type: 'open-chat'; agentId: string; chatId: string }
    | { type: 'back-to-directory' }
    | { type: 'set-directory-tab'; tab: AgentsDirectoryTab };

export const INITIAL_AGENTS_WORKSPACE_STATE: AgentsWorkspaceState = {
    view: 'directory',
    selectedAgentId: null,
    selectedChatId: null,
    selectedChatByAgent: {},
    tab: 'agents',
};

export function transitionAgentsWorkspace(
    state: AgentsWorkspaceState,
    action: AgentsWorkspaceAction,
): AgentsWorkspaceState {
    switch (action.type) {
        case 'select-agent':
            return {
                ...state,
                view: 'agent',
                selectedAgentId: action.agentId,
                selectedChatId:
                    state.selectedAgentId === action.agentId
                        ? state.selectedChatId
                        : (state.selectedChatByAgent[action.agentId] ?? null),
            };
        case 'open-chat':
            return {
                ...state,
                view: 'agent',
                selectedAgentId: action.agentId,
                selectedChatId: action.chatId,
                selectedChatByAgent: {
                    ...state.selectedChatByAgent,
                    [action.agentId]: action.chatId,
                },
            };
        case 'back-to-directory':
            return { ...state, view: 'directory' };
        case 'set-directory-tab':
            return { ...state, view: 'directory', tab: action.tab };
    }
}

let state = INITIAL_AGENTS_WORKSPACE_STATE;
const listeners = new Set<() => void>();

export function subscribeAgentsWorkspace(listener: () => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

export function getAgentsWorkspaceState(): AgentsWorkspaceState {
    return state;
}

export function dispatchAgentsWorkspace(action: AgentsWorkspaceAction): void {
    state = transitionAgentsWorkspace(state, action);
    listeners.forEach((listener) => listener());
}

export function useAgentsWorkspaceState(): AgentsWorkspaceState {
    return useSyncExternalStore(
        subscribeAgentsWorkspace,
        getAgentsWorkspaceState,
        () => INITIAL_AGENTS_WORKSPACE_STATE,
    );
}
