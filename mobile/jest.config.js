/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'config/**/*.{ts,tsx}',
    'theme/**/*.{ts,tsx}',
    '!**/__tests__/**',
  ],
};
