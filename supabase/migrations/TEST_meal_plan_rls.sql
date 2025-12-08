-- ============================================================================
-- TEST: Meal Plan RLS Policy Verification
-- ============================================================================
-- Purpose: Verify that meal_plan_all policy correctly isolates user data
-- Migration: 20251207120000_re_enable_meal_plan_rls_policies.sql
-- Run this test after applying the migration
--
-- IMPORTANT: Run each section separately and verify results
-- ============================================================================

-- ============================================================================
-- SECTION 1: Verify policy exists
-- ============================================================================
\echo '=== SECTION 1: Checking if policy exists ==='

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
WHERE tablename = 'meal_plan';

-- EXPECTED OUTPUT:
-- policyname: meal_plan_all
-- permissive: PERMISSIVE
-- roles: {authenticated}
-- cmd: * (means ALL operations)
-- qual: (auth.uid() = user_id)
-- with_check: (auth.uid() = user_id)


-- ============================================================================
-- SECTION 2: Verify RLS is enabled
-- ============================================================================
\echo '=== SECTION 2: Checking if RLS is enabled ==='

SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'meal_plan';

-- EXPECTED OUTPUT:
-- rls_enabled: true (or 't')


-- ============================================================================
-- SECTION 3: Setup test data
-- ============================================================================
\echo '=== SECTION 3: Creating test users and recipes ==='

-- Create test users in auth.users (if not exists)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'user_a_test@shopmate.local',
        crypt('password123', gen_salt('bf')),
        now(),
        now(),
        now()
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'user_b_test@shopmate.local',
        crypt('password123', gen_salt('bf')),
        now(),
        now(),
        now()
    )
ON CONFLICT (id) DO NOTHING;

-- Create test recipes for User A
INSERT INTO recipes (
    id,
    user_id,
    name,
    instructions
) VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Test Recipe A',
        'Test instructions for recipe A'
    )
ON CONFLICT (id) DO NOTHING;

-- Create test recipe for User B
INSERT INTO recipes (
    id,
    user_id,
    name,
    instructions
) VALUES
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '22222222-2222-2222-2222-222222222222',
        'Test Recipe B',
        'Test instructions for recipe B'
    )
ON CONFLICT (id) DO NOTHING;

\echo 'Test data created successfully'


-- ============================================================================
-- SECTION 4: Test as User A - CREATE
-- ============================================================================
\echo '=== SECTION 4: User A creates meal plan assignment ==='

-- Simulate User A
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- User A creates meal plan
INSERT INTO meal_plan (
    id,
    user_id,
    recipe_id,
    week_start_date,
    day_of_week,
    meal_type
) VALUES (
    '11111111-meal-meal-meal-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2025-12-09',  -- Monday
    1,              -- Monday
    'breakfast'
)
ON CONFLICT (id) DO NOTHING
RETURNING id, user_id, recipe_id, day_of_week, meal_type;

-- EXPECTED: 1 row inserted
-- Shows: User A can create their own meal plan


-- ============================================================================
-- SECTION 5: Test as User A - READ (own data)
-- ============================================================================
\echo '=== SECTION 5: User A reads their own meal plan ==='

SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT
    id,
    user_id,
    recipe_id,
    day_of_week,
    meal_type
FROM meal_plan
WHERE week_start_date = '2025-12-09';

