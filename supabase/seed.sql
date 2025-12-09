-- seed data for local development and testing
-- purpose: provide example data for testing shopmate features
-- tables: recipes, ingredients, meal_plan, shopping_lists, shopping_list_items
-- usage: supabase db reset (automatically runs seed.sql)

-- ============================================================================
-- test users (using supabase auth)
-- ============================================================================

-- note: in real environment, users are created through supabase auth
-- for testing, we reference existing test user ids
-- create test users via supabase dashboard or auth api before running seed

-- test user 1: dev@shopmate.pl (id: 11111111-1111-1111-1111-111111111111)
-- test user 2: test@shopmate.pl (id: 22222222-2222-2222-2222-222222222222)

-- ============================================================================
-- seed recipes for test user 1
-- ============================================================================

insert into recipes (id, user_id, name, instructions) values
    -- breakfast recipes
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
     'Omlet z warzywami',
     'Rozbij 3 jajka do miski. Dodaj mleko, sól, pieprz. Posiekaj paprykę i cebulę. Rozgrzej patelnię z masłem. Wlej jajka, dodaj warzywa. Smaż 5-7 minut.'),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
     'Naleśniki klasyczne',
     'Wymieszaj 200g mąki, 300ml mleka, 2 jajka. Dodaj szczyptę soli. Zostaw ciasto na 30 minut. Smaż cienkie placki na rozgrzanej patelni.'),

    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
     'Kanapki z awokado',
     'Pokrój awokado w plasterki. Posmaruj chleb masłem. Ułóż awokado na chlebie. Posyp solą, pieprzem, chili. Skrop sokiem z cytryny.'),

    -- lunch recipes
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
     'Spaghetti bolognese',
     'Podsmaż cebulę i czosnek. Dodaj mięso mielone, smaż do zbrązowienia. Wlej pomidory, dodaj oregano, bazylię. Gotuj 30 minut. Ugotuj makaron al dente. Wymieszaj z sosem.'),

    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
     'Rosół z kury',
     'Włóż kurczaka do garnka z wodą. Dodaj marchew, pietruszkę, seler, cebulę. Gotuj 2 godziny na małym ogniu. Dopraw solą, pieprzem. Przecedź. Podawaj z makaronem.'),

    ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111',
     'Sałatka grecka',
     'Pokrój pomidory, ogórka, paprykę. Dodaj oliwki, ser feta. Polej oliwą z oliwek. Dopraw solą, oregano. Wymieszaj.'),

    -- dinner recipes
    ('11111111-2222-3333-4444-555555555555', '11111111-1111-1111-1111-111111111111',
     'Pierś z kurczaka z ryżem',
     'Oprósz pierś mąką, smaż na patelni. Ugotuj ryż. Przygotuj sos z śmietany i czosnku. Podawaj kurczaka z ryżem i sosem.'),

    ('22222222-3333-4444-5555-666666666666', '11111111-1111-1111-1111-111111111111',
     'Zapiekanka ziemniaczana',
     'Pokrój ziemniaki w plasterki. Ułóż warstwami z serem i boczkiem. Zalej śmietaną. Zapiekaj 45 minut w 180°C.'),

    ('33333333-4444-5555-6666-777777777777', '11111111-1111-1111-1111-111111111111',
     'Kotlety schabowe',
     'Rozbij schabowy tłuczkiem. Obtocz w mące, jajku, bułce tartej. Smaż na rozgrzanym oleju do złotego koloru. Podawaj z ziemniakami i surówką.'),

    ('44444444-5555-6666-7777-888888888888', '11111111-1111-1111-1111-111111111111',
     'Pizza margherita',
     'Przygotuj ciasto drożdżowe. Rozwałkuj. Posmaruj sosem pomidorowym. Ułóż mozzarellę, bazylię. Piecz 15 minut w 220°C.')
on conflict (id) do nothing;

-- ============================================================================
-- seed ingredients for recipes
-- ============================================================================

