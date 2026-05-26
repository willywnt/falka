import { getServerEnv } from '@olshop/config/env.server';

import { prisma } from './client.js';

export function getDatabaseUrl(): string {
  return getServerEnv().DATABASE_URL;
}

export async function connectDb(): Promise<void> {
  getDatabaseUrl();
  await prisma.$connect();
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

export async function healthCheckDb(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
