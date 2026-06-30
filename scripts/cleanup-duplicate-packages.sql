-- ============================================================================
-- One-off cleanup: remove the OLD duplicate packages left behind by the bad
-- Cargo Detail import, for company f64eec57-424a-4efe-afc8-4b9580acb518.
--
-- Background: every affected package now exists twice in the DB --
--   * the original, keyed by the old internal tracking number (9010-...)
--   * a bad-import copy, keyed by the External Tracking Number (GFUS.../TBA.../1Z...)
-- Both copies share the same warehouse receipt (HLS-...), which uniquely
-- identifies the physical package.
--
-- Rule: DELETE the NEW external/INTERNAL copy (tracking_number NOT LIKE '9010-%')
-- only when another record with the SAME warehouse_receipt and an old 9010-...
-- tracking number exists. Keeps the original 9010-... record (already linked to
-- invoices etc.), removes the bad-import duplicate, and never deletes a package
-- that has no surviving 9010-... sibling.
--
-- PREREQUISITE: run the Part A migration first
--   (cd backend && npm run db:migrate)
-- so packages.warehouse_receipt is backfilled. Without it, B1-B3 match nothing.
--
-- HOW TO RUN:
--   1. Run STEP 1 (overview) and STEP 2 (dry run); eyeball the rows.
--   2. Only if STEP 2 looks correct, run STEP 3 inside the transaction.
--
-- FK behavior (deletes are NOT blocked): duty_fees.package_id is ON DELETE
-- CASCADE; invoice_items.package_id and pre_alerts.package_id are ON DELETE
-- SET NULL. Per the "delete old as-is" decision the surviving external/INTERNAL
-- records are treated as holding the correct customer/billing data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1 -- OVERVIEW: warehouse receipts with more than one package (the
--          duplicate groups that will be collapsed).
-- ----------------------------------------------------------------------------
SELECT warehouse_receipt,
       count(*) AS total,
       array_agg(tracking_number ORDER BY created_at) AS tracking_numbers
FROM packages
WHERE company_id = 'f64eec57-424a-4efe-afc8-4b9580acb518'
  AND warehouse_receipt IS NOT NULL
GROUP BY warehouse_receipt
HAVING count(*) > 1
ORDER BY warehouse_receipt;

-- ----------------------------------------------------------------------------
-- STEP 2 -- DRY RUN: the exact NEW external/INTERNAL rows that WILL be deleted
--          (an old 9010-... sibling with the same warehouse receipt exists).
-- ----------------------------------------------------------------------------
SELECT p.id,
       p.tracking_number,
       p.warehouse_receipt,
       p.user_id,
       p.created_at
FROM packages p
WHERE p.company_id = 'f64eec57-424a-4efe-afc8-4b9580acb518'
  AND p.tracking_number NOT LIKE '9010-%'
  AND p.warehouse_receipt IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM packages e
    WHERE e.company_id = p.company_id
      AND e.warehouse_receipt = p.warehouse_receipt
      AND e.id <> p.id
      AND e.tracking_number LIKE '9010-%'
  )
ORDER BY p.warehouse_receipt;

-- ----------------------------------------------------------------------------
-- STEP 3 -- DELETE (run only after STEP 2 looks correct).
-- Wrapped in a transaction so you can verify the row count before COMMIT.
-- ----------------------------------------------------------------------------
BEGIN;

DELETE FROM packages p
WHERE p.company_id = 'f64eec57-424a-4efe-afc8-4b9580acb518'
  AND p.tracking_number NOT LIKE '9010-%'
  AND p.warehouse_receipt IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM packages e
    WHERE e.company_id = p.company_id
      AND e.warehouse_receipt = p.warehouse_receipt
      AND e.id <> p.id
      AND e.tracking_number LIKE '9010-%'
  );

-- Verify the deleted count matches STEP 2, then run one of:
COMMIT;     -- apply the deletion
-- ROLLBACK; -- undo if anything looks off
