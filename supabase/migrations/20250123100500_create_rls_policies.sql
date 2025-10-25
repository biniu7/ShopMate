-- migration: create row level security policies
-- purpose: implement data isolation and access control per user
-- tables affected: recipes, ingredients, meal_plan, shopping_lists, shopping_list_items
-- dependencies: all previous table migrations
-- notes: critical security feature - users can only access their own data

-- ============================================================================
-- recipes table policies
-- ============================================================================

-- policy: users can view only their own recipes
-- rationale: data isolation - user a cannot see recipes of user b
-- mechanism: filter by auth.uid() = user_id
create policy recipes_select on recipes
    for select
    to authenticated
    using (auth.uid() = user_id);

comment on policy recipes_select on recipes is 'authenticated users can view only their own recipes';

-- policy: users can insert recipes only for themselves
-- rationale: prevent user from creating recipes for other users
-- mechanism: check auth.uid() = user_id on insert
create policy recipes_insert on recipes
    for insert
    to authenticated
    with check (auth.uid() = user_id);

comment on policy recipes_insert on recipes is 'authenticated users can create recipes only for themselves';

-- policy: users can update only their own recipes
-- rationale: prevent unauthorized recipe modifications
-- mechanism: filter by auth.uid() = user_id
create policy recipes_update on recipes
    for update
    to authenticated
    using (auth.uid() = user_id);

comment on policy recipes_update on recipes is 'authenticated users can update only their own recipes';

-- policy: users can delete only their own recipes
-- rationale: prevent unauthorized recipe deletions
-- mechanism: filter by auth.uid() = user_id
-- note: cascade delete will remove ingredients and meal_plan assignments
create policy recipes_delete on recipes
    for delete
    to authenticated
    using (auth.uid() = user_id);

comment on policy recipes_delete on recipes is 'authenticated users can delete only their own recipes';

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
-- meal_plan table policies
-- ============================================================================

-- policy: unified policy for all operations on meal_plan
-- rationale: all crud operations have same access control (auth.uid() = user_id)
-- mechanism: single policy with using and with check
-- note: more efficient than 4 separate policies for this use case
create policy meal_plan_all on meal_plan
    for all
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

comment on policy meal_plan_all on meal_plan is 'authenticated users can manage only their own meal plan assignments';

-- ============================================================================
-- shopping_lists table policies
-- ============================================================================

-- policy: unified policy for all operations on shopping_lists
-- rationale: all crud operations have same access control (auth.uid() = user_id)
-- mechanism: single policy with using and with check
create policy shopping_lists_all on shopping_lists
    for all
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

comment on policy shopping_lists_all on shopping_lists is 'authenticated users can manage only their own shopping lists';

-- ============================================================================
-- shopping_list_items table policies
-- ============================================================================

-- policy: unified policy for all operations on shopping_list_items
-- rationale: access control through shopping_lists ownership
-- mechanism: exists subquery checking shopping_list ownership
-- note: similar to ingredients - no direct user_id, access through parent table
create policy shopping_list_items_all on shopping_list_items
    for all
    to authenticated
    using (
        exists (
            select 1 from shopping_lists
            where shopping_lists.id = shopping_list_items.shopping_list_id
              and shopping_lists.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from shopping_lists
            where shopping_lists.id = shopping_list_items.shopping_list_id
              and shopping_lists.user_id = auth.uid()
        )
    );

comment on policy shopping_list_items_all on shopping_list_items is 'authenticated users can manage items only in their own shopping lists';

-- ============================================================================
-- rls policy notes and testing requirements
-- ============================================================================

-- critical security requirements (fr-015):
-- - all policies tested with multiple users
-- - user a cannot access any data from user b
-- - automated tests in migrations (do $$ block)
-- - integration tests (vitest + supabase client)
-- - manual testing checklist before production deploy
-- - penetration testing rls policies (planned in prd)

-- rls overhead considerations:
-- - rls adds 10-30% query overhead
-- - for mvp (1k-10k users) = acceptable
-- - for 100k+ users: consider app-level authorization
-- - monitoring through supabase dashboard for performance

-- defense in depth strategy:
-- - frontend: react forms with live validation
-- - application: zod schemas in api endpoints
-- - database: check constraints
-- - rls: policy-based authorization (this migration)

-- anon role note:
-- no policies created for anon role
-- rationale: shopmate requires authentication for all operations
-- unauthenticated users have no access to any tables
-- all routes protected by middleware (fr-016)
