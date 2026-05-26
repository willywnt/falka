import { join } from 'path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

// Load monorepo root .env so apps/web shares the same DATABASE_URL and secrets.
loadEnvConfig(join(__dirname, '../..'));

const nextConfig: NextConfig = {
  transpilePackages: ['@olshop/ui', '@olshop/config', '@olshop/types', '@olshop/utils', '@olshop/db'],
  typedRoutes: true,
};

export default nextConfig;
