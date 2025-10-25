-- migration: create indexes for performance optimization
-- purpose: add indexes for critical queries and foreign key relationships
-- tables affected: recipes, ingredients, meal_plan, shopping_lists, shopping_list_items
-- dependencies: all previous table migrations
-- notes: minimal indexes for mvp - avoid over-indexing

-- recipes indexes
-- index on user_id for filtering user's recipes
-- critical for queries: select * from recipes where user_id = ?
create index if not exists idx_recipes_user_id on recipes(user_id);

comment on index idx_recipes_user_id is 'filter recipes by user - used in recipe list view';

-- ingredients indexes
-- index on recipe_id for joining with recipes
-- critical for queries: select * from ingredients where recipe_id = ?
create index if not exists idx_ingredients_recipe_id on ingredients(recipe_id);

comment on index idx_ingredients_recipe_id is 'join ingredients with recipes - used in recipe detail view';

-- meal_plan indexes
-- compound index on (user_id, week_start_date) for main calendar query
-- critical for queries: select * from meal_plan where user_id = ? and week_start_date = ?
-- this is the most important query in the app (calendar view)
-- compound index allows filtering by user first, then by week
create index if not exists idx_meal_plan_user_week on meal_plan(user_id, week_start_date);

comment on index idx_meal_plan_user_week is 'main calendar query - filter by user and week (compound index)';

-- index on recipe_id for checking assignments before recipe deletion
-- used when user tries to delete recipe - check if assigned in calendar
-- query: select exists(select 1 from meal_plan where recipe_id = ?)
create index if not exists idx_meal_plan_recipe_id on meal_plan(recipe_id);

comment on index idx_meal_plan_recipe_id is 'check recipe assignments before deletion';

-- unique index to prevent duplicate assignments
-- one recipe per calendar cell (user, week, day, meal type)
-- this is both a unique constraint and an index for performance
-- enforces business rule: cannot assign two recipes to same meal slot
create unique index if not exists idx_meal_plan_unique_assignment
    on meal_plan(user_id, week_start_date, day_of_week, meal_type);

comment on index idx_meal_plan_unique_assignment is 'prevent duplicate assignments - one recipe per calendar cell';

-- shopping_lists indexes
-- index on user_id for filtering user's shopping lists
-- critical for queries: select * from shopping_lists where user_id = ?
create index if not exists idx_shopping_lists_user_id on shopping_lists(user_id);

comment on index idx_shopping_lists_user_id is 'filter shopping lists by user';

-- compound index on (user_id, created_at desc) for sorted list history
-- critical for queries: select * from shopping_lists where user_id = ? order by created_at desc
-- used in shopping list history view (newest first)
create index if not exists idx_shopping_lists_created_at on shopping_lists(user_id, created_at desc);

comment on index idx_shopping_lists_created_at is 'sorted shopping list history - newest first';

-- shopping_list_items indexes
-- index on shopping_list_id for joining with shopping_lists
-- critical for queries: select * from shopping_list_items where shopping_list_id = ?
create index if not exists idx_shopping_list_items_list_id on shopping_list_items(shopping_list_id);

comment on index idx_shopping_list_items_list_id is 'join items with shopping lists';

-- compound index on (shopping_list_id, category, sort_order) for grouped export
-- critical for pdf/txt export: group by category, sort within category
-- query: select * from shopping_list_items where shopping_list_id = ? order by category, sort_order
-- category order: nabiał, warzywa, owoce, mięso, pieczywo, przyprawy, inne (fr-026)
create index if not exists idx_shopping_list_items_category_sort
    on shopping_list_items(shopping_list_id, category, sort_order);

comment on index idx_shopping_list_items_category_sort is 'group by category and sort for pdf/txt export';

-- index strategy notes:
-- - total 7 indexes (minimal for mvp - avoid over-indexing)
-- - compound indexes for multi-column filters and sorts
-- - monitoring through supabase dashboard for query performance
-- - additional indexes only if explain analyze shows bottleneck
-- - indexes optimize reads but slow down writes (acceptable for mvp usage pattern)
