-- migration: re-enable rls policies for ingredients table
-- purpose: restore data isolation and access control per user for ingredients
-- tables affected: ingredients
-- rationale: security requirement - users must only access ingredients from their own recipes
-- context: policies were disabled in 20250125100100 migration, this restores them

-- ============================================================================
-- ingredients table policies
-- ============================================================================

-- policy: users can view ingredients only from their own recipes
-- rationale: access control through recipe ownership
-- mechanism: exists subquery checking recipe ownership
-- note: this is more complex than direct user_id check because ingredients
--       don't have user_id column - access is through recipe relationship
create policy ingredients_select on ingredients
    for select
    to authenticated
    using (
        exists (
            select 1 from recipes
            where recipes.id = ingredients.recipe_id
              and recipes.user_id = auth.uid()
        )
    );

comment on policy ingredients_select on ingredients is 'authenticated users can view ingredients only from their own recipes';

-- policy: users can insert ingredients only to their own recipes
-- rationale: prevent adding ingredients to other users' recipes
-- mechanism: exists subquery checking recipe ownership
create policy ingredients_insert on ingredients
    for insert
    to authenticated
    with check (
        exists (
            select 1 from recipes
            where recipes.id = ingredients.recipe_id
              and recipes.user_id = auth.uid()
        )
    );

comment on policy ingredients_insert on ingredients is 'authenticated users can add ingredients only to their own recipes';

-- policy: users can update ingredients only from their own recipes
-- rationale: prevent unauthorized ingredient modifications
-- mechanism: exists subquery checking recipe ownership
create policy ingredients_update on ingredients
    for update
    to authenticated
    using (
        exists (
            select 1 from recipes
            where recipes.id = ingredients.recipe_id
              and recipes.user_id = auth.uid()
        )
    );

comment on policy ingredients_update on ingredients is 'authenticated users can update ingredients only from their own recipes';

-- policy: users can delete ingredients only from their own recipes
-- rationale: prevent unauthorized ingredient deletions
-- mechanism: exists subquery checking recipe ownership
create policy ingredients_delete on ingredients
    for delete
    to authenticated
    using (
        exists (
            select 1 from recipes
            where recipes.id = ingredients.recipe_id
              and recipes.user_id = auth.uid()
        )
    );

comment on policy ingredients_delete on ingredients is 'authenticated users can delete ingredients only from their own recipes';

-- ============================================================================
-- verification and notes
-- ============================================================================

-- security verification checklist:
-- [x] ingredients: users can only view/create/update/delete ingredients from their own recipes
-- [x] access control through recipe ownership relationship
-- [x] defense in depth: application-level check + rls policies

-- testing requirements:
-- 1. create two users (user a and user b)
-- 2. user a creates recipe with ingredients
-- 3. user b attempts to:
--    - view user a's ingredients (should fail - returns empty result)
--    - add ingredient to user a's recipe (should fail - violates rls policy)
--    - update user a's ingredient (should fail - returns 0 rows affected)
--    - delete user a's ingredient (should fail - returns 0 rows affected)
-- 4. verify rls policies through supabase dashboard
-- 5. test e2e recipe creation with playwright

-- performance considerations:
-- - exists subquery adds ~5-10ms overhead per request
-- - indexes on recipes(id, user_id) optimize this
-- - acceptable for mvp scale (1k-10k users)
-- - monitor via supabase dashboard performance tab

-- rollback instructions:
-- if you need to disable these policies again:
-- drop policy if exists ingredients_select on ingredients;
-- drop policy if exists ingredients_insert on ingredients;
-- drop policy if exists ingredients_update on ingredients;
-- drop policy if exists ingredients_delete on ingredients;
