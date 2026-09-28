/**
 * Test-only Agents view-mode proofs. Never import from an Inertia page.
 */
import {
    DEFAULT_AGENTS_VIEW_MODE,
    isAgentsViewMode,
    parseAgentsViewMode,
} from '../../resources/js/lib/desk/agents-view-mode';

function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
            `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
        );
    }
}

function expectTrue(value: boolean, label: string): void {
    if (!value) {
        throw new Error(label);
    }
}

expectEqual(
    DEFAULT_AGENTS_VIEW_MODE,
    'list',
    'default view is the current list',
);
expectTrue(isAgentsViewMode('grid'), 'grid is a view mode');
expectTrue(isAgentsViewMode('list'), 'list is a view mode');
expectTrue(isAgentsViewMode('table'), 'table is a view mode');
expectTrue(!isAgentsViewMode('board'), 'board is not an agents view mode');
expectEqual(parseAgentsViewMode('table'), 'table', 'parses table');
expectEqual(
    parseAgentsViewMode('nope'),
    'list',
    'unknown values fall back to list',
);
expectEqual(
    parseAgentsViewMode(null, 'grid'),
    'grid',
    'null uses the provided fallback',
);

console.log('Agents view-mode JS proofs passed');
