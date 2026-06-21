-- A purchase order can now be saved as a DRAFT: no incoming stock is reserved
-- until it is placed (DRAFT -> ORDERED), and a draft is freely editable. Additive
-- enum value only — existing rows are unaffected. IF NOT EXISTS keeps it re-runnable.
ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