-- EXPECTED: 1 row returned (User A's meal plan)


-- ============================================================================
-- SECTION 6: Test as User B - READ (should NOT see User A data)
-- ============================================================================
\echo '=== SECTION 6: User B tries to read User A meal plan ==='

-- Switch to User B
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

SELECT
    id,
    user_id,
    recipe_id,
    day_of_week,
    meal_type
FROM meal_plan
WHERE week_start_date = '2025-12-09';

-- EXPECTED: 0 rows (User B cannot see User A's data)
-- ✅ PASS if 0 rows
-- ❌ FAIL if returns User A's meal plan → RLS BROKEN!


-- ============================================================================
-- SECTION 7: Test as User B - UPDATE (should fail)
-- ============================================================================
\echo '=== SECTION 7: User B tries to update User A meal plan ==='

SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

UPDATE meal_plan
SET meal_type = 'lunch'
WHERE id = '11111111-meal-meal-meal-111111111111';

-- EXPECTED: 0 rows updated
-- Check result with:
SELECT meal_type FROM meal_plan WHERE id = '11111111-meal-meal-meal-111111111111';
-- Should still be 'breakfast', not 'lunch'


-- ============================================================================
-- SECTION 8: Test as User B - DELETE (should fail)
-- ============================================================================
\echo '=== SECTION 8: User B tries to delete User A meal plan ==='

SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

DELETE FROM meal_plan
WHERE id = '11111111-meal-meal-meal-111111111111';

-- EXPECTED: 0 rows deleted
-- Verify meal plan still exists (as User A):
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
SELECT count(*) FROM meal_plan WHERE id = '11111111-meal-meal-meal-111111111111';
-- Should return: 1 (meal plan still exists)


-- ============================================================================
-- SECTION 9: Test as User B - INSERT with User A's ID (should fail)
-- ============================================================================
\echo '=== SECTION 9: User B tries to insert meal plan for User A ==='

SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

-- User B tries to create meal plan with User A's user_id
INSERT INTO meal_plan (
    user_id,
    recipe_id,
    week_start_date,
    day_of_week,
    meal_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',  -- User A's ID!
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',  -- User B's recipe
    '2025-12-09',
    2,
    'lunch'
);

-- EXPECTED: ERROR
-- Error message should be:
-- "new row violates row-level security policy for table "meal_plan""
-- ✅ PASS if ERROR
-- ❌ FAIL if INSERT succeeds → RLS with check BROKEN!


-- ============================================================================
-- SECTION 10: Test as User A - UPDATE (should succeed)
-- ============================================================================
\echo '=== SECTION 10: User A updates their own meal plan ==='

SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

UPDATE meal_plan
SET meal_type = 'dinner'
WHERE id = '11111111-meal-meal-meal-111111111111';

-- EXPECTED: 1 row updated
-- Verify:
SELECT meal_type FROM meal_plan WHERE id = '11111111-meal-meal-meal-111111111111';
-- Should return: 'dinner'


-- ============================================================================
-- SECTION 11: Test as User A - DELETE (should succeed)
-- ============================================================================
\echo '=== SECTION 11: User A deletes their own meal plan ==='

SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

DELETE FROM meal_plan
WHERE id = '11111111-meal-meal-meal-111111111111';

-- EXPECTED: 1 row deleted
-- Verify:
SELECT count(*) FROM meal_plan WHERE id = '11111111-meal-meal-meal-111111111111';
-- Should return: 0


-- ============================================================================
-- SECTION 12: Cleanup test data
-- ============================================================================
\echo '=== SECTION 12: Cleaning up test data ==='

-- Delete test meal plans
DELETE FROM meal_plan WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

-- Delete test recipes
DELETE FROM recipes WHERE id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

-- Delete test users
DELETE FROM auth.users WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

\echo 'Test data cleaned up'


-- ============================================================================
-- TEST SUMMARY
-- ============================================================================
\echo ''
\echo '=== TEST SUMMARY ==='
\echo 'If all sections passed:'
\echo '✅ Section 1: Policy exists with correct configuration'
\echo '✅ Section 2: RLS is enabled on meal_plan table'
\echo '✅ Section 4: User A can CREATE their own meal plans'
\echo '✅ Section 5: User A can READ their own meal plans'
\echo '✅ Section 6: User B CANNOT read User A meal plans (0 rows)'
\echo '✅ Section 7: User B CANNOT update User A meal plans (0 rows affected)'
\echo '✅ Section 8: User B CANNOT delete User A meal plans (0 rows affected)'
\echo '✅ Section 9: User B CANNOT insert meal plans for User A (ERROR)'
\echo '✅ Section 10: User A CAN update their own meal plans'
\echo '✅ Section 11: User A CAN delete their own meal plans'
\echo ''
\echo 'RLS Policy verification: PASSED ✅'
\echo 'Migration 20251207120000 is working correctly!'
\echo ''
