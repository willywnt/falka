-- Track the last successful credential login (time + IP) for the Settings security
-- view. Best-effort stamp on login. Additive nullable columns — existing rows unaffected.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastLoginIp" TEXT;
