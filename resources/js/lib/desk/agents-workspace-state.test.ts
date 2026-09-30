import { describe, expect, it } from 'vitest';
import {
    INITIAL_AGENTS_WORKSPACE_STATE,
    transitionAgentsWorkspace,
} from '@/lib/desk/agents-workspace-state';

describe('agents workspace state', () => {
    it('opens the selected agent in the existing workspace view', () => {
        const next = transitionAgentsWorkspace(INITIAL_AGENTS_WORKSPACE_STATE, {
            type: 'select-agent',
            agentId: 'closer',
        });

        expect(next).toMatchObject({
            view: 'agent',
            selectedAgentId: 'closer',
            selectedChatId: null,
        });
    });

    it('keeps the selected chat when returning to the directory', () => {
        const opened = transitionAgentsWorkspace(
            INITIAL_AGENTS_WORKSPACE_STATE,
            { type: 'open-chat', agentId: 'closer', chatId: 'chat-1' },
        );
        const directory = transitionAgentsWorkspace(opened, {
            type: 'back-to-directory',
        });

        expect(directory).toMatchObject({
            view: 'directory',
            selectedAgentId: 'closer',
            selectedChatId: 'chat-1',
            selectedChatByAgent: { closer: 'chat-1' },
        });
    });

    it('restores the last chat when reopening an agent after switching agents', () => {
        const closerChat = transitionAgentsWorkspace(
            INITIAL_AGENTS_WORKSPACE_STATE,
            { type: 'open-chat', agentId: 'closer', chatId: 'chat-1' },
        );
        const qualifier = transitionAgentsWorkspace(closerChat, {
            type: 'select-agent',
            agentId: 'qualifier',
        });
        const closer = transitionAgentsWorkspace(qualifier, {
            type: 'select-agent',
            agentId: 'closer',
        });

        expect(closer).toMatchObject({
            view: 'agent',
            selectedAgentId: 'closer',
            selectedChatId: 'chat-1',
        });
    });

    it('switches the directory tab without changing its selected agent', () => {
        const selected = transitionAgentsWorkspace(
            INITIAL_AGENTS_WORKSPACE_STATE,
            { type: 'select-agent', agentId: 'quote-desk' },
        );
        const chatsTab = transitionAgentsWorkspace(selected, {
            type: 'set-directory-tab',
            tab: 'chats',
        });

        expect(chatsTab).toMatchObject({
            view: 'directory',
            tab: 'chats',
            selectedAgentId: 'quote-desk',
        });
    });
});
