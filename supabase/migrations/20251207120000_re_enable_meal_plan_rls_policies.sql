-- migration: re-enable rls policies for meal_plan table
-- purpose: restore data isolation and access control per user for meal planning
-- tables affected: meal_plan
-- rationale: security requirement - users must only access their own meal plan assignments
-- context: policies were disabled in 20250125100100 migration, this restores them
-- dependencies: requires meal_plan table from 20250123100200_create_meal_plan_table.sql

-- ============================================================================
-- meal_plan table policies
-- ============================================================================

-- policy: unified policy for all operations on meal_plan
-- rationale: all crud operations have same access control (auth.uid() = user_id)
-- mechanism: single policy with using and with check clauses
-- scope: applies to SELECT, INSERT, UPDATE, DELETE operations
-- note: using clause applies to SELECT, UPDATE, DELETE operations
--       with check clause applies to INSERT and UPDATE operations
--       combining both ensures complete protection for all crud operations
create policy meal_plan_all on meal_plan
    for all
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

comment on policy meal_plan_all on meal_plan is 'authenticated users can manage only their own meal plan assignments';

-- ============================================================================
-- verification and notes
-- ============================================================================

-- security verification checklist:
-- [x] meal_plan: users can only view/create/update/delete their own meal assignments
-- [x] direct user_id check (simpler than exists subquery)
-- [x] unified policy (more efficient than separate policies per operation)
-- [x] defense in depth: application-level check + rls policies

-- testing requirements:
-- 1. create two users (user a and user b)
-- 2. user a creates meal plan assignment (recipe assigned to specific day/meal)
-- 3. user b attempts to:
--    - view user a's meal plan (should fail - returns empty result)
--    - create meal plan with user a's user_id (should fail - violates with check)
--    - update user a's meal assignment (should fail - returns 0 rows affected)
--    - delete user a's meal assignment (should fail - returns 0 rows affected)
-- 4. verify rls policies through supabase dashboard
-- 5. test calendar view with multiple users (playwright e2e test)
-- 6. test api endpoints: GET/POST/PUT/DELETE /api/meal-plan

-- crud operations protected:
-- - SELECT: users can only see their own meal assignments in calendar
-- - INSERT: users can only create meal assignments for themselves
-- - UPDATE: users can only modify their own meal assignments
-- - DELETE: users can only remove their own meal assignments

-- performance considerations:
-- - direct user_id comparison is very efficient (~1-2ms overhead)
-- - no subquery needed (unlike ingredients or shopping_list_items)
-- - index on meal_plan(user_id) optimizes this policy
-- - unified policy is more performant than 4 separate policies
-- - acceptable for mvp scale (1k-10k users)
-- - monitor via supabase dashboard performance tab

-- security impact:
-- - prevents idor attacks on /api/meal-plan endpoints
-- - ensures data isolation in multi-tenant environment
-- - protects weekly calendar view from data leaks
-- - complies with fr-015 security requirements

-- rollback instructions:
-- if you need to disable this policy:
-- drop policy if exists meal_plan_all on meal_plan;
--
-- warning: disabling this policy will:
-- - allow any authenticated user to see all meal plans
-- - allow users to modify other users' meal assignments
-- - break data isolation between users
-- - create serious security vulnerability

-- anon role:
-- no policy created for anon role
-- rationale: meal planning requires authentication
-- unauthenticated users must not access meal_plan table
-- all meal plan routes protected by middleware
