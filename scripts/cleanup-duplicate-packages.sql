-- ============================================================================
-- One-off cleanup: remove duplicate packages created by the bad Cargo Detail
-- import (the one that re-added stale records under a new External Tracking
-- Number / INTERNAL- key).
--
-- Strategy: match by the Warehouse Receipt (HLS-xxxxx) extracted from `notes`,
-- scoped to the 30 HLS values in the bad CSV. Only HLS values that have MORE
-- THAN ONE package are touched; for those we KEEP the oldest record (the
-- pre-existing original) and DELETE the newer bad-import duplicate(s).
-- Genuinely-new packages (HLS present only once) are left alone.
--
-- HOW TO RUN:
--   1. Set :company_id to the affected tenant's UUID.
--   2. Run STEP 1 (and the sanity check) and eyeball the rows.
--   3. Only if STEP 1 looks correct, run STEP 2 inside the transaction.
--
-- FK behavior (deletes are NOT blocked): duty_fees.package_id is ON DELETE
-- CASCADE; invoice_items.package_id and pre_alerts.package_id are ON DELETE
-- SET NULL. Bad-import duplicates are brand new, so they typically have no such
-- children, but be aware any attached duty_fees would cascade-delete.
-- ============================================================================

-- Provide the affected tenant id, e.g. in psql:
--   \set company_id '00000000-0000-0000-0000-000000000000'
-- or replace :company_id below with a literal '...'::uuid.

-- Reusable list of the warehouse receipts from the bad import CSV.
-- (Defined inline in each query below as a VALUES CTE.)

-- ----------------------------------------------------------------------------
-- STEP 1 — DRY RUN: rows that WILL be deleted (newer duplicates; oldest kept)
-- ----------------------------------------------------------------------------
WITH bad_hls(hls) AS (VALUES
  ('HLS-12650'),('HLS-12651'),('HLS-12649'),('HLS-12648'),('HLS-12559'),
  ('HLS-12558'),('HLS-12556'),('HLS-12557'),('HLS-12552'),('HLS-12469'),
  ('HLS-12468'),('HLS-12464'),('HLS-12463'),('HLS-12461'),('HLS-12462'),
  ('HLS-12387'),('HLS-12388'),('HLS-12348'),('HLS-12347'),('HLS-12346'),
  ('HLS-12326'),('HLS-12327'),('HLS-12328'),('HLS-12282'),('HLS-12199'),
  ('HLS-12198'),('HLS-12200'),('HLS-12166'),('HLS-12165'),('HLS-12167')
),
ranked AS (
  SELECT p.id, p.tracking_number, p.created_at,
         substring(p.notes from 'Warehouse Receipt:\s*(HLS-[0-9]+)') AS hls,
         row_number() OVER (
           PARTITION BY substring(p.notes from 'Warehouse Receipt:\s*(HLS-[0-9]+)')
           ORDER BY p.created_at ASC
         ) AS rn,
         count(*) OVER (
           PARTITION BY substring(p.notes from 'Warehouse Receipt:\s*(HLS-[0-9]+)')
         ) AS cnt
  FROM packages p
  WHERE p.company_id = :company_id
    AND substring(p.notes from 'Warehouse Receipt:\s*(HLS-[0-9]+)') IN (SELECT hls FROM bad_hls)
)
SELECT id, hls, tracking_number, created_at, cnt AS total_for_hls
FROM ranked
WHERE cnt > 1 AND rn > 1          -- duplicates to delete (rn = 1, the oldest, is kept)
ORDER BY hls, created_at;

-- ----------------------------------------------------------------------------
-- SANITY CHECK — bad-CSV HLS that are singletons (genuinely-new; NOT deleted)
-- ----------------------------------------------------------------------------
WITH bad_hls(hls) AS (VALUES
  ('HLS-12650'),('HLS-12651'),('HLS-12649'),('HLS-12648'),('HLS-12559'),
  ('HLS-12558'),('HLS-12556'),('HLS-12557'),('HLS-12552'),('HLS-12469'),
  ('HLS-12468'),('HLS-12464'),('HLS-12463'),('HLS-12461'),('HLS-12462'),
  ('HLS-12387'),('HLS-12388'),('HLS-12348'),('HLS-12347'),('HLS-12346'),
  ('HLS-12326'),('HLS-12327'),('HLS-12328'),('HLS-12282'),('HLS-12199'),
  ('HLS-12198'),('HLS-12200'),('HLS-12166'),('HLS-12165'),('HLS-12167')
),
ranked AS (
  SELECT substring(p.notes from 'Warehouse Receipt:\s*(HLS-[0-9]+)') AS hls,
         count(*) OVER (
           PARTITION BY substring(p.notes from 'Warehouse Receipt:\s*(HLS-[0-9]+)')
         ) AS cnt,
         p.id
  FROM packages p
  WHERE p.company_id = :company_id
    AND substring(p.notes from 'Warehouse Receipt:\s*(HLS-[0-9]+)') IN (SELECT hls FROM bad_hls)
)
SELECT DISTINCT hls, cnt AS total_for_hls
FROM ranked
WHERE cnt = 1
ORDER BY hls;

-- ----------------------------------------------------------------------------
-- STEP 2 — DELETE (run only after STEP 1 looks correct).
-- Wrapped in a transaction so you can verify the row count before COMMIT.
-- ----------------------------------------------------------------------------
BEGIN;

WITH bad_hls(hls) AS (VALUES
  ('HLS-12650'),('HLS-12651'),('HLS-12649'),('HLS-12648'),('HLS-12559'),
  ('HLS-12558'),('HLS-12556'),('HLS-12557'),('HLS-12552'),('HLS-12469'),
  ('HLS-12468'),('HLS-12464'),('HLS-12463'),('HLS-12461'),('HLS-12462'),
  ('HLS-12387'),('HLS-12388'),('HLS-12348'),('HLS-12347'),('HLS-12346'),
  ('HLS-12326'),('HLS-12327'),('HLS-12328'),('HLS-12282'),('HLS-12199'),
  ('HLS-12198'),('HLS-12200'),('HLS-12166'),('HLS-12165'),('HLS-12167')
),
ranked AS (
  SELECT p.id,
         row_number() OVER (
           PARTITION BY substring(p.notes from 'Warehouse Receipt:\s*(HLS-[0-9]+)')
           ORDER BY p.created_at ASC
         ) AS rn,
         count(*) OVER (
           PARTITION BY substring(p.notes from 'Warehouse Receipt:\s*(HLS-[0-9]+)')
         ) AS cnt
  FROM packages p
  WHERE p.company_id = :company_id
    AND substring(p.notes from 'Warehouse Receipt:\s*(HLS-[0-9]+)') IN (SELECT hls FROM bad_hls)
)
DELETE FROM packages
WHERE id IN (SELECT id FROM ranked WHERE cnt > 1 AND rn > 1);

-- Verify the deleted count matches STEP 1, then:
--   COMMIT;   -- to apply
--   ROLLBACK; -- to undo if anything looks off
