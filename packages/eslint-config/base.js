import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import onlyWarn from 'eslint-plugin-only-warn';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      onlyWarn,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  {
    // Node CLI scripts (db/docker helpers, migrations, worker bootstrap). `**/` so it
    // matches `scripts/` under every package, not just the config file's base dir —
    // otherwise packages resolving the repo-root config get no Node globals for their
    // own `packages/*/scripts/*.mjs` and trip `no-undef` on `process`/`console`.
    files: ['**/scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },
  {
    // Global ignores (object with only `ignores`). Use a `**/` prefix so the patterns
    // match build output at ANY depth: a package that resolves the repo-root config
    // (no local eslint.config) would otherwise anchor `dist/**` to the repo root and
    // still lint its own `packages/*/dist/**`.
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/coverage/**'],
  },
];

export default config;
