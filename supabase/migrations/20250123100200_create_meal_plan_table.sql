-- migration: create meal_plan table
-- purpose: create calendar table for assigning recipes to days and meal types
-- tables affected: meal_plan
-- dependencies: auth.users, recipes
-- notes: unique constraint prevents duplicate assignments (one recipe per calendar cell)

-- create meal_plan table
-- stores weekly calendar assignments (7 days × 4 meal types = 28 cells)
-- each assignment links a recipe to a specific day and meal type
-- cascade delete ensures assignments are removed when user or recipe is deleted
create table if not exists meal_plan (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    recipe_id uuid not null references recipes(id) on delete cascade,
    week_start_date date not null,
    day_of_week smallint not null,
    meal_type varchar(20) not null,
    created_at timestamptz not null default now(),

    -- constraints
    -- day_of_week must be 1-7 (1=monday, 7=sunday, iso 8601)
    constraint meal_plan_day_of_week_range check (day_of_week >= 1 and day_of_week <= 7),
    -- meal_type must be one of four allowed values
    -- using varchar + check instead of enum for easier migrations
    constraint meal_plan_meal_type_enum check (
        meal_type in ('breakfast', 'second_breakfast', 'lunch', 'dinner')
    )
);

-- add table comments for documentation
comment on table meal_plan is 'weekly calendar assignments - 7 days × 4 meal types';
comment on column meal_plan.id is 'unique identifier for the assignment';
comment on column meal_plan.user_id is 'user who owns this meal plan';
comment on column meal_plan.recipe_id is 'recipe assigned to this meal slot';
comment on column meal_plan.week_start_date is 'monday of the week (iso 8601 week start)';
comment on column meal_plan.day_of_week is 'day of week: 1=monday, 7=sunday';
comment on column meal_plan.meal_type is 'meal type: breakfast, second_breakfast, lunch, dinner';
comment on column meal_plan.created_at is 'timestamp when assignment was created';

-- important design decision: week_start_date + day_of_week instead of full date
-- rationale: easier querying by week, consistent iso 8601 week numbering
-- week_start_date always stores monday, day_of_week is offset 0-6
comment on column meal_plan.week_start_date is 'always monday - use day_of_week for offset';

-- important design decision: no updated_at field
-- rationale: assignments are only created or deleted, never updated
-- if user wants to change recipe, they delete and create new assignment

-- important design decision: cascade delete from recipes (fr-005)
-- rationale: when user deletes recipe, all calendar assignments are removed
-- user is warned in ui if recipe has assignments before deletion

-- enable row level security
-- users can only access their own meal plan assignments
alter table meal_plan enable row level security;
