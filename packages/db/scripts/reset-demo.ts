/**
 * Reset ONLY the demo lifecycle data so the order pull → reserve/ship/release/return
 * flow can be re-tested from scratch, without nuking the rest of the database:
 *   - deletes the demo user's orders (cascades order items + returns)
 *   - clears the demo store's pull cooldown (lastOrdersPulledAt)
 *   - resets each demo variant's stock to its seed level (reserved/damaged → 0)
 *     and replaces its ledger with a single fresh RESTOCK row
 *
 * Idempotent and safe to run repeatedly. After running, RESTART the dev server so
 * the stub adapter's in-memory pull counter rewinds to pull #1. Run:
 *   pnpm --filter @olshop/db db:reset-demo
 */
import { PrismaClient } from '@prisma/client';

import { DEMO_SHOP_ID, DEMO_USER_EMAIL, DEMO_VARIANTS } from '../prisma/demo-data';

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!demoUser) {
    console.log(
      `No demo user (${DEMO_USER_EMAIL}). Run \`pnpm --filter @olshop/db db:seed\` first.`,
    );
    return;
  }
  const userId = demoUser.id;

  const deletedOrders = await prisma.order.deleteMany({ where: { userId } });
  const deletedSales = await prisma.sale.deleteMany({ where: { userId } });

  await prisma.marketplaceConnection.updateMany({
    where: { userId, shopId: DEMO_SHOP_ID },
    data: { lastOrdersPulledAt: null },
  });

  let resetVariants = 0;
  for (const demo of DEMO_VARIANTS) {
    const variant = await prisma.productVariant.findFirst({ where: { userId, sku: demo.sku } });
    if (!variant) continue;

    await prisma.$transaction(async (tx) => {
      await tx.stockLedger.deleteMany({ where: { variantId: variant.id } });
      await tx.inventory.upsert({
        where: { variantId: variant.id },
        create: { variantId: variant.id, availableStock: demo.stock, lastAdjustedAt: new Date() },
        update: {
          availableStock: demo.stock,
          reservedStock: 0,
          damagedStock: 0,
          lastAdjustedAt: new Date(),
        },
      });
      await tx.stockLedger.create({
        data: {
          userId,
          variantId: variant.id,
          delta: demo.stock,
          balanceAfter: demo.stock,
          reason: 'RESTOCK',
          source: 'MANUAL',
          note: 'Demo reset',
        },
      });
    });
    resetVariants += 1;
  }

  console.log(
    `Demo reset: removed ${deletedOrders.count} order(s) (+ their returns) and ${deletedSales.count} sale(s), reset ${resetVariants} variant(s) to seed stock, cleared pull cooldown.`,
  );
  console.log('Restart the dev server to rewind the stub pull timeline to #1.');
}

main()
  .catch((error) => {
    console.error('Demo reset failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
