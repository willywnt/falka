-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STOCK_OVERSOLD', 'RESTOCK_URGENT', 'LOW_STOCK', 'DEAD_STOCK_CAPITAL', 'MARKETPLACE_CHANNEL_UNHEALTHY', 'ORDERS_TO_SHIP', 'RETURNS_PENDING', 'ORDER_PLACED', 'ORDER_SHIPPED', 'RETURN_OPENED', 'RETURN_PROCESSED', 'SALE_REFUNDED', 'SALE_BELOW_COST', 'PURCHASE_RECEIVED', 'OPNAME_POSTED', 'MARKETPLACE_SYNC_FAILED', 'MARKETPLACE_TOKEN_EXPIRING', 'TEAM_MEMBER_JOINED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('INVENTORY', 'ORDERS', 'RETURNS', 'SALES', 'PURCHASING', 'MARKETPLACE', 'TEAM', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('URGENT', 'WARNING', 'INFO', 'SUCCESS');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "actorUserId" TEXT,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "data" JSONB,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_reads" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_organizationId_dedupeKey_key" ON "notifications"("organizationId", "dedupeKey");

-- CreateIndex
CREATE INDEX "notifications_organizationId_recipientUserId_createdAt_idx" ON "notifications"("organizationId", "recipientUserId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_organizationId_category_createdAt_idx" ON "notifications"("organizationId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_entityType_entityId_idx" ON "notifications"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_reads_notificationId_userId_key" ON "notification_reads"("notificationId", "userId");

-- CreateIndex
CREATE INDEX "notification_reads_userId_idx" ON "notification_reads"("userId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
