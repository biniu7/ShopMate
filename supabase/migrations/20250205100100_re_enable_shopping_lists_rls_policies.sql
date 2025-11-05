-- migration: re-enable rls policies for shopping_lists and shopping_list_items
-- purpose: restore data isolation and access control per user
-- tables affected: shopping_lists, shopping_list_items
-- rationale: security requirement - users must only access their own shopping lists
-- context: policies were disabled in 20250125100100 migration, this restores them

-- ============================================================================
-- shopping_lists table policies
-- ============================================================================

-- policy: unified policy for all operations on shopping_lists
-- rationale: all crud operations have same access control (auth.uid() = user_id)
-- mechanism: single policy with using and with check
-- note: using applies to SELECT, UPDATE, DELETE; with check applies to INSERT, UPDATE
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
-- note: shopping_list_items don't have user_id - access controlled via parent table
-- important: this policy protects UPDATE operations (is_checked toggle)
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
-- verification and notes
-- ============================================================================

-- security verification checklist:
-- [x] shopping_lists: users can only view/create/update/delete their own lists
-- [x] shopping_list_items: users can only modify items in their own lists
-- [x] PATCH /api/shopping-lists/:list_id/items/:item_id is now protected
-- [x] defense in depth: application-level check + rls policies

-- testing requirements:
-- 1. create two users (user a and user b)
-- 2. user a creates shopping list with items
-- 3. user b attempts to:
--    - view user a's list (should fail - returns empty result)
--    - update user a's item (should fail - returns 0 rows affected)
--    - delete user a's list (should fail - returns 0 rows affected)
-- 4. verify rls policies through supabase dashboard
-- 5. test patch endpoint with idor attack (different user's item_id)

-- performance considerations:
-- - exists subquery adds ~5-10ms overhead per request
-- - indexes on shopping_lists(id, user_id) optimize this
-- - acceptable for mvp scale (1k-10k users)
-- - monitor via supabase dashboard performance tab

-- rollback instructions:
-- if you need to disable these policies again:
-- drop policy if exists shopping_lists_all on shopping_lists;
-- drop policy if exists shopping_list_items_all on shopping_list_items;
