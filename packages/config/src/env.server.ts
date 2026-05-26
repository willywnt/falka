import { z } from 'zod';

const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().min(1),

  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url().optional(),

  REDIS_URL: z.string().url().optional(),

  SHOPEE_PARTNER_ID: z.string().optional(),
  SHOPEE_PARTNER_KEY: z.string().optional(),
  TOKOPEDIA_CLIENT_ID: z.string().optional(),
  TOKOPEDIA_CLIENT_SECRET: z.string().optional(),

  MARKETPLACE_ENCRYPTION_SECRET: z.string().min(32),

  LOG_LEVEL: logLevelSchema.optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid server environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables');
  }

  cached = parsed.data;
  return cached;
}

/** Validated server environment. Access at runtime only. */
export const serverEnv = new Proxy({} as ServerEnv, {
  get(_target, prop: string) {
    return getServerEnv()[prop as keyof ServerEnv];
  },
});

export { logLevelSchema };
