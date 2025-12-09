-- migration: disable all rls policies for ingredients, meal_plan, shopping_lists, and shopping_list_items tables
-- purpose: remove all access control policies from these tables
-- tables affected: ingredients, meal_plan, shopping_lists, shopping_list_items
-- notes: this will drop all existing policies on these tables defined in 20250123100500_create_rls_policies.sql

-- ============================================================================
-- disable policies for ingredients table
-- ============================================================================

-- drop all policies from ingredients table
drop policy if exists ingredients_select on ingredients;
drop policy if exists ingredients_insert on ingredients;
drop policy if exists ingredients_update on ingredients;
drop policy if exists ingredients_delete on ingredients;

comment on table ingredients is 'all rls policies disabled for this table';

-- ============================================================================
-- disable policies for meal_plan table
-- ============================================================================

-- drop unified policy from meal_plan table
drop policy if exists meal_plan_all on meal_plan;

comment on table meal_plan is 'all rls policies disabled for this table';

-- ============================================================================
-- disable policies for shopping_lists table
-- ============================================================================

-- drop unified policy from shopping_lists table
drop policy if exists shopping_lists_all on shopping_lists;

comment on table shopping_lists is 'all rls policies disabled for this table';

-- ============================================================================
-- disable policies for shopping_list_items table
-- ============================================================================

-- drop unified policy from shopping_list_items table
drop policy if exists shopping_list_items_all on shopping_list_items;

comment on table shopping_list_items is 'all rls policies disabled for this table';

-- ============================================================================
-- notes
-- ============================================================================

-- warning: disabling rls policies means:
-- - any authenticated user can access all data in these tables
-- - data isolation is removed between users
-- - user a can now see and modify data from user b
-- - implement application-level authorization if needed
-- - consider security implications for production deployment

-- tables still protected by rls policies:
-- - recipes (recipes_select, recipes_insert, recipes_update, recipes_delete)

-- to re-enable these policies, you can:
-- 1. revert this migration, or
-- 2. create a new migration recreating the policies from 20250123100500_create_rls_policies.sql
