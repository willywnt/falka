-- Recurring operating-expense templates: a definition that GENERATES Expense rows per month
-- ("Buat bulan ini"). Idempotent per template/month via a partial unique index on the
-- generated rows (manual expenses, with a null templateId, are excluded).

-- CreateTable
CREATE TABLE "expense_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "dayOfMonth" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "expense_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expense_templates_organizationId_idx" ON "expense_templates"("organizationId");

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN "templateId" TEXT,
ADD COLUMN "periodMonth" TEXT;

-- CreateIndex
CREATE INDEX "expenses_templateId_idx" ON "expenses"("templateId");

-- CreateIndex: one LIVE generated expense per template per month (manual rows + soft-deleted excluded).
CREATE UNIQUE INDEX "expenses_templateId_periodMonth_key" ON "expenses"("templateId", "periodMonth")
WHERE "templateId" IS NOT NULL AND "periodMonth" IS NOT NULL AND "deletedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "expense_templates" ADD CONSTRAINT "expense_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_templates" ADD CONSTRAINT "expense_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "expense_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
