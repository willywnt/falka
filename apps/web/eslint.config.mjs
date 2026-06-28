import { nextJsConfig } from '@palka/eslint-config/next-js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    ignores: ['next-env.d.ts'],
  },
];
