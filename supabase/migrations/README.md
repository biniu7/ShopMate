# Supabase Database Migrations - ShopMate MVP

**Data utworzenia:** 2025-01-23
**Status:** Gotowe do wdrożenia
**Baza danych:** PostgreSQL (Supabase)

## Przegląd migracji

Ten folder zawiera wszystkie migracje bazy danych dla projektu ShopMate MVP. Migracje są wykonywane sekwencyjnie przez Supabase CLI.

### Lista migracji (w kolejności wykonania)

1. **20250123100000_create_recipes_table.sql**
   - Tworzy tabelę `recipes` (przepisy kulinarne)
   - Włącza Row Level Security
   - Zależności: `auth.users`

2. **20250123100100_create_ingredients_table.sql**
   - Tworzy tabelę `ingredients` (składniki przepisów)
   - Relacja 1:N z `recipes`
   - CASCADE DELETE przy usunięciu przepisu
   - Włącza RLS

3. **20250123100200_create_meal_plan_table.sql**
   - Tworzy tabelę `meal_plan` (kalendarz tygodniowy)
   - 7 dni × 4 posiłki = 28 komórek kalendarza
   - UNIQUE constraint: jeden przepis na komórkę
   - Włącza RLS

4. **20250123100300_create_shopping_lists_tables.sql**
   - Tworzy tabele `shopping_lists` i `shopping_list_items`
   - Snapshot pattern - brak FK do `recipes` lub `meal_plan`
   - 7 kategorii AI: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
   - Włącza RLS

5. **20250123100400_create_indexes.sql**
   - 7 indeksów wydajnościowych
   - Compound indexes dla głównych zapytań
   - UNIQUE index dla `meal_plan` (zapobieganie duplikatom)

6. **20250123100500_create_rls_policies.sql**
   - Polityki Row Level Security dla wszystkich tabel
   - Izolacja danych per użytkownik
   - Granularne polityki (SELECT/INSERT/UPDATE/DELETE)
   - Role: `authenticated` (brak polityk dla `anon`)

7. **20250123100600_create_triggers_and_functions.sql**
   - Trigger automatycznej aktualizacji `updated_at`
   - RPC function `generate_shopping_list()` dla atomowego tworzenia list
   - SECURITY DEFINER z walidacją `auth.uid()`

---

## Uruchamianie migracji

### Lokalnie (Supabase CLI)

```bash
# Start local Supabase
supabase start

# Run migrations
supabase db reset

# Verify migrations
supabase db diff
```

### Staging / Production

```bash
# Link to remote project
supabase link --project-ref <project-id>

# Push migrations to remote
supabase db push

# Verify schema
supabase db remote commit
```

---

## Testowanie migracji

### 1. Sprawdzenie struktury tabel

```sql
-- Lista wszystkich tabel
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Kolumny dla konkretnej tabeli
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'recipes'
ORDER BY ordinal_position;
```

### 2. Testowanie RLS

```sql
-- Test jako User A
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

INSERT INTO recipes (user_id, name, instructions) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Test Recipe A', 'Test instructions');

-- Test jako User B (nie powinien widzieć przepisu User A)
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

SELECT * FROM recipes WHERE name = 'Test Recipe A';
-- Expected: 0 rows (RLS działa poprawnie)
```

### 3. Testowanie indeksów

```sql
-- Sprawdź czy indeksy zostały utworzone
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;

-- EXPLAIN ANALYZE dla głównego zapytania kalendarza
EXPLAIN ANALYZE
SELECT mp.*, r.name
FROM meal_plan mp
JOIN recipes r ON mp.recipe_id = r.id
WHERE mp.user_id = '11111111-1111-1111-1111-111111111111'
  AND mp.week_start_date = '2025-01-20';
-- Powinna używać idx_meal_plan_user_week
```

### 4. Testowanie trigger'ów

```sql
-- Wstaw przepis
INSERT INTO recipes (user_id, name, instructions) VALUES
    (auth.uid(), 'Test', 'Test')
RETURNING created_at, updated_at;

-- Poczekaj 1 sekundę, następnie zaktualizuj
SELECT pg_sleep(1);

UPDATE recipes SET name = 'Updated Test'
WHERE name = 'Test'
RETURNING created_at, updated_at;
-- updated_at powinien być nowszy niż created_at
```

### 5. Testowanie RPC function

```typescript
// Test w aplikacji TypeScript
const { data, error } = await supabase.rpc('generate_shopping_list', {
    p_name: 'Test Shopping List',
    p_week_start_date: '2025-01-20',
    p_items: [
        {
            ingredient_name: 'mleko',
            quantity: 2,
            unit: 'l',
            category: 'Nabiał',
            sort_order: 0
        },
        {
            ingredient_name: 'chleb',
            quantity: 1,
            unit: 'szt',
            category: 'Pieczywo',
            sort_order: 1
        }
    ]
});

console.log('Created shopping list ID:', data);
```

---

## Rollback migracji

⚠️ **UWAGA:** Supabase nie ma automatycznego rollback. Rollback wymaga ręcznego pisania SQL.

### Przykładowy rollback (reverse order)

