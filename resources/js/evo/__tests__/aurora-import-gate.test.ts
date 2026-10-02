import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function walk(dir: string, acc: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        const stat = statSync(path);

        if (stat.isDirectory()) {
            walk(path, acc);
            continue;
        }

        if (/\.(ts|tsx|js|jsx)$/.test(path)) {
            acc.push(path);
        }
    }

    return acc;
}

describe('Aurora AGPL removal gate', () => {
    it('has deleted the last Aurora AGPL file', () => {
        const auroraDir = join(process.cwd(), 'resources/js/components/aurora');

        expect(existsSync(join(auroraDir, 'prompt-input.tsx'))).toBe(false);
        expect(existsSync(auroraDir)).toBe(false);
    });

    it('has no import of components/ui/aurora or components/aurora', () => {
        const root = join(process.cwd(), 'resources/js');
        const hits = walk(root).filter((file) => {
            const src = readFileSync(file, 'utf8');

            return (
                src.includes(['@/components/ui', 'aurora'].join('/')) ||
                src.includes(['components/ui', 'aurora/'].join('/')) ||
                src.includes(['@/components', 'aurora'].join('/')) ||
                src.includes(['from \'@/components', 'aurora'].join('/'))
            );
        });

        expect(hits).toEqual([]);
    });
});
