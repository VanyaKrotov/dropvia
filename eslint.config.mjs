import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'build/**',
      '.react-router/**',
      '.agents/**',
      '.taste-skill/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', '*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  ...[
    ['shared', ['app', 'pages', 'widgets', 'features', 'entities']],
    ['entities', ['app', 'pages', 'widgets', 'features']],
    ['features', ['app', 'pages', 'widgets']],
    ['widgets', ['app', 'pages']],
    ['pages', ['app']],
  ].map(([layer, forbidden]) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: forbidden.flatMap((name) => [`**/${name}/**`, `@${name}/**`]),
        },
      ],
    },
  })),
  {
    files: ['scripts/**/*.mjs', '*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
      },
    },
  },
  prettier,
  {
    rules: {
      curly: ['error', 'all'],
    },
  },
);
