import {
  getDefaultRecalculateStoragePayload,
  processRecalculateStorageJob,
} from '@falka/queue';

const dryRun = process.argv.includes('--dry-run');
const orgIdArg = process.argv.find((arg) => arg.startsWith('--org='));
const organizationId = orgIdArg?.slice('--org='.length);

const payload = {
  ...getDefaultRecalculateStoragePayload(),
  ...(organizationId ? { organizationId } : {}),
  dryRun,
};

console.log(`Running recalculate-storage (dryRun=${dryRun})...`);

const stats = await processRecalculateStorageJob(payload);

console.log('Result:', JSON.stringify(stats, null, 2));
