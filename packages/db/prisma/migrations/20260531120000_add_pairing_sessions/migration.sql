-- CreateEnum
CREATE TYPE "PairingSessionStatus" AS ENUM ('PENDING', 'CONNECTED', 'DISCONNECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "pairing_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pairingCode" TEXT NOT NULL,
    "status" "PairingSessionStatus" NOT NULL DEFAULT 'PENDING',
    "connectedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deviceInfo" JSONB,
    "lastScanAt" TIMESTAMP(3),
    "lastBarcode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pairing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pairing_sessions_userId_idx" ON "pairing_sessions"("userId");

-- CreateIndex
CREATE INDEX "pairing_sessions_status_idx" ON "pairing_sessions"("status");

-- CreateIndex
CREATE INDEX "pairing_sessions_expiresAt_idx" ON "pairing_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "pairing_sessions" ADD CONSTRAINT "pairing_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
