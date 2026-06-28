/**
 * One-off probe: how much report-relevant data does the local DB hold, and which org
 * has the richest set (for the reporting SQL-aggregation POC validation). Run:
 *   pnpm --filter @palka/db exec node scripts/with-env.mjs tsx scripts/probe-report-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [sales, saleItems, taxInclusiveSales, refundItems, orders, orderItems, returnsReceived] =
    await Promise.all([
      prisma.sale.groupBy({ by: ['organizationId', 'status'], _count: { _all: true } }),
      prisma.saleItem.count(),
      prisma.sale.count({ where: { taxInclusive: true } }),
      prisma.saleRefundItem.count(),
      prisma.order.groupBy({ by: ['organizationId', 'status'], _count: { _all: true } }),
      prisma.orderItem.count(),
      prisma.return.count({ where: { status: 'RECEIVED' } }),
    ]);

  console.log('=== totals ===');
  console.log({
    saleItems,
    taxInclusiveSales,
    refundItems,
    orderItems,
    returnsReceived,
  });

  console.log('\n=== sales by org+status ===');
  for (const row of sales) {
    console.log(`  ${row.organizationId}  ${row.status}  ×${row._count._all}`);
  }
  console.log('\n=== orders by org+status ===');
  for (const row of orders) {
    console.log(`  ${row.organizationId}  ${row.status}  ×${row._count._all}`);
  }

  // Pick the org with the most sale rows for the validation.
  const byOrg = new Map<string, number>();
  for (const row of sales)
    byOrg.set(row.organizationId, (byOrg.get(row.organizationId) ?? 0) + row._count._all);
  for (const row of orders)
    byOrg.set(row.organizationId, (byOrg.get(row.organizationId) ?? 0) + row._count._all);
  const top = [...byOrg.entries()].sort((a, b) => b[1] - a[1])[0];
  console.log('\n=== richest org (use for POC) ===');
  console.log(top ? `  ${top[0]}  (${top[1]} sale+order rows)` : '  (no data)');
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    return prisma.$disconnect().then(() => process.exit(1));
  });
