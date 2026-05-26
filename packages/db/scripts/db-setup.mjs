import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ensureDatabase } from './ensure-database.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: packageRoot,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await ensureDatabase();

console.log('Running migrations...');
run('node', ['scripts/with-env.mjs', 'prisma', 'migrate', 'deploy']);

console.log('Seeding database...');
run('node', ['scripts/with-env.mjs', 'prisma', 'db', 'seed']);

console.log('Database setup complete.');
