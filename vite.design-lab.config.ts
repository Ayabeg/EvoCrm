import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    root: resolve(import.meta.dirname, 'resources/design-lab'),
    publicDir: resolve(import.meta.dirname, 'public'),
    plugins: [
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': resolve(import.meta.dirname, 'resources/js'),
            '@lab': resolve(import.meta.dirname, 'resources/design-lab'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5174,
        watch: {
            ignored: ['**/.agents/**', '**/vendor/**'],
        },
    },
});
