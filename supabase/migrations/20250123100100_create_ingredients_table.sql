-- migration: create ingredients table
-- purpose: create table for recipe ingredients with quantities and units
-- tables affected: ingredients
-- dependencies: recipes
-- notes: no category field - categorization happens only in shopping_list_items

-- create ingredients table
-- stores ingredients for each recipe (1:n relationship)
-- each ingredient belongs to one recipe (recipe_id foreign key)
-- cascade delete ensures ingredients are removed when recipe is deleted
create table if not exists ingredients (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid not null references recipes(id) on delete cascade,
    name varchar(100) not null,
    quantity numeric,
    unit varchar(50),
    sort_order integer not null default 0,

    -- constraints
    -- name must be between 1 and 100 characters
    constraint ingredients_name_length check (char_length(name) >= 1 and char_length(name) <= 100),
    -- quantity must be positive or null (for ingredients like "salt to taste")
    constraint ingredients_quantity_positive check (quantity is null or quantity > 0),
    -- unit max length 50 characters or null
    constraint ingredients_unit_length check (unit is null or char_length(unit) <= 50),
    -- sort_order must be non-negative
    constraint ingredients_sort_order_positive check (sort_order >= 0)
);

-- add table comments for documentation
comment on table ingredients is 'ingredients for recipes with optional quantities and units';
comment on column ingredients.id is 'unique identifier for the ingredient';
comment on column ingredients.recipe_id is 'recipe this ingredient belongs to';
comment on column ingredients.name is 'ingredient name (1-100 characters)';
comment on column ingredients.quantity is 'amount of ingredient (positive number or null)';
comment on column ingredients.unit is 'unit of measurement (max 50 characters, optional)';
comment on column ingredients.sort_order is 'display order in recipe (0+)';

-- important design decision: no category field
-- rationale: categorization is contextual (shopping vs cooking)
-- categories are assigned during shopping list generation by ai
-- same ingredient may have different categories in different shopping lists
comment on table ingredients is 'ingredients for recipes - no category field, categorization happens in shopping_list_items';

-- enable row level security
-- access control is enforced through recipe ownership
-- users can only access ingredients of their own recipes
alter table ingredients enable row level security;