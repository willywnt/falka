/**
 * Local infrastructure manager (PostgreSQL + Redis via Docker Compose).
 *
 * Usage:
 *   node scripts/infra.mjs up
 *   node scripts/infra.mjs down
 *   node scripts/infra.mjs reset [--yes]
 *   node scripts/infra.mjs wait
 *   node scripts/infra.mjs status
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

const monorepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const composeFile = resolve(monorepoRoot, 'docker-compose.yml');
const envPath = resolve(monorepoRoot, '.env');

config({ path: envPath });

function hasDocker() {
  const result = spawnSync('docker', ['--version'], {
    shell: process.platform === 'win32',
    stdio: 'ignore',
  });
  return result.status === 0;
}

function runDockerCompose(args, { inherit = true } = {}) {
  if (!existsSync(composeFile)) {
    console.error('docker-compose.yml not found.');
    process.exit(1);
  }

  if (!hasDocker()) {
    console.error('\nDocker is not installed or not in PATH.');
    console.error('Install Docker Desktop: https://docs.docker.com/get-docker/\n');
    process.exit(1);
  }

  const result = spawnSync('docker', ['compose', ...args, '-f', composeFile], {
    stdio: inherit ? 'inherit' : 'pipe',
    shell: process.platform === 'win32',
    cwd: monorepoRoot,
    encoding: 'utf8',
  });

  return result;
}

function runPnpm(script) {
  const result = spawnSync('pnpm', [script], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: monorepoRoot,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function waitForPostgres(maxAttempts = 30, delayMs = 2000) {
  console.log('Waiting for PostgreSQL...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = runDockerCompose(
      ['exec', '-T', 'postgres', 'pg_isready', '-U', process.env.POSTGRES_USER ?? 'postgres'],
      { inherit: false },
    );

    if (result.status === 0) {
      console.log('PostgreSQL is ready.');
      return true;
    }

    console.log(`  attempt ${attempt}/${maxAttempts}`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
  }

  console.error('PostgreSQL did not become ready in time.');
  return false;
}

async function waitForRedis(maxAttempts = 20, delayMs = 1000) {
  console.log('Waiting for Redis...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = runDockerCompose(['exec', '-T', 'redis', 'redis-cli', 'ping'], {
      inherit: false,
    });

    if (result.stdout?.includes('PONG')) {
      console.log('Redis is ready.');
      return true;
    }

    console.log(`  attempt ${attempt}/${maxAttempts}`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
  }

  console.error('Redis did not become ready in time.');
  return false;
}

const command = process.argv[2];

if (command === 'up') {
  console.log('Starting local infrastructure (PostgreSQL + Redis)...');
  runDockerCompose(['up', '-d']);
  process.exit(0);
}

if (command === 'down') {
  console.log('Stopping local infrastructure...');
  runDockerCompose(['down']);
  process.exit(0);
}

if (command === 'status') {
  runDockerCompose(['ps']);
  process.exit(0);
}

if (command === 'wait') {
  const postgresReady = await waitForPostgres();
  const redisReady = await waitForRedis();
  process.exit(postgresReady && redisReady ? 0 : 1);
}

if (command === 'reset') {
  const force = process.argv.includes('--yes');

  if (!force) {
    console.error('infra reset destroys Docker volumes (PostgreSQL + Redis data).');
    console.error('Re-run with --yes to confirm: pnpm infra:reset -- --yes');
    process.exit(1);
  }

  console.log('Resetting local infrastructure...');
  runDockerCompose(['down', '-v']);
  runDockerCompose(['up', '-d']);

  const ready = (await waitForPostgres()) && (await waitForRedis());
  if (!ready) process.exit(1);

  console.log('Re-running database migrations and seed...');
  runPnpm('db:migrate:deploy');
  runPnpm('db:seed');
  console.log('Infrastructure reset complete.');
  process.exit(0);
}

console.error('Usage: node scripts/infra.mjs <up|down|reset|wait|status>');
process.exit(1);
