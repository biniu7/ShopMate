-- ============================================================================
-- Database Setup for Shopping Lists (POST & GET endpoints)
-- ============================================================================
-- This script sets up RLS policies and indexes for shopping_lists tables
-- Run these queries in Supabase Dashboard > SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Check existing RLS policies
-- ----------------------------------------------------------------------------
-- Run this query first to see what policies already exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('shopping_lists', 'shopping_list_items')
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------------------
-- STEP 2: Check if RLS is enabled
-- ----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('shopping_lists', 'shopping_list_items');

-- ----------------------------------------------------------------------------
-- STEP 3: Enable RLS (if not already enabled)
-- ----------------------------------------------------------------------------
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- STEP 4: Create RLS Policy for shopping_lists
-- ----------------------------------------------------------------------------
-- Drop existing policy if it exists (optional - comment out if not needed)
-- DROP POLICY IF EXISTS "Users can access their own shopping lists" ON shopping_lists;

-- Create policy: Users can only access their own shopping lists
CREATE POLICY "Users can access their own shopping lists"
ON shopping_lists
FOR ALL
USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- STEP 5: Create RLS Policy for shopping_list_items
-- ----------------------------------------------------------------------------
-- Drop existing policy if it exists (optional - comment out if not needed)
-- DROP POLICY IF EXISTS "Users can access shopping list items via list ownership" ON shopping_list_items;

-- Create policy: Users can access items via list ownership
CREATE POLICY "Users can access shopping list items via list ownership"
ON shopping_list_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE shopping_lists.id = shopping_list_items.shopping_list_id
    AND shopping_lists.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- STEP 6: Check existing indexes
-- ----------------------------------------------------------------------------
-- Run this query to see what indexes already exist
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('shopping_lists', 'shopping_list_items')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ----------------------------------------------------------------------------
-- STEP 7: Create indexes for shopping_lists
-- ----------------------------------------------------------------------------
-- Index on user_id for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id
ON shopping_lists(user_id);

-- Composite index on user_id and created_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_created
ON shopping_lists(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- STEP 8: Create indexes for shopping_list_items
-- ----------------------------------------------------------------------------
-- Index on shopping_list_id for efficient joins and RLS policy
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id
ON shopping_list_items(shopping_list_id);

-- ----------------------------------------------------------------------------
-- STEP 9: Verify indexes were created
-- ----------------------------------------------------------------------------
-- Run this query again to confirm indexes are in place
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('shopping_lists', 'shopping_list_items')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ----------------------------------------------------------------------------
-- STEP 10: Test RLS policies (optional)
-- ----------------------------------------------------------------------------
-- These queries should only return rows for the authenticated user
-- Run as authenticated user to test:

-- Test 1: Check if user can see only their own lists
-- SELECT * FROM shopping_lists;

-- Test 2: Check if user can see only items from their own lists
-- SELECT * FROM shopping_list_items;

-- Test 3: Try to insert a list (should work for authenticated user)
-- INSERT INTO shopping_lists (user_id, name)
-- VALUES (auth.uid(), 'Test List')
-- RETURNING *;

-- Test 4: Verify list was inserted and can be retrieved
-- SELECT * FROM shopping_lists WHERE name = 'Test List';

-- ----------------------------------------------------------------------------
-- STEP 11: Performance analysis (optional)
-- ----------------------------------------------------------------------------
-- Check query performance with EXPLAIN ANALYZE
-- EXPLAIN ANALYZE
-- SELECT * FROM shopping_lists
-- WHERE user_id = auth.uid()
-- ORDER BY created_at DESC
-- LIMIT 20;

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. RLS policies ensure users can only access their own data
-- 2. Indexes improve query performance, especially for pagination
-- 3. The composite index (user_id, created_at DESC) optimizes the common
--    query pattern: fetch user's lists sorted by date
-- 4. CASCADE delete on shopping_lists ensures items are deleted when list
--    is deleted (configured in table definition)
-- 5. All queries use auth.uid() which is automatically set by Supabase Auth
-- ============================================================================
