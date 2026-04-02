const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    files: ['src/**/*.ts'],
    ignores: ['**/*.d.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Disable base rule — replaced by TS-aware version
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Disallow explicit `any` — use unknown or proper types instead
      '@typescript-eslint/no-explicit-any': 'error',

      // Don't require return types on every function — TS infers them
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Prefer const over let where value is never reassigned
      'prefer-const': 'error',

      // No var declarations
      'no-var': 'error',

      // Strict equality
      'eqeqeq': ['error', 'always'],

      // Warn on console usage — use a logger in production code
      'no-console': 'warn',
    },
  },
];