insert into ingredients (recipe_id, name, quantity, unit, sort_order) values
    -- omlet z warzywami
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'jajka', 3, 'szt', 0),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mleko', 50, 'ml', 1),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'papryka', 1, 'szt', 2),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cebula', 1, 'szt', 3),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'masło', 20, 'g', 4),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sól', null, null, 5),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pieprz', null, null, 6),

    -- naleśniki klasyczne
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mąka', 200, 'g', 0),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mleko', 300, 'ml', 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'jajka', 2, 'szt', 2),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sól', null, null, 3),

    -- kanapki z awokado
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'awokado', 2, 'szt', 0),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'chleb', 4, 'kromki', 1),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'masło', 30, 'g', 2),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'cytryna', 1, 'szt', 3),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'sól', null, null, 4),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'pieprz', null, null, 5),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'chili', null, null, 6),

    -- spaghetti bolognese
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'mięso mielone', 500, 'g', 0),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'pomidory z puszki', 400, 'g', 1),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cebula', 1, 'szt', 2),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'czosnek', 2, 'ząbki', 3),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'makaron spaghetti', 400, 'g', 4),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'oregano', null, null, 5),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bazylia', null, null, 6),

    -- rosół z kury
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'kurczak', 1, 'szt', 0),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'marchew', 2, 'szt', 1),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'pietruszka', 1, 'szt', 2),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'seler', 1, 'szt', 3),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cebula', 1, 'szt', 4),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'makaron', 100, 'g', 5),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'sól', null, null, 6),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'pieprz', null, null, 7),

    -- sałatka grecka
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'pomidory', 3, 'szt', 0),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ogórek', 1, 'szt', 1),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'papryka', 1, 'szt', 2),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'oliwki', 100, 'g', 3),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ser feta', 200, 'g', 4),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'oliwa z oliwek', 50, 'ml', 5),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'oregano', null, null, 6),

    -- pierś z kurczaka z ryżem
    ('11111111-2222-3333-4444-555555555555', 'pierś z kurczaka', 2, 'szt', 0),
    ('11111111-2222-3333-4444-555555555555', 'ryż', 200, 'g', 1),
    ('11111111-2222-3333-4444-555555555555', 'mąka', 50, 'g', 2),
    ('11111111-2222-3333-4444-555555555555', 'śmietana', 200, 'ml', 3),
    ('11111111-2222-3333-4444-555555555555', 'czosnek', 2, 'ząbki', 4),

    -- zapiekanka ziemniaczana
    ('22222222-3333-4444-5555-666666666666', 'ziemniaki', 1, 'kg', 0),
    ('22222222-3333-4444-5555-666666666666', 'ser żółty', 200, 'g', 1),
    ('22222222-3333-4444-5555-666666666666', 'boczek', 150, 'g', 2),
    ('22222222-3333-4444-5555-666666666666', 'śmietana', 300, 'ml', 3),

    -- kotlety schabowe
    ('33333333-4444-5555-6666-777777777777', 'schab', 4, 'plastry', 0),
    ('33333333-4444-5555-6666-777777777777', 'mąka', 100, 'g', 1),
    ('33333333-4444-5555-6666-777777777777', 'jajka', 2, 'szt', 2),
    ('33333333-4444-5555-6666-777777777777', 'bułka tarta', 150, 'g', 3),
    ('33333333-4444-5555-6666-777777777777', 'olej', 100, 'ml', 4),

    -- pizza margherita
    ('44444444-5555-6666-7777-888888888888', 'mąka', 300, 'g', 0),
    ('44444444-5555-6666-7777-888888888888', 'drożdże', 7, 'g', 1),
    ('44444444-5555-6666-7777-888888888888', 'sos pomidorowy', 200, 'g', 2),
    ('44444444-5555-6666-7777-888888888888', 'mozzarella', 250, 'g', 3),
    ('44444444-5555-6666-7777-888888888888', 'bazylia', null, null, 4)
on conflict do nothing;

-- ============================================================================
-- seed meal plan for current week (test user 1)
-- ============================================================================

-- calculate current week's monday
-- for testing, use fixed date: 2025-01-20 (monday)

