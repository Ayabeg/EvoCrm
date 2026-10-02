import { readdirSync, readFileSync, statSync } from 'node:fs';
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
    it('has no import of components/ui/aurora', () => {
        const root = join(process.cwd(), 'resources/js');
        const hits = walk(root).filter((file) => {
            const src = readFileSync(file, 'utf8');

            const banned = ['@/components/ui', 'aurora'].join('/');
            const bannedPath = ['components/ui', 'aurora/'].join('/');

            return src.includes(banned) || src.includes(bannedPath);
        });

        expect(hits).toEqual([]);
    });

    it('has no leftover aurora command palette import', () => {
        const root = join(process.cwd(), 'resources/js');
        const banned = ['@/components/aurora', 'command-palette'].join('/');
        const hits = walk(root).filter((file) => readFileSync(file, 'utf8').includes(banned));

        expect(hits).toEqual([]);
    });
});
