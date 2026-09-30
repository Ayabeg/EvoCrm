import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(import.meta.dirname, 'resources/js'),
            '@lab': resolve(import.meta.dirname, 'resources/design-lab'),
        },
    },
    test: {
        include: [
            'resources/design-lab/**/*.test.ts',
            'resources/js/**/*.test.ts',
        ],
        environment: 'node',
    },
});
