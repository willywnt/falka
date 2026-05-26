/**
 * Apply R2 bucket CORS rules required for browser presigned PUT uploads.
 *
 * Usage:
 *   node scripts/apply-r2-cors.mjs
 *   node scripts/apply-r2-cors.mjs --file scripts/r2-cors.production.example.json
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

const corsFileArgIndex = process.argv.indexOf('--file');
const corsFile = join(
  root,
  corsFileArgIndex >= 0 ? process.argv[corsFileArgIndex + 1] : 'scripts/r2-cors.json',
);

function loadEnv() {
  const env = {};

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const [key, ...rest] = line.split('=');
    env[key.trim()] = rest.join('=').trim();
  }

  return env;
}

const env = loadEnv();
const accountId = env.R2_ACCOUNT_ID;
const bucket = env.R2_BUCKET_NAME;

if (!accountId || !bucket || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
  console.error('Missing R2_* variables in .env');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const corsRules = JSON.parse(readFileSync(corsFile, 'utf8'));

await client.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: corsRules,
  }),
);

console.log(`Applied CORS to R2 bucket "${bucket}" from ${corsFile}.`);
