import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import typescript from 'typescript-eslint';

const controlStatements = [
    'if',
    'return',
    'for',
    'while',
    'do',
    'switch',
    'try',
    'throw',
];
const paddingAroundControl = [
    ...controlStatements.flatMap((stmt) => [
        { blankLine: 'always', prev: '*', next: stmt },
        { blankLine: 'always', prev: stmt, next: '*' },
    ]),
];

/** @type {import('eslint').Linter.Config[]} */
export default [
    js.configs.recommended,
    reactHooks.configs.flat['recommended-latest'],
    ...typescript.configs.recommended,
    {
        ...react.configs.flat.recommended,
        ...react.configs.flat['jsx-runtime'],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        plugins: {
            import: importPlugin,
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
                node: true,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'import/consistent-type-specifier-style': [
                'error',
                'prefer-top-level',
            ],
        },
    },
    {
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
            '@stylistic/padding-line-between-statements': [
                'error',
                ...paddingAroundControl,
            ],
        },
    },
    {
        files: [
            'resources/js/**/*.{js,jsx,ts,tsx}',
            'resources/design-lab/**/*.{js,jsx,ts,tsx}',
        ],
        ignores: [
            'resources/js/evo/tokens/**',
            'resources/js/components/evilcharts/**',
        ],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: 'lucide-react',
                            message:
                                'Phosphor is the Evo icon set. Import from @/evo/icons.',
                        },
                        {
                            name: '@astryxdesign/core',
                            message:
                                '@astryxdesign was removed. Use Evo primitives.',
                        },
                        {
                            name: '@astryxdesign/theme-neutral',
                            message:
                                '@astryxdesign was removed. Use Evo tokens.',
                        },
                        {
                            name: 'radix-ui',
                            message:
                                'Import @radix-ui/react-* packages, not the radix-ui umbrella.',
                        },
                    ],
                    patterns: [
                        {
                            group: [
                                '@/components/ui/aurora',
                                '@/components/ui/aurora/*',
                                '@/components/aurora',
                                '@/components/aurora/*',
                                '**/components/ui/aurora/*',
                                '**/components/aurora/*',
                                '@astryxdesign/*',
                            ],
                            message:
                                'Aurora (AGPL-3.0-only) and Astryx were removed. Use @/evo/*.',
                        },
                    ],
                },
            ],
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        'Literal[raw=/#[0-9A-Fa-f]{3,8}\\b/]',
                    message:
                        'Raw hex belongs in resources/js/evo/tokens. Use a token or a Tailwind theme class.',
                },
                {
                    selector:
                        'TemplateElement[value.raw=/#[0-9A-Fa-f]{3,8}\\b/]',
                    message:
                        'Raw hex belongs in resources/js/evo/tokens. Use a token or a Tailwind theme class.',
                },
            ],
        },
    },
    {
        ignores: [
            'vendor',
            'node_modules',
            'public',
            'bootstrap/ssr',
            'tailwind.config.js',
            'vite.config.ts',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/components/evilcharts/**',
            'resources/design-lab/data/evocrm-demo-data.ts',
            'resources/design-lab/data/_generate-demo-data.mjs',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
        ],
    },
    prettier,
    {
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            curly: ['error', 'all'],
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
        },
    },
];
