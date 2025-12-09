-- ============================================================================
-- Database Indexes Verification and Creation for meal_plan table
-- ============================================================================
-- Purpose: Optimize GET /api/meal-plan endpoint performance
-- Target Table: meal_plan
-- Required Indexes:
--   1. Compound index on (user_id, week_start_date) for filtering
--   2. Index on (recipe_id) for JOIN with recipes table
-- ============================================================================

-- ============================================================================
-- STEP 1: Check Existing Indexes
-- ============================================================================

-- Query to list all indexes on meal_plan table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'meal_plan'
ORDER BY indexname;

-- Expected output should include:
-- - meal_plan_pkey (PRIMARY KEY on id) ✅ Auto-created
-- - idx_meal_plan_user_week (if exists)
-- - idx_meal_plan_recipe (if exists)

-- ============================================================================
-- STEP 2: Check Table Statistics
-- ============================================================================

-- Count total rows in meal_plan
SELECT COUNT(*) as total_rows FROM meal_plan;

-- Count rows per user (to estimate index benefit)
SELECT
    user_id,
    COUNT(*) as assignments_count
FROM meal_plan
GROUP BY user_id
ORDER BY assignments_count DESC
LIMIT 10;

-- ============================================================================
-- STEP 3: Create Required Indexes (if missing)
-- ============================================================================

-- Index 1: Compound index on (user_id, week_start_date)
-- Purpose: Optimize the main query filter in getMealPlanForWeek service
-- This index will be used for: WHERE user_id = ? AND week_start_date = ?
CREATE INDEX IF NOT EXISTS idx_meal_plan_user_week
ON meal_plan(user_id, week_start_date);

-- Index 2: Index on recipe_id for JOIN performance
-- Purpose: Optimize JOIN with recipes table
CREATE INDEX IF NOT EXISTS idx_meal_plan_recipe
ON meal_plan(recipe_id);

-- ============================================================================
-- STEP 4: Verify Index Creation
-- ============================================================================

-- List all indexes again to confirm creation
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'meal_plan'
ORDER BY indexname;

-- Check index sizes
SELECT
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND relname = 'meal_plan'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- STEP 5: Test Query Performance with EXPLAIN ANALYZE
-- ============================================================================

-- Replace 'YOUR_USER_ID' with actual UUID from your test user
-- Replace '2025-01-20' with actual date you're testing

EXPLAIN ANALYZE
SELECT
    meal_plan.id,
    meal_plan.user_id,
    meal_plan.recipe_id,
    meal_plan.week_start_date,
    meal_plan.day_of_week,
    meal_plan.meal_type,
    meal_plan.created_at,
    recipes.name as recipe_name
FROM meal_plan
INNER JOIN recipes ON meal_plan.recipe_id = recipes.id
WHERE
    meal_plan.user_id = 'YOUR_USER_ID'
    AND meal_plan.week_start_date = '2025-01-20'
ORDER BY meal_plan.day_of_week;

-- Expected EXPLAIN output should show:
-- ✅ "Index Scan using idx_meal_plan_user_week" (not Seq Scan)
-- ✅ "Nested Loop" or "Hash Join" for the JOIN
-- ✅ Execution time < 50ms for typical data

-- ============================================================================
-- STEP 6: Performance Comparison (Optional)
-- ============================================================================

-- Test 1: Query WITH index (should be fast)
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT *
FROM meal_plan
WHERE user_id = 'YOUR_USER_ID'
AND week_start_date = '2025-01-20';

-- Test 2: Query WITHOUT specific user_id (slower, for comparison)
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT *
FROM meal_plan
WHERE week_start_date = '2025-01-20';

-- ============================================================================
-- STEP 7: Maintenance and Monitoring
-- ============================================================================

-- Check index usage statistics
SELECT
    schemaname,
    tablename,
    indexrelname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'meal_plan'
ORDER BY idx_scan DESC;

-- If idx_scan is 0, the index is not being used and might not be needed
-- If idx_scan is high, the index is being used frequently (good)

-- Check for index bloat (run periodically)
SELECT
    schemaname,
    tablename,
    indexrelname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename = 'meal_plan';

-- ============================================================================
-- STEP 8: Cleanup (Only if index needs to be recreated)
-- ============================================================================

-- WARNING: Only drop indexes if you need to recreate them with different options
-- Dropping an index will temporarily slow down queries until it's recreated

-- DROP INDEX IF EXISTS idx_meal_plan_user_week;
-- DROP INDEX IF EXISTS idx_meal_plan_recipe;

-- Then re-create with Step 3 commands

-- ============================================================================
-- Additional Optimization: Partial Index (Advanced)
-- ============================================================================

-- If most queries are for recent weeks, consider a partial index
-- This is OPTIONAL and only beneficial if:
-- 1. You have years of historical data
-- 2. Most queries are for current/future weeks
-- 3. Storage is a concern

-- Example: Index only for dates >= 2025-01-01
-- CREATE INDEX IF NOT EXISTS idx_meal_plan_recent
-- ON meal_plan(user_id, week_start_date)
-- WHERE week_start_date >= '2025-01-01';

-- ============================================================================
-- Performance Targets
-- ============================================================================
--
-- With proper indexes, expect:
-- ✅ Query execution time: < 50ms for typical week (1-28 assignments)
-- ✅ Index scan (not sequential scan) in EXPLAIN output
-- ✅ No significant performance degradation as data grows
--
-- Without indexes:
-- ❌ Sequential scan on entire meal_plan table
-- ❌ Query time increases linearly with table size
-- ❌ Poor performance with >1000 rows
--
-- ============================================================================

-- ============================================================================
-- Validation Checklist
-- ============================================================================
--
-- [ ] idx_meal_plan_user_week exists
-- [ ] idx_meal_plan_recipe exists
-- [ ] EXPLAIN shows "Index Scan" (not "Seq Scan")
-- [ ] Query execution time < 50ms
-- [ ] Index usage stats show idx_scan > 0
-- [ ] No errors in Supabase logs
--
-- ============================================================================

-- ============================================================================
-- Notes for Future Optimization
-- ============================================================================
--
-- 1. Monitor index usage via pg_stat_user_indexes
-- 2. If meal_plan table grows to >100K rows, consider:
--    - Partitioning by week_start_date (by year or month)
--    - Archiving old data (>2 years old)
-- 3. If JOIN performance becomes issue:
--    - Consider materialized view for frequently accessed data
--    - Add index on recipes(id) if not already present (should be PK)
-- 4. For analytics queries (not MVP):
--    - Create separate indexes for reporting
--    - Use read replicas for heavy analytics
--
-- ============================================================================