```sql
-- 6. Drop triggers and functions
DROP TRIGGER IF EXISTS recipes_updated_at ON recipes;
DROP TRIGGER IF EXISTS shopping_lists_updated_at ON shopping_lists;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS generate_shopping_list(varchar, date, jsonb);

-- 5. Drop RLS policies
DROP POLICY IF EXISTS recipes_select ON recipes;
DROP POLICY IF EXISTS recipes_insert ON recipes;
DROP POLICY IF EXISTS recipes_update ON recipes;
DROP POLICY IF EXISTS recipes_delete ON recipes;
-- ... (wszystkie polityki)

-- 4. Drop indexes
DROP INDEX IF EXISTS idx_recipes_user_id;
DROP INDEX IF EXISTS idx_ingredients_recipe_id;
-- ... (wszystkie indeksy)

-- 3. Drop shopping tables
DROP TABLE IF EXISTS shopping_list_items CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;

-- 2. Drop meal_plan
DROP TABLE IF EXISTS meal_plan CASCADE;

-- 1. Drop ingredients and recipes
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
```

---

## Checklist produkcyjny

Przed wdrożeniem na produkcję:

### Przed uruchomieniem migracji
- [ ] Backup bazy danych (Supabase automatic backup aktywny)
- [ ] Review wszystkich migracji przez tech lead
- [ ] Testy migracji na lokalnym środowisku
- [ ] Testy migracji na staging environment

### Po uruchomieniu migracji
- [ ] Weryfikacja struktury tabel (`\d+ table_name`)
- [ ] Test RLS policies (multi-user scenarios)
- [ ] Test indeksów (EXPLAIN ANALYZE)
- [ ] Test trigger'ów (`updated_at` aktualizuje się)
- [ ] Test RPC function (`generate_shopping_list`)
- [ ] Generowanie TypeScript types (`supabase gen types`)
- [ ] Integration tests (Vitest + Supabase client)

### Security audit
- [ ] RLS włączone na wszystkich tabelach
- [ ] Polityki RLS pokrywają wszystkie operacje (SELECT/INSERT/UPDATE/DELETE)
- [ ] Test izolacji użytkowników (User A nie widzi danych User B)
- [ ] Penetration testing RLS bypass attempts
- [ ] SQL injection testing (parametryzowane zapytania)

### Performance baseline
- [ ] Query latency <100ms (p95) dla głównych zapytań
- [ ] EXPLAIN ANALYZE dla krytycznych queries
- [ ] Index usage verification (pg_stat_user_indexes)
- [ ] Connection pool monitoring (PgBouncer stats)

---

## TypeScript Types

Po uruchomieniu migracji, wygeneruj TypeScript types:

```bash
# Generuj types z remote database
supabase gen types typescript --project-id <project-id> > src/db/database.types.ts

# Lub z lokalnej bazy
supabase gen types typescript --local > src/db/database.types.ts
```

Przykład użycia w aplikacji:

```typescript
import { Database } from '@/db/database.types';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];

const recipe: Recipe = {
    id: '...',
    user_id: '...',
    name: 'Omlet',
    instructions: 'Rozbij jajka...',
    created_at: '2025-01-23T10:00:00Z',
    updated_at: '2025-01-23T10:00:00Z'
};
```

---

## Seed Data (Development)

Dla lokalnego development, utwórz `supabase/seed.sql`:

```sql
-- Example seed data for development
INSERT INTO auth.users (id, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'dev@shopmate.pl');

INSERT INTO recipes (id, user_id, name, instructions) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Omlet', 'Rozbij 3 jajka, dodaj mleko, smaż na patelni.'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Naleśniki', 'Przygotuj ciasto, smaż cienkie placki.');

INSERT INTO ingredients (recipe_id, name, quantity, unit, sort_order) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'jajka', 3, 'szt', 0),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mleko', 50, 'ml', 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mąka', 200, 'g', 0),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mleko', 300, 'ml', 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'jajka', 2, 'szt', 2);
```

---

## Monitoring i Maintenance

### Supabase Dashboard
- Database → Tables: sprawdź strukturę
- Database → Roles & Policies: weryfikuj RLS
- Database → Indexes: monitor index usage
- Database → Performance: query performance insights

### SQL Queries dla monitoring

```sql
-- Rozmiar tabel
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Nieużywane indeksy
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- Slow queries (wymaga pg_stat_statements)
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

---

## Troubleshooting

### Problem: Migracja nie wykonuje się

**Rozwiązanie:**
```bash
# Sprawdź logi Supabase
supabase status

# Reset lokalnej bazy
supabase db reset

# Sprawdź składnię SQL
psql -h localhost -U postgres -d postgres -f migrations/20250123100000_create_recipes_table.sql
```

### Problem: RLS blokuje zapytania

**Rozwiązanie:**
```sql
-- Tymczasowo wyłącz RLS (TYLKO na development!)
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;

-- Sprawdź czy auth.uid() zwraca prawidłową wartość
SELECT auth.uid();

-- Sprawdź polityki
SELECT * FROM pg_policies WHERE tablename = 'recipes';
```

### Problem: Duplikaty w meal_plan

**Rozwiązanie:**
- UNIQUE index `idx_meal_plan_unique_assignment` powinien zapobiegać duplikatom
- Sprawdź czy index istnieje: `\d+ meal_plan`
- Jeśli brak indexu, uruchom ponownie migrację 4

---

## Dokumentacja i zasoby

- **Schemat bazy danych:** `.ai/doc/12_db-plan.md`
- **PRD:** `.ai/doc/4_prd.md`
- **Notatki z planowania:** `.ai/doc/11_podsumowanie-bazy-danych.md`
- **Supabase Docs:** https://supabase.com/docs/guides/database/overview
- **PostgreSQL Docs:** https://www.postgresql.org/docs/current/

---

**Migracje przygotowane:** 2025-01-23
**Autor:** Claude Code (Database Migration Specialist)
**Status:** ✅ Gotowe do wdrożenia
**Review wymagany:** Tech Lead przed wdrożeniem na produkcję
