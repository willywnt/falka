import {
  getDefaultRecalculateStoragePayload,
  processRecalculateStorageJob,
} from '@olshop/queue';

const dryRun = process.argv.includes('--dry-run');
const userIdArg = process.argv.find((arg) => arg.startsWith('--user='));
const userId = userIdArg?.slice('--user='.length);

const payload = {
  ...getDefaultRecalculateStoragePayload(),
  ...(userId ? { userId } : {}),
  dryRun,
};

console.log(`Running recalculate-storage (dryRun=${dryRun})...`);

const stats = await processRecalculateStorageJob(payload);

console.log('Result:', JSON.stringify(stats, null, 2));
