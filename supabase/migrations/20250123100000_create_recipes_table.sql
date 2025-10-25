-- migration: create recipes table
-- purpose: create the main recipes table for storing user recipes
-- tables affected: recipes
-- dependencies: auth.users (supabase auth)
-- notes: enables rls for data isolation per user

-- create recipes table
-- stores user-created recipes with name and instructions
-- each recipe belongs to one user (user_id foreign key)
-- cascade delete ensures gdpr compliance (deleting user deletes all recipes)
create table if not exists recipes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    instructions text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- constraints
    -- name must be between 3 and 100 characters (fr-006)
    constraint recipes_name_length check (char_length(name) >= 3 and char_length(name) <= 100)
);

-- add table comments for documentation
comment on table recipes is 'user recipes with name and cooking instructions';
comment on column recipes.id is 'unique identifier for the recipe';
comment on column recipes.user_id is 'owner of the recipe (references auth.users)';
comment on column recipes.name is 'recipe name (3-100 characters)';
comment on column recipes.instructions is 'cooking instructions (required, no length limit)';
comment on column recipes.created_at is 'timestamp when recipe was created';
comment on column recipes.updated_at is 'timestamp when recipe was last modified (auto-updated by trigger)';

-- enable row level security
-- this is critical for data isolation between users
-- without rls, users could see each other's recipes
alter table recipes enable row level security;