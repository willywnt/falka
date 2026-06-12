// One-shot sanity check for the add_organizations backfill (run via with-env).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = await prisma.user.count();
const orgs = await prisma.organization.count();
const members = await prisma.organizationMember.count();
const owners = await prisma.organizationMember.count({ where: { role: 'OWNER' } });
const orphans = {};
for (const model of [
  'pairingSession',
  'recording',
  'recordingShareLink',
  'marketplaceConnection',
  'product',
  'productVariant',
  'bundle',
  'stockLedger',
  'marketplaceProduct',
  'marketplaceProductMapping',
  'marketplaceSyncJob',
  'order',
  'return',
  'sale',
  'saleRefund',
  'purchaseOrder',
  'stockOpname',
]) {
  orphans[model] = await prisma[model].count({ where: { organizationId: null } });
}

console.log(JSON.stringify({ users, orgs, members, owners, orphans }, null, 2));
await prisma.$disconnect();
