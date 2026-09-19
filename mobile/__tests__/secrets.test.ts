import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');
const SKIP = new Set(['node_modules', '.expo', 'dist', 'coverage', '__tests__']);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name) || name.startsWith('.')) {
      return [];
    }
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe('no secrets in the Expo workspace', () => {
  it('does not ship Laravel or provider credentials', () => {
    const forbidden =
      /APP_KEY=.+|META_APP_SECRET=.+|SANCTUM_TOKEN=.+|SMTP_PASSWORD=.+|EVOLUTION_API_KEY=.+|BEGIN PRIVATE KEY/;
    const hits = walk(ROOT)
      .filter((file) => /\.(ts|tsx|js|json|md|env|example)$/.test(file))
      .filter((file) => forbidden.test(readFileSync(file, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('does not write Sanctum tokens through AsyncStorage', () => {
    const hits = walk(ROOT)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => {
        const source = readFileSync(file, 'utf8');
        return (
          /AsyncStorage\.(setItem|mergeItem)/.test(source) &&
          /sanctum|plainTextToken|Bearer /.test(source)
        );
      });
    expect(hits).toEqual([]);
  });

  it('does not log tokens or passwords', () => {
    const hits = walk(ROOT)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => {
        const source = readFileSync(file, 'utf8');
        return /console\.(log|info|debug|warn)\([^)]*(token|password|Authorization)/i.test(source);
      });
    expect(hits).toEqual([]);
  });
});
