-- migration: create triggers and functions
-- purpose: add automatic updated_at trigger and rpc function for atomic shopping list generation
-- tables affected: recipes, shopping_lists
-- functions created: update_updated_at_column(), generate_shopping_list()
-- dependencies: all previous table migrations

-- ============================================================================
-- trigger function: automatic updated_at timestamp
-- ============================================================================

-- create function to update updated_at column
-- this function is called by triggers before update on tables
-- automatically sets updated_at to current timestamp
-- rationale: ensures updated_at is always accurate without manual updates
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    -- set updated_at to current timestamp
    new.updated_at = now();
    return new;
end;
$$;

comment on function update_updated_at_column is 'automatically update updated_at column to current timestamp';

-- create trigger for recipes table
-- fires before update on any row
-- calls update_updated_at_column() to set updated_at
create trigger recipes_updated_at
    before update on recipes
    for each row
    execute function update_updated_at_column();

comment on trigger recipes_updated_at on recipes is 'automatically update updated_at when recipe is modified';

-- create trigger for shopping_lists table
-- fires before update on any row
-- calls update_updated_at_column() to set updated_at
-- note: shopping_list_items don't have updated_at (snapshot pattern)
create trigger shopping_lists_updated_at
    before update on shopping_lists
    for each row
    execute function update_updated_at_column();

comment on trigger shopping_lists_updated_at on shopping_lists is 'automatically update updated_at when shopping list is modified';

-- trigger design decision: no trigger for meal_plan
-- rationale: meal_plan has no updated_at column
-- assignments are only created or deleted, never updated
-- if user wants to change recipe, they delete and create new assignment

-- ============================================================================
-- rpc function: atomic shopping list generation
-- ============================================================================

-- create function for atomic shopping list generation
-- purpose: insert shopping_list and bulk insert items in single transaction
-- security: security definer with auth.uid() validation
-- parameters:
--   p_name: shopping list name
--   p_week_start_date: week start date (null if from recipes)
--   p_items: jsonb array of items with ingredient_name, quantity, unit, category, sort_order
-- returns: uuid of created shopping list
-- usage: called from application via supabase.rpc('generate_shopping_list', {...})
create or replace function generate_shopping_list(
    p_name varchar,
    p_week_start_date date,
    p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_list_id uuid;
    v_user_id uuid;
begin
    -- get authenticated user id from auth context
    v_user_id := auth.uid();

    -- validate user is authenticated
    -- this is critical security check
    -- without this, anonymous users could create shopping lists
    if v_user_id is null then
        raise exception 'unauthorized: user not authenticated';
    end if;

    -- insert shopping_list record
    -- returns generated id into v_list_id variable
    insert into shopping_lists (user_id, name, week_start_date)
    values (v_user_id, p_name, p_week_start_date)
    returning id into v_list_id;

    -- bulk insert shopping_list_items
    -- jsonb_array_elements expands jsonb array into rows
    -- each item in p_items becomes a row in shopping_list_items
    -- using coalesce for default values (category='inne', sort_order=0)
    insert into shopping_list_items (
        shopping_list_id,
        ingredient_name,
        quantity,
        unit,
        category,
        sort_order
    )
    select
        v_list_id,
        item->>'ingredient_name',
        -- handle null quantity (some ingredients don't have quantities)
        case
            when item->>'quantity' is not null
            then (item->>'quantity')::numeric
            else null
        end,
        item->>'unit',
        -- default to 'inne' if category not provided (ai fallback)
        coalesce(item->>'category', 'Inne'),
        -- default to 0 if sort_order not provided
        coalesce((item->>'sort_order')::integer, 0)
    from jsonb_array_elements(p_items) as item;

    -- return id of created shopping list
    -- application can use this to redirect to shopping list detail view
    return v_list_id;

exception
    -- if any error occurs, entire transaction is rolled back
    -- neither shopping_list nor shopping_list_items are created
    when others then
        raise;
end;
$$;

comment on function generate_shopping_list is 'atomically create shopping list with items in single transaction';

-- grant execute permission to authenticated users
-- anonymous users cannot execute this function (auth.uid() check will fail)
grant execute on function generate_shopping_list(varchar, date, jsonb) to authenticated;

-- function design decisions:

-- security definer:
-- function executes with elevated privileges (creator's role)
-- required because rls policies need to be evaluated
-- auth.uid() validation inside function ensures security
-- prevents sql injection (parameterized queries)

-- atomic transaction:
-- entire operation (insert list + bulk insert items) is atomic
-- if any insert fails, all changes are rolled back
-- ensures data consistency (no orphaned shopping_lists without items)

-- bulk insert optimization:
-- single insert for all items instead of n individual inserts
-- eliminates n+1 problem
-- much faster for large shopping lists (50+ items)

-- jsonb parameter:
-- allows flexible structure for items
-- application can send entire aggregated shopping list in one rpc call
-- example usage:
-- const { data, error } = await supabase.rpc('generate_shopping_list', {
--   p_name: 'lista zakupów - tydzień 20-26 stycznia',
--   p_week_start_date: '2025-01-20',
--   p_items: [
--     { ingredient_name: 'mleko', quantity: 2, unit: 'l', category: 'nabiał', sort_order: 0 },
--     { ingredient_name: 'jajka', quantity: 10, unit: 'szt', category: 'nabiał', sort_order: 1 },
--     // ... more items
--   ]
-- });

-- error handling:
-- if exception occurs, raise it to caller
-- supabase client will receive error response
-- application should show user-friendly error message
-- sentry will capture exception for monitoring
