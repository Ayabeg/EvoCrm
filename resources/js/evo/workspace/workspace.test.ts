import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
    ACCEPTANCE_PATHS,
    countPrimaryActions,
    isGreetingTitle,
    pathnameFromUrl,
    resolveWorkspaceRoute,
} from '@/evo/workspace/routes';

const dir = dirname(fileURLToPath(import.meta.url));
const headerSource = readFileSync(join(dir, 'WorkspaceHeader.tsx'), 'utf8');
const frameSource = readFileSync(join(dir, 'WorkspaceFrame.tsx'), 'utf8');
const cssSource = readFileSync(join(dir, 'workspace-frame.css'), 'utf8');
const homeSource = readFileSync(
    join(dir, '../../pages/home.tsx'),
    'utf8',
);

describe('workspace header contract', () => {
    it('renders at most one primary action', () => {
        expect(countPrimaryActions(undefined)).toBe(0);
        expect(countPrimaryActions(null)).toBe(0);
        expect(countPrimaryActions(false)).toBe(0);
        expect(countPrimaryActions('Create')).toBe(1);
        expect(headerSource).toContain('data-workspace-primary="true"');
        expect(headerSource).toContain('data-primary-count={primaryCount}');
        expect(headerSource.match(/data-workspace-slot="h"/g)?.length).toBe(1);
        expect(headerSource.match(/data-workspace-primary=/g)?.length).toBe(1);
    });

    it('exposes the slot contract A–Q', () => {
        for (const slot of [
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
            'j',
            'l',
            'm',
            'n',
            'q',
        ]) {
            expect(headerSource).toContain(`data-workspace-slot="${slot}"`);
        }
    });

    it('never treats Accueil as a greeting', () => {
        expect(isGreetingTitle('Hello Evotechly')).toBe(true);
        expect(isGreetingTitle('Bonjour Evotechly')).toBe(true);
        expect(isGreetingTitle('Accueil')).toBe(false);
        expect(isGreetingTitle('Home')).toBe(false);
        expect(homeSource).toContain("title={t('Home')}");
        expect(homeSource).not.toContain("t('Hello :name'");
        expect(homeSource).toContain('<WorkspaceHeader');
        expect(homeSource).not.toContain('primaryAction=');
    });
});

describe('workspace route scroll owner', () => {
    it('maps each acceptance route to one archetype and one owner', () => {
        const expected: Record<
            string,
            { archetype: string; owner: string; shell: string }
        > = {
            '/dashboard': {
                archetype: 'document',
                owner: 'document',
                shell: 'frame',
            },
            '/crm/contacts': {
                archetype: 'workspace',
                owner: 'surface',
                shell: 'frame',
            },
            '/crm/deals': {
                archetype: 'workspace',
                owner: 'surface',
                shell: 'frame',
            },
            '/crm/deals/board': {
                archetype: 'workspace',
                owner: 'pipeline',
                shell: 'frame',
            },
            '/crm/contacts/12': {
                archetype: 'record',
                owner: 'columns',
                shell: 'frame',
            },
            '/crm/companies/4': {
                archetype: 'record',
                owner: 'columns',
                shell: 'frame',
            },
            '/crm/leads/9': {
                archetype: 'record',
                owner: 'columns',
                shell: 'frame',
            },
            '/inbox': {
                archetype: 'conversation',
                owner: 'conversation',
                shell: 'frame',
            },
            '/crm/quotes': {
                archetype: 'workspace',
                owner: 'surface',
                shell: 'frame',
            },
            '/crm/quotes/3': {
                archetype: 'document',
                owner: 'document',
                shell: 'frame',
            },
            '/settings': {
                archetype: 'document',
                owner: 'document',
                shell: 'frame',
            },
        };

        for (const [path, want] of Object.entries(expected)) {
            const resolution = resolveWorkspaceRoute(path);
            expect(resolution.migrated).toBe(true);
            expect(resolution.archetype).toBe(want.archetype);
            expect(resolution.scrollOwner).toBe(want.owner);
            expect(resolution.shellScroll).toBe(want.shell);
        }

        const reserved = resolveWorkspaceRoute('/crm/contacts/import');
        expect(reserved.migrated).toBe(false);
        expect(reserved.shellScroll).toBe('document');

        expect(pathnameFromUrl('/crm/contacts/?q=sara#row')).toBe(
            '/crm/contacts',
        );
        expect(ACCEPTANCE_PATHS).toContain('/dashboard');
    });

    it('does not nest overflow-y-auto on frame-owned acceptance routes', () => {
        expect(frameSource).toContain("data-shell-scroll={ownsScroll ? 'frame' : 'document'}");
        expect(cssSource).toContain(
            ".workspace-frame[data-shell-scroll='frame']:not([data-scroll-owner='document'])",
        );
        expect(cssSource).toContain('overflow-y: hidden');
        expect(cssSource).toContain(
            ".workspace-frame[data-shell-scroll='frame'][data-scroll-owner='document']",
        );
        expect(cssSource).toContain(
            ".workspace-frame[data-shell-scroll='document']",
        );
    });
});
