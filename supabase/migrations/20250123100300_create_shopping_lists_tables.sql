-- migration: create shopping_lists and shopping_list_items tables
-- purpose: create tables for saved shopping lists with ai categorization
-- tables affected: shopping_lists, shopping_list_items
-- dependencies: auth.users
-- notes: snapshot pattern - no foreign keys to recipes or meal_plan

-- create shopping_lists table
-- stores saved shopping lists as immutable snapshots
-- snapshot pattern: lists don't update when recipes are edited
-- week_start_date is null if list was generated from manually selected recipes
create table if not exists shopping_lists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(200) not null default 'Lista zakupów',
    week_start_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- constraints
    -- name max 200 characters
    constraint shopping_lists_name_length check (char_length(name) <= 200)
);

-- add table comments for documentation
comment on table shopping_lists is 'saved shopping lists - immutable snapshots';
comment on column shopping_lists.id is 'unique identifier for the shopping list';
comment on column shopping_lists.user_id is 'owner of the shopping list';
comment on column shopping_lists.name is 'list name (max 200 characters)';
comment on column shopping_lists.week_start_date is 'week start if generated from calendar, null if from recipes';
comment on column shopping_lists.created_at is 'timestamp when list was created';
comment on column shopping_lists.updated_at is 'timestamp when list was last modified';

-- important design decision: snapshot pattern
-- no foreign keys to meal_plan or recipes
-- rationale: historical lists should not change when recipes are edited
-- user can compare shopping lists from different weeks
-- if recipe is edited, old lists remain unchanged
comment on table shopping_lists is 'snapshot pattern - lists are immutable after creation';

-- important design decision: week_start_date nullable
-- null = list generated from manually selected recipes (fr-016 mode 2)
-- not null = list generated from calendar week (fr-016 mode 1)

-- enable row level security
-- users can only access their own shopping lists
alter table shopping_lists enable row level security;

-- create shopping_list_items table
-- stores individual items in shopping lists with ai categories
-- no foreign key to ingredients - items are copies at generation time
-- category assigned by openai gpt-4o mini or fallback to 'inne'
create table if not exists shopping_list_items (
    id uuid primary key default gen_random_uuid(),
    shopping_list_id uuid not null references shopping_lists(id) on delete cascade,
    ingredient_name varchar(100) not null,
    quantity numeric,
    unit varchar(50),
    category varchar(20) not null default 'Inne',
    is_checked boolean not null default false,
    sort_order integer not null default 0,

    -- constraints
    -- ingredient_name must be between 1 and 100 characters
    constraint shopping_list_items_name_length check (
        char_length(ingredient_name) >= 1 and char_length(ingredient_name) <= 100
    ),
    -- quantity must be positive or null
    constraint shopping_list_items_quantity_positive check (
        quantity is null or quantity > 0
    ),
    -- unit max 50 characters or null
    constraint shopping_list_items_unit_length check (
        unit is null or char_length(unit) <= 50
    ),
    -- category must be one of 7 allowed polish categories
    -- using polish values for mvp (only polish language - fr-027)
    -- migration path for i18n: change to keys ('dairy') + translation table
    constraint shopping_list_items_category_enum check (
        category in ('Nabiał', 'Warzywa', 'Owoce', 'Mięso', 'Pieczywo', 'Przyprawy', 'Inne')
    ),
    -- sort_order must be non-negative
    constraint shopping_list_items_sort_order_positive check (sort_order >= 0)
);

-- add table comments for documentation
comment on table shopping_list_items is 'items in shopping lists with ai-assigned categories';
comment on column shopping_list_items.id is 'unique identifier for the item';
comment on column shopping_list_items.shopping_list_id is 'shopping list this item belongs to';
comment on column shopping_list_items.ingredient_name is 'ingredient name (1-100 characters, case preserved)';
comment on column shopping_list_items.quantity is 'aggregated quantity (positive or null)';
comment on column shopping_list_items.unit is 'unit of measurement (max 50 characters, optional)';
comment on column shopping_list_items.category is 'ai-assigned category or "inne" fallback';
comment on column shopping_list_items.is_checked is 'whether item was purchased (ui state)';
comment on column shopping_list_items.sort_order is 'display order within category (0+)';

-- important design decision: no foreign key to ingredients
-- snapshot pattern: items are copies at generation time
-- rationale: same as shopping_lists - immutable historical records
comment on column shopping_list_items.ingredient_name is 'copy of ingredient name - no fk to ingredients';

-- important design decision: category as polish values
-- 'nabiał', 'warzywa', etc. instead of keys ('dairy', 'vegetables')
-- rationale: mvp only supports polish (fr-027)
-- simpler queries: select * where category = 'nabiał'
-- migration path: add category_key column, migrate data, drop old column
comment on column shopping_list_items.category is 'polish values for mvp - migrate to keys for i18n';

-- important design decision: is_checked field
-- allows marking items as purchased during shopping
-- does not violate snapshot pattern - only ui state, not ingredient data
comment on column shopping_list_items.is_checked is 'ui state - does not violate snapshot pattern';

-- important design decision: numeric without precision for quantity
-- eliminates floating-point errors when aggregating ingredients
-- example: 200.5g + 300.7g = 501.2g (exact, not 501.19999999)
comment on column shopping_list_items.quantity is 'numeric unlimited precision - no floating-point errors';

-- enable row level security
-- access control through shopping_lists ownership
-- users can only access items in their own shopping lists
alter table shopping_list_items enable row level security;
