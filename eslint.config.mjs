import { config as baseConfig } from './packages/eslint-config/base.js';
import globals from 'globals';

/** Root ESLint config for monorepo scripts (lint-staged runs from repository root). */
export default [
  ...baseConfig,
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },
];