insert into meal_plan (user_id, recipe_id, week_start_date, day_of_week, meal_type) values
    -- monday
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-01-20', 1, 'breakfast'),
    ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2025-01-20', 1, 'lunch'),
    ('11111111-1111-1111-1111-111111111111', '11111111-2222-3333-4444-555555555555', '2025-01-20', 1, 'dinner'),

    -- tuesday
    ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2025-01-20', 2, 'breakfast'),
    ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2025-01-20', 2, 'lunch'),
    ('11111111-1111-1111-1111-111111111111', '22222222-3333-4444-5555-666666666666', '2025-01-20', 2, 'dinner'),

    -- wednesday
    ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-01-20', 3, 'breakfast'),
    ('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '2025-01-20', 3, 'lunch'),
    ('11111111-1111-1111-1111-111111111111', '33333333-4444-5555-6666-777777777777', '2025-01-20', 3, 'dinner'),

    -- thursday
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-01-20', 4, 'breakfast'),
    ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2025-01-20', 4, 'lunch'),
    ('11111111-1111-1111-1111-111111111111', '44444444-5555-6666-7777-888888888888', '2025-01-20', 4, 'dinner'),

    -- friday
    ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2025-01-20', 5, 'breakfast'),
    ('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '2025-01-20', 5, 'lunch'),
    ('11111111-1111-1111-1111-111111111111', '11111111-2222-3333-4444-555555555555', '2025-01-20', 5, 'dinner')
on conflict do nothing;

-- ============================================================================
-- seed shopping list (test user 1)
-- ============================================================================

insert into shopping_lists (id, user_id, name, week_start_date) values
    ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111',
     'Lista zakupów - tydzień 20-26 stycznia', '2025-01-20')
on conflict (id) do nothing;

-- seed shopping list items with ai categories
insert into shopping_list_items (shopping_list_id, ingredient_name, quantity, unit, category, sort_order) values
    -- nabiał
    ('99999999-9999-9999-9999-999999999999', 'jajka', 10, 'szt', 'Nabiał', 0),
    ('99999999-9999-9999-9999-999999999999', 'mleko', 650, 'ml', 'Nabiał', 1),
    ('99999999-9999-9999-9999-999999999999', 'śmietana', 500, 'ml', 'Nabiał', 2),
    ('99999999-9999-9999-9999-999999999999', 'ser żółty', 200, 'g', 'Nabiał', 3),
    ('99999999-9999-9999-9999-999999999999', 'ser feta', 200, 'g', 'Nabiał', 4),
    ('99999999-9999-9999-9999-999999999999', 'masło', 50, 'g', 'Nabiał', 5),

    -- warzywa
    ('99999999-9999-9999-9999-999999999999', 'pomidory', 3, 'szt', 'Warzywa', 0),
    ('99999999-9999-9999-9999-999999999999', 'papryka', 3, 'szt', 'Warzywa', 1),
    ('99999999-9999-9999-9999-999999999999', 'cebula', 4, 'szt', 'Warzywa', 2),
    ('99999999-9999-9999-9999-999999999999', 'czosnek', 4, 'ząbki', 'Warzywa', 3),
    ('99999999-9999-9999-9999-999999999999', 'ogórek', 1, 'szt', 'Warzywa', 4),
    ('99999999-9999-9999-9999-999999999999', 'marchew', 2, 'szt', 'Warzywa', 5),
    ('99999999-9999-9999-9999-999999999999', 'ziemniaki', 1, 'kg', 'Warzywa', 6),

    -- owoce
    ('99999999-9999-9999-9999-999999999999', 'awokado', 2, 'szt', 'Owoce', 0),
    ('99999999-9999-9999-9999-999999999999', 'cytryna', 1, 'szt', 'Owoce', 1),

    -- mięso
    ('99999999-9999-9999-9999-999999999999', 'mięso mielone', 500, 'g', 'Mięso', 0),
    ('99999999-9999-9999-9999-999999999999', 'pierś z kurczaka', 2, 'szt', 'Mięso', 1),
    ('99999999-9999-9999-9999-999999999999', 'kurczak', 1, 'szt', 'Mięso', 2),
    ('99999999-9999-9999-9999-999999999999', 'schab', 4, 'plastry', 'Mięso', 3),
    ('99999999-9999-9999-9999-999999999999', 'boczek', 150, 'g', 'Mięso', 4),

    -- pieczywo
    ('99999999-9999-9999-9999-999999999999', 'chleb', 4, 'kromki', 'Pieczywo', 0),
    ('99999999-9999-9999-9999-999999999999', 'mąka', 650, 'g', 'Pieczywo', 1),
    ('99999999-9999-9999-9999-999999999999', 'bułka tarta', 150, 'g', 'Pieczywo', 2),

    -- przyprawy
    ('99999999-9999-9999-9999-999999999999', 'sól', null, null, 'Przyprawy', 0),
    ('99999999-9999-9999-9999-999999999999', 'pieprz', null, null, 'Przyprawy', 1),
    ('99999999-9999-9999-9999-999999999999', 'oregano', null, null, 'Przyprawy', 2),
    ('99999999-9999-9999-9999-999999999999', 'bazylia', null, null, 'Przyprawy', 3),
    ('99999999-9999-9999-9999-999999999999', 'chili', null, null, 'Przyprawy', 4),

    -- inne
    ('99999999-9999-9999-9999-999999999999', 'ryż', 200, 'g', 'Inne', 0),
    ('99999999-9999-9999-9999-999999999999', 'makaron spaghetti', 400, 'g', 'Inne', 1),
    ('99999999-9999-9999-9999-999999999999', 'makaron', 100, 'g', 'Inne', 2),
    ('99999999-9999-9999-9999-999999999999', 'oliwki', 100, 'g', 'Inne', 3),
    ('99999999-9999-9999-9999-999999999999', 'oliwa z oliwek', 50, 'ml', 'Inne', 4),
    ('99999999-9999-9999-9999-999999999999', 'olej', 100, 'ml', 'Inne', 5),
    ('99999999-9999-9999-9999-999999999999', 'pomidory z puszki', 400, 'g', 'Inne', 6),
    ('99999999-9999-9999-9999-999999999999', 'sos pomidorowy', 200, 'g', 'Inne', 7),
    ('99999999-9999-9999-9999-999999999999', 'mozzarella', 250, 'g', 'Inne', 8),
    ('99999999-9999-9999-9999-999999999999', 'drożdże', 7, 'g', 'Inne', 9)
on conflict do nothing;

-- ============================================================================
-- verification queries
-- ============================================================================

-- uncomment to verify seed data was inserted correctly

-- select count(*) as recipe_count from recipes;
-- select count(*) as ingredient_count from ingredients;
-- select count(*) as meal_plan_count from meal_plan;
-- select count(*) as shopping_list_count from shopping_lists;
-- select count(*) as shopping_list_item_count from shopping_list_items;

-- expected results:
-- recipe_count: 10
-- ingredient_count: 62
-- meal_plan_count: 15
-- shopping_list_count: 1
-- shopping_list_item_count: 39
