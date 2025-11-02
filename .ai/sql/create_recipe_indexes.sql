-- ============================================================================
-- Database Indexes for GET /api/recipes Endpoint Performance
-- ============================================================================
--
-- This script creates indexes to optimize the recipe list endpoint.
-- Run these queries in Supabase SQL Editor.
--
-- Performance benefits:
-- - idx_recipes_user_id: Fast filtering by user (RLS queries)
-- - idx_recipes_user_created: Optimized default sorting (user + created_at)
-- - idx_recipes_name_trgm: Fast case-insensitive search on recipe name
--
-- Expected query performance: <200ms p95 for typical user dataset
-- ============================================================================

-- Step 1: Check existing indexes on recipes table
-- Run this first to see what indexes already exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'recipes'
ORDER BY indexname;

-- ============================================================================
-- Step 2: Create required indexes (if not exist)
-- ============================================================================

-- Index 1: user_id (Critical for RLS and all queries)
-- Purpose: Fast filtering by user, used in every query
-- Impact: Reduces full table scan to index scan
CREATE INDEX IF NOT EXISTS idx_recipes_user_id
ON recipes(user_id);

-- Index 2: Composite index for default sorting (user_id + created_at DESC)
-- Purpose: Optimizes most common query pattern (user's recipes sorted by creation date)
-- Impact: Eliminates separate sort step in query execution plan
CREATE INDEX IF NOT EXISTS idx_recipes_user_created
ON recipes(user_id, created_at DESC);

-- Index 3: Trigram index for case-insensitive search on name
-- Purpose: Fast ILIKE searches on recipe name (fuzzy matching)
-- Requires: pg_trgm extension

-- Enable pg_trgm extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram GIN index for name searches
CREATE INDEX IF NOT EXISTS idx_recipes_name_trgm
ON recipes USING gin (name gin_trgm_ops);

-- Alternative (if pg_trgm is not available or preferred):
-- Simple index for ILIKE patterns with lower() function
-- Uncomment if you prefer this over trigram index:
-- CREATE INDEX IF NOT EXISTS idx_recipes_name_lower
-- ON recipes(lower(name) text_pattern_ops);

-- ============================================================================
-- Step 3: Verify index creation
-- ============================================================================

-- Run this query again to confirm all indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'recipes'
ORDER BY indexname;

-- Expected indexes after creation:
-- 1. recipes_pkey (primary key - auto-created)
-- 2. idx_recipes_user_id
-- 3. idx_recipes_user_created
-- 4. idx_recipes_name_trgm

-- ============================================================================
-- Step 4: Analyze query performance (Optional)
-- ============================================================================

-- Test query execution plan to verify index usage
-- Replace 'your-user-id' with an actual user UUID from your database

-- Test 1: Basic query with user filter
EXPLAIN ANALYZE
SELECT id, name, created_at, updated_at
FROM recipes
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 20;

-- Expected: Should show "Index Scan using idx_recipes_user_created"

-- Test 2: Query with search filter
EXPLAIN ANALYZE
SELECT id, name, created_at, updated_at
FROM recipes
WHERE user_id = 'your-user-id'
  AND name ILIKE '%pasta%'
ORDER BY created_at DESC
LIMIT 20;

-- Expected: Should show index usage on user_id and/or name_trgm

-- Test 3: Count query (for pagination total)
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM recipes
WHERE user_id = 'your-user-id';

-- Expected: Should show "Index Only Scan using idx_recipes_user_id"

-- ============================================================================
-- Notes:
-- ============================================================================
--
-- 1. Index Size: These indexes add ~5-10% to table storage size
-- 2. Write Performance: Minimal impact on INSERT/UPDATE (acceptable for read-heavy workload)
-- 3. Maintenance: Indexes are maintained automatically by PostgreSQL
-- 4. Monitoring: Check Supabase Dashboard > Database > Query Performance for slow queries
--
-- 5. If you see "Seq Scan" instead of "Index Scan" in EXPLAIN ANALYZE:
--    - Table might be too small (PostgreSQL uses seq scan for small tables)
--    - Statistics might be outdated (run ANALYZE recipes;)
--    - Query planner might choose seq scan if it's actually faster
--
-- 6. pg_trgm extension:
--    - Provides fuzzy matching and similarity search
--    - Supports ILIKE with leading wildcards (%search%)
--    - Slightly larger index size than simple B-tree
--    - Better performance for partial matches
--
-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- Uncomment to drop indexes (useful for testing or reverting changes)

-- DROP INDEX IF EXISTS idx_recipes_user_id;
-- DROP INDEX IF EXISTS idx_recipes_user_created;
-- DROP INDEX IF EXISTS idx_recipes_name_trgm;
-- DROP EXTENSION IF EXISTS pg_trgm CASCADE;

-- ============================================================================
