-- Legacy sales predate the discount/tax fields: their gross subtotal equals the
-- amount paid (no discount, no tax was ever applied). Backfill so reports and
-- the struk render a truthful Subtotal for old rows.
UPDATE "sales"
SET "subtotalAmount" = "totalAmount"
WHERE "subtotalAmount" = 0;
