import { config as baseConfig } from './packages/eslint-config/base.js';

/** Root ESLint config: resolved by packages without a local eslint.config and by
 * lint-staged (which runs from the repository root). Node globals for `scripts/*.mjs`
 * now live in the shared base config. */
export default [...baseConfig];
