# Podsumowanie planowania bazy danych - ShopMate MVP

**Data:** 2025-01-23
**Wersja:** 1.0
**Status:** Gotowe do implementacji

---

## Decyzje podjęte podczas planowania

1. **Brak własnej tabeli `users`** - Wykorzystanie Supabase Auth (`auth.users`) jako single source of truth dla użytkowników
2. **Brak pola `category` w tabeli `ingredients`** - Kategoryzacja następuje dopiero podczas generowania listy zakupów przez AI
3. **CASCADE DELETE dla relacji `meal_plan → recipes`** - Automatyczne usuwanie przypisań w kalendarzu przy usunięciu przepisu
4. **Snapshot pattern dla list zakupów** - Brak relacji między `shopping_lists` a `meal_plan`, listy są niemutowalne po zapisie
5. **Brak normalizacji jednostek w MVP** - Składniki o różnych jednostkach pozostają jako osobne pozycje
6. **Pole `sort_order` obowiązkowe** - W `ingredients` i `shopping_list_items` dla kontroli kolejności wyświetlania
7. **Compound index na `meal_plan`** - `(user_id, week_start_date)` dla optymalizacji głównego zapytania kalendarza
8. **Dwa pola dla dat w `meal_plan`** - `week_start_date` (DATE) + `day_of_week` (SMALLINT 1-7) zamiast pełnej daty
9. **CASCADE DELETE dla GDPR compliance** - Wszystkie tabele aplikacyjne mają `ON DELETE CASCADE` od `auth.users(id)`
10. **RLS włączone na wszystkich tabelach** - Polityki dla SELECT/INSERT/UPDATE/DELETE per użytkownik
11. **CHECK constraints na wszystkich polach** - Defense in depth - walidacja na poziomie bazy danych i aplikacji (Zod)
12. **TIMESTAMPTZ dla wszystkich timestamp fields** - Zgodność międzynarodowa, automatic UTC conversion
13. **Brak UNIQUE constraint na `recipes.name`** - Użytkownik może mieć wiele przepisów o tej samej nazwie
14. **VARCHAR z CHECK constraint zamiast PostgreSQL ENUM** - Dla `meal_type` i `category` (łatwiejsze migracje)
15. **Pole `is_checked` w `shopping_list_items`** - Dla oznaczania zakupionych pozycji, nie narusza snapshot pattern
16. **Walidacja limitów na poziomie aplikacji** - 50 składników/przepis, 20 przepisów/lista - w Zod, nie w DB
17. **Brak pola `week_end_date`** - Wystarczy `week_start_date`, koniec to zawsze +6 dni
18. **PostgreSQL RPC function dla generowania list** - `generate_shopping_list()` zapewnia atomowość transakcji
19. **TEXT zamiast VARCHAR dla długich pól** - `instructions` i `name` jako TEXT z CHECK constraint na długość
20. **Brak dodatkowego pola `is_assigned_in_calendar`** - JOIN z `meal_plan` jest wystarczająco wydajny
21. **Polskie nazwy kategorii w bazie danych** - Zgodne z MVP scope (tylko język polski)
22. **Snake_case + plural dla tabel** - PostgreSQL convention, Supabase auto-mapuje do camelCase w TypeScript
23. **Hard deletes zamiast soft deletes** - Faktyczne DELETE z bazy, GDPR compliance, prostota MVP
24. **UNIQUE constraint na `meal_plan`** - `(user_id, week_start_date, day_of_week, meal_type)` zapobiega duplikatom
25. **NUMERIC bez precyzji dla `quantity`** - Unlimited precision, eliminuje floating-point errors przy sumowaniu
26. **Brak automatic LOWER() transform** - Przechowywanie `ingredient_name` w oryginalnej formie, normalizacja w aplikacji
27. **Supabase automatic backups** - BRAK custom backup logic w MVP, Pro tier PITR wystarczający
28. **Brak audit log / history table** - Wykluczony ze scope MVP, może być dodany post-MVP
29. **Automatyczne testy RLS w migrations** - SQL tests + integration tests (Vitest) dla security validation
30. **Minimalne indeksy dla MVP** - Unikanie over-indexing, monitoring przez Supabase Dashboard

---

## Dopasowane zalecenia

### 1. Architektura tabel i relacje

**Tabele główne:**
- `recipes` - Przepisy kulinarne użytkowników
- `ingredients` - Składniki powiązane z przepisami (relacja 1:N)
- `meal_plan` - Przypisania przepisów do kalendarza tygodniowego
- `shopping_lists` - Zapisane listy zakupów (snapshot)
- `shopping_list_items` - Składniki w listach zakupów (relacja 1:N)

**Relacje CASCADE DELETE:**
- `recipes.user_id → auth.users(id) ON DELETE CASCADE` (GDPR)
- `ingredients.recipe_id → recipes(id) ON DELETE CASCADE`
- `meal_plan.recipe_id → recipes(id) ON DELETE CASCADE` (FR-005)
- `meal_plan.user_id → auth.users(id) ON DELETE CASCADE` (GDPR)
- `shopping_lists.user_id → auth.users(id) ON DELETE CASCADE` (GDPR)
- `shopping_list_items.shopping_list_id → shopping_lists(id) ON DELETE CASCADE`

**Brak relacji:**
- `shopping_lists` NIE ma relacji z `meal_plan` (snapshot pattern)
- `shopping_list_items` NIE ma relacji z `ingredients` (snapshot pattern)

### 2. Typy danych i constrainty

**Klucze główne:**
- Wszystkie tabele: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`

**User references:**
- `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`

**Teksty:**
- Krótkie pola: `VARCHAR(N)` z CHECK constraint
- Długie pola: `TEXT` z CHECK constraint na `char_length()`
- `recipes.name`: TEXT, CHECK 3-100 znaków
- `recipes.instructions`: TEXT, CHECK 10-5000 znaków
- `ingredients.name`: VARCHAR(100), CHECK 1-100 znaków
- `ingredients.unit`: VARCHAR(50), nullable

**Liczby:**
- `quantity`: NUMERIC (unlimited precision), CHECK > 0 lub NULL
- `sort_order`: INTEGER NOT NULL DEFAULT 0, CHECK >= 0
- `day_of_week`: SMALLINT NOT NULL, CHECK 1-7

**Daty:**
- `week_start_date`: DATE (poniedziałek tygodnia)
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Enumeracje (VARCHAR z CHECK):**
- `meal_type`: VARCHAR(20), CHECK IN ('breakfast', 'second_breakfast', 'lunch', 'dinner')
- `category`: VARCHAR(20), CHECK IN ('Nabiał', 'Warzywa', 'Owoce', 'Mięso', 'Pieczywo', 'Przyprawy', 'Inne')

**Boolean:**
- `is_checked`: BOOLEAN NOT NULL DEFAULT FALSE

### 3. Indeksy dla wydajności

**Krytyczne indeksy:**
```sql
-- recipes
CREATE INDEX idx_recipes_user_id ON recipes(user_id);

-- ingredients
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);

-- meal_plan
CREATE INDEX idx_meal_plan_user_week ON meal_plan(user_id, week_start_date);
CREATE INDEX idx_meal_plan_recipe_id ON meal_plan(recipe_id);
CREATE UNIQUE INDEX idx_meal_plan_unique_assignment
  ON meal_plan(user_id, week_start_date, day_of_week, meal_type);

-- shopping_lists
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);

-- shopping_list_items
CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_category_sort
  ON shopping_list_items(shopping_list_id, category, sort_order);
```

### 4. Polityki Row Level Security (RLS)

**Wszystkie tabele:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`

**recipes:**
```sql
CREATE POLICY recipes_select ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY recipes_insert ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY recipes_update ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY recipes_delete ON recipes FOR DELETE USING (auth.uid() = user_id);
```

**ingredients (dostęp przez własność recipes):**
```sql
CREATE POLICY ingredients_select ON ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
  ));
CREATE POLICY ingredients_insert ON ingredients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
  ));
-- UPDATE i DELETE identycznie jak SELECT
```

**meal_plan:**
```sql
CREATE POLICY meal_plan_all ON meal_plan FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**shopping_lists:**
```sql
CREATE POLICY shopping_lists_all ON shopping_lists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**shopping_list_items (dostęp przez własność shopping_lists):**
```sql
CREATE POLICY shopping_list_items_all ON shopping_list_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE shopping_lists.id = shopping_list_items.shopping_list_id
      AND shopping_lists.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE shopping_lists.id = shopping_list_items.shopping_list_id
      AND shopping_lists.user_id = auth.uid()
  ));
```

### 5. Triggery i funkcje pomocnicze

**Trigger dla `updated_at`:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**RPC Function dla atomowego generowania listy zakupów:**
```sql
CREATE OR REPLACE FUNCTION generate_shopping_list(
  p_name VARCHAR,
  p_week_start_date DATE,
  p_items JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_list_id UUID;
BEGIN
  -- Insert shopping_list
  INSERT INTO shopping_lists (user_id, name, week_start_date)
  VALUES (auth.uid(), p_name, p_week_start_date)
  RETURNING id INTO v_list_id;

  -- Bulk insert shopping_list_items
  INSERT INTO shopping_list_items (
    shopping_list_id,
    ingredient_name,
    quantity,
    unit,
    category,
    sort_order
  )
  SELECT
    v_list_id,
    item->>'ingredient_name',
    (item->>'quantity')::NUMERIC,
    item->>'unit',
    item->>'category',
    (item->>'sort_order')::INTEGER
  FROM jsonb_array_elements(p_items) AS item;

  RETURN v_list_id;
END;
$$;
```

### 6. Naming conventions

**Tabele:** snake_case, plural
- `recipes`, `ingredients`, `shopping_lists`, `shopping_list_items`
- Wyjątek: `meal_plan` (logicznie singular)

**Kolumny:** snake_case, singular
- `user_id`, `recipe_id`, `shopping_list_id`
- `week_start_date`, `day_of_week`, `meal_type`
- `created_at`, `updated_at`
- `is_checked`, `sort_order`

**Indeksy:** `idx_<table>_<columns>`
- `idx_recipes_user_id`
- `idx_meal_plan_user_week`

**Polityki RLS:** `<table>_<action>`
- `recipes_select`, `recipes_insert`

### 7. Walidacja danych (CHECK constraints)

**recipes:**
```sql
CHECK (char_length(name) >= 3 AND char_length(name) <= 100)
CHECK (char_length(instructions) >= 10 AND char_length(instructions) <= 5000)
```

**ingredients:**
```sql
CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
CHECK (quantity IS NULL OR quantity > 0)
CHECK (unit IS NULL OR char_length(unit) <= 50)
CHECK (sort_order >= 0)
```

**meal_plan:**
```sql
CHECK (day_of_week >= 1 AND day_of_week <= 7)
CHECK (meal_type IN ('breakfast', 'second_breakfast', 'lunch', 'dinner'))
```

**shopping_list_items:**
```sql
CHECK (char_length(ingredient_name) >= 1 AND char_length(ingredient_name) <= 100)
CHECK (quantity IS NULL OR quantity > 0)
CHECK (category IN ('Nabiał', 'Warzywa', 'Owoce', 'Mięso', 'Pieczywo', 'Przyprawy', 'Inne'))
CHECK (sort_order >= 0)
```

---

## Szczegółowe podsumowanie planowania bazy danych

### Główne wymagania dotyczące schematu

ShopMate MVP wymaga schematu bazy danych PostgreSQL wspierającego:

1. **Zarządzanie przepisami (CRUD)** - Użytkownicy mogą tworzyć, edytować, usuwać przepisy z wieloma składnikami
2. **Kalendarz tygodniowy** - Plan posiłków: 7 dni × 4 posiłki (28 komórek), przypisywanie przepisów
3. **Generowanie list zakupów** - Agregacja składników z wybranych przepisów/dni kalendarza
4. **AI kategoryzacja** - Przechowywanie składników z kategoriami przypisanymi przez OpenAI GPT-4o mini
5. **Snapshot pattern** - Zapisane listy zakupów są niemutowalne, nie aktualizują się przy edycji przepisów
6. **Multi-user isolation** - Row Level Security zapewnia izolację danych między użytkownikami
7. **GDPR compliance** - Automatyczne usuwanie wszystkich danych użytkownika przy usunięciu konta

### Kluczowe encje i ich relacje

#### 1. `recipes` (Przepisy)
**Pola:**
- `id` UUID PK
- `user_id` UUID NOT NULL → `auth.users(id)` ON DELETE CASCADE
- `name` TEXT NOT NULL, CHECK 3-100 znaków
- `instructions` TEXT NOT NULL, CHECK 10-5000 znaków
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Relacje:**
- 1:N z `ingredients` (jeden przepis ma wiele składników)
- 1:N z `meal_plan` (jeden przepis może być przypisany do wielu posiłków)
- BRAK relacji z `shopping_list_items` (snapshot pattern)

**Indeksy:**
- `idx_recipes_user_id` dla filtrowania przepisów użytkownika

**Business rules:**
- Użytkownik może mieć wiele przepisów o tej samej nazwie (BRAK UNIQUE na name)
- Edycja przepisu aktualizuje `updated_at` (trigger)
- Usunięcie przepisu CASCADE usuwa składniki i przypisania w kalendarzu

#### 2. `ingredients` (Składniki przepisów)
**Pola:**
- `id` UUID PK
- `recipe_id` UUID NOT NULL → `recipes(id)` ON DELETE CASCADE
- `name` VARCHAR(100) NOT NULL, CHECK 1-100 znaków
- `quantity` NUMERIC, CHECK > 0 lub NULL
- `unit` VARCHAR(50), nullable
- `sort_order` INTEGER NOT NULL DEFAULT 0, CHECK >= 0

**Relacje:**
- N:1 z `recipes` (wiele składników należy do jednego przepisu)
- BRAK pola `category` (kategoryzacja tylko w `shopping_list_items`)

**Indeksy:**
- `idx_ingredients_recipe_id` dla JOIN z recipes

**Business rules:**
- Minimum 1 składnik na przepis (walidacja w aplikacji - Zod)
- Maksimum 50 składników na przepis (walidacja w aplikacji - Zod)
- `quantity` i `unit` opcjonalne (składniki typu "sól do smaku")
- `sort_order` określa kolejność wyświetlania w przepisie

#### 3. `meal_plan` (Kalendarz posiłków)
**Pola:**
- `id` UUID PK
- `user_id` UUID NOT NULL → `auth.users(id)` ON DELETE CASCADE
- `recipe_id` UUID NOT NULL → `recipes(id)` ON DELETE CASCADE
- `week_start_date` DATE NOT NULL (poniedziałek tygodnia ISO)
- `day_of_week` SMALLINT NOT NULL, CHECK 1-7 (1=Pon, 7=Niedz)
- `meal_type` VARCHAR(20) NOT NULL, CHECK IN ('breakfast', 'second_breakfast', 'lunch', 'dinner')
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Relacje:**
- N:1 z `recipes` (wiele przypisań może używać tego samego przepisu)
- N:1 z `auth.users` przez `user_id`

**Indeksy:**
- `idx_meal_plan_user_week` compound (user_id, week_start_date) - główne zapytanie kalendarza
- `idx_meal_plan_recipe_id` dla sprawdzania przypisań przed usunięciem przepisu
- `idx_meal_plan_unique_assignment` UNIQUE (user_id, week_start_date, day_of_week, meal_type) - zapobiega duplikatom

**Business rules:**
- Jeden przepis na komórkę kalendarza (UNIQUE constraint)
- Usunięcie przepisu CASCADE usuwa wszystkie przypisania (FR-005)
- Brak `updated_at` (przypisania rzadko edytowane, tylko DELETE/INSERT)
- Przechowywanie wszystkich tygodni (nie tylko bieżącego) - brak time limit

#### 4. `shopping_lists` (Zapisane listy zakupów)
**Pola:**
- `id` UUID PK
- `user_id` UUID NOT NULL → `auth.users(id)` ON DELETE CASCADE
- `name` VARCHAR(200) NOT NULL DEFAULT 'Lista zakupów'
- `week_start_date` DATE, nullable (NULL jeśli lista z przepisów, nie z kalendarza)
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Relacje:**
- 1:N z `shopping_list_items` (jedna lista ma wiele składników)
- BRAK relacji z `meal_plan` (snapshot pattern - lista nie aktualizuje się)

**Indeksy:**
- `idx_shopping_lists_user_id` dla historii list użytkownika

**Business rules:**
- Snapshot pattern: zapisana lista jest niemutowalna (późniejsze edycje przepisów NIE aktualizują listy)
- `week_start_date` NULL jeśli lista generowana "Z przepisów" (FR-016 Tryb 2)
- `updated_at` może się aktualizować przy zmianie `is_checked` w items (opcjonalne)

#### 5. `shopping_list_items` (Składniki w listach zakupów)
**Pola:**
- `id` UUID PK
- `shopping_list_id` UUID NOT NULL → `shopping_lists(id)` ON DELETE CASCADE
- `ingredient_name` VARCHAR(100) NOT NULL, CHECK 1-100 znaków
- `quantity` NUMERIC, CHECK > 0 lub NULL
- `unit` VARCHAR(50), nullable
- `category` VARCHAR(20) NOT NULL DEFAULT 'Inne', CHECK IN (7 kategorii)
- `is_checked` BOOLEAN NOT NULL DEFAULT FALSE
- `sort_order` INTEGER NOT NULL DEFAULT 0, CHECK >= 0

**Relacje:**
- N:1 z `shopping_lists` (wiele składników należy do jednej listy)
- BRAK relacji z `ingredients` (snapshot - kopia danych w momencie generowania)

**Indeksy:**
- `idx_shopping_list_items_list_id` dla JOIN z shopping_lists
- `idx_shopping_list_items_category_sort` compound (shopping_list_id, category, sort_order) dla grupowania i sortowania

**Business rules:**
- `ingredient_name` przechowywany w oryginalnej formie (case preserved)
- `category` przypisana przez OpenAI lub ręcznie przez użytkownika
- `is_checked` dla oznaczania zakupionych pozycji podczas zakupów (UI state)
- `sort_order` określa kolejność w ramach kategorii

### Ważne kwestie dotyczące bezpieczeństwa

#### Row Level Security (RLS)

**Obowiązkowe dla wszystkich tabel:**
```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
```

**Kluczowe zasady:**
1. Wszystkie polityki używają `auth.uid()` dla identyfikacji użytkownika
2. Tabele z bezpośrednim `user_id`: proste polityki `auth.uid() = user_id`
3. Tabele bez `user_id` (ingredients, shopping_list_items): polityki z EXISTS subquery
4. SECURITY DEFINER dla RPC functions z RLS checks wewnątrz

**Testing RLS:**
- Automatyczne testy SQL w migrations (DO $$ block)
- Integration tests (Vitest + Supabase client) z wieloma użytkownikami
- Manual testing checklist przed production deploy
- Critical security requirement (FR-015)

#### GDPR Compliance

**Automatyczne usuwanie danych:**
```sql
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

**Co jest usuwane przy usunięciu konta:**
1. `recipes` → CASCADE usuwa `ingredients` i `meal_plan`
2. `shopping_lists` → CASCADE usuwa `shopping_list_items`
3. Wszystkie dane użytkownika znikają z bazy

**Post-MVP considerations:**
- Export wszystkich danych użytkownika (GDPR right to data portability)
- Audit log przed usunięciem (compliance)

#### Defense in Depth

**Wielowarstwowa walidacja:**
1. **Frontend:** React forms z live validation
2. **Application (Zod schemas):** Walidacja w API endpoints
3. **Database (CHECK constraints):** Ostatnia linia obrony

**Przykład:**
- Frontend: disabled button jeśli nazwa < 3 znaki
- Zod: `name: z.string().min(3).max(100)`
- PostgreSQL: `CHECK (char_length(name) >= 3 AND char_length(name) <= 100)`

### Kwestie dotyczące skalowalności

#### Wydajność dla MVP (1000-10000 użytkowników)

**Główne zapytanie (kalendarz tygodnia):**
```sql
-- Optymalizowane przez idx_meal_plan_user_week
SELECT mp.*, r.name
FROM meal_plan mp
JOIN recipes r ON mp.recipe_id = r.id
WHERE mp.user_id = $1 AND mp.week_start_date = $2;
```
**Expected performance:** 10-20ms dla 28 przypisań

**Agregacja składników:**
- Wykonywana w aplikacji (JavaScript/TypeScript)
- Maksimum 20 przepisów × 50 składników = 1000 items (worst case)
- O(n) complexity dla agregacji z normalizacją case-insensitive

**Indeksy:**
- Minimalne indeksy dla MVP (7 indeksów total)
- Monitoring przez Supabase Dashboard dla query performance
- Dodatkowe indeksy tylko jeśli EXPLAIN ANALYZE pokazuje bottleneck

#### Długoterminowa skalowalność (>10k użytkowników)

**Potencjalne optymalizacje:**
1. **Local cache AI kategoryzacji** - Redis dla popularnych składników ("mleko" → "Nabiał")
2. **Partitioning `meal_plan`** - Po `user_id` lub `week_start_date` (>1M records)
3. **Read replicas** - Supabase Team tier dla heavy read load
4. **Materialized views** - Pre-computed agregacje (jeśli potrzebne)

**Monitorowane metryki:**
- Query response time (target <100ms p95)
- Database size (Pro tier: 8GB, Team tier: 100GB)
- Connection pool utilization (PgBouncer monitoring)

#### Backup & Recovery

**Supabase automatic backups (Pro tier):**
- Daily backups, 7-day Point-in-Time Recovery (PITR)
- RTO (Recovery Time Objective): <1 godzina
- RPO (Recovery Point Objective): <24 godziny

**MVP strategy:**
- Brak custom backup logic
- Monitoring backup status przez Supabase Dashboard
- Post-MVP: Weekly pg_dump do S3 dla paranoid backups

---

## Nierozwiązane kwestie

### 1. Performance testing pod obciążeniem
**Status:** Do wykonania po implementacji schematu

**Wymagane testy:**
- Load testing z 1000 concurrent users (Locust, k6)
- Query performance dla użytkowników z 500+ przepisami
- Agregacja listy zakupów dla 20 przepisów × 50 składników
- RLS overhead measurement (porównanie z/bez RLS)

**Action items:**
- Implementacja performance tests w CI/CD
- Baseline metrics dla MVP launch
- Monitoring dashboards (Supabase + custom Grafana)

### 2. Migracje i versioning schematu
**Status:** Strategie określone, implementacja pending

**Zalecenia:**
- Supabase migrations w `supabase/migrations/` jako timestamped SQL files
- Naming: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Każda migracja: idempotent (sprawdzanie `IF NOT EXISTS`)
- Rollback strategy: separate `down.sql` files (opcjonalne w MVP)

**Best practices:**
- Nigdy nie modyfikować starych migrations (tylko dodawać nowe)
- Testing migrations na staging database przed production
- Zero-downtime migrations dla production (additive changes only)

### 3. Strategia cache'owania danych
**Status:** Odłożone na post-MVP

**Potencjalne cache layers:**
1. **Browser cache** - TanStack Query (React Query) dla client-side caching
2. **CDN cache** - Static assets (images, fonts) przez Vercel
3. **Application cache** - Redis dla AI kategoryzacji (popularne składniki)
4. **Database cache** - PostgreSQL shared_buffers (managed przez Supabase)

**MVP decision:** Poleganie na PostgreSQL caching + TanStack Query, bez dedykowanego Redis

### 4. Monitoring i alerting setup
**Status:** Tools wybrane (Sentry + Supabase Dashboard), konfiguracja pending

**Metryki do monitorowania:**
- Error rate (Sentry): target <0.1% requestów
- Query latency (Supabase): target p95 <100ms
- RLS policy violations (Supabase logs)
- Database size growth (alert at 80% quota)
- Connection pool saturation (alert at >80% utilization)

**Alerts:**
- Critical: Database down, RLS bypass attempt
- Warning: Slow queries (>1s), wysokie error rate
- Info: Daily backup status, storage usage

### 5. Data seeding dla development i testing
**Status:** Do implementacji

**Wymagania:**
- Seed script dla local development (example recipes, ingredients, meal plans)
- Test fixtures dla integration tests (known user IDs, predictable data)
- Staging data sync strategy (anonymized production data?)

**Action items:**
- `supabase/seed.sql` z example data
- Factory functions w testach (TypeScript)
- Documentation dla onboarding nowych developerów

### 6. Edge cases i error handling
**Status:** Zidentyfikowane, implementacja per-feature

**Znane edge cases:**
1. Concurrent UPDATE na tym samym `meal_plan` slot (handled przez UNIQUE constraint)
2. Usunięcie przepisu podczas generowania listy zakupów (transaction isolation)
3. OpenAI API timeout podczas kategoryzacji (fallback do "Inne" - FR-019)
4. User osiąga limit 50 składników w przepisie (walidacja Zod)
5. Floating-point precision w sumowaniu quantities (NUMERIC eliminuje problem)

**Testing strategy:**
- Unit tests dla każdego edge case
- Integration tests dla concurrent operations
- Chaos engineering (opcjonalne post-MVP)

### 7. Internacjonalizacja (i18n) - przygotowanie schematu
**Status:** MVP = tylko polski, ale przygotować się na przyszłość

**Pytania otwarte:**
- Czy `category` w `shopping_list_items` powinno być od razu jako klucz ('dairy') zamiast wartości ('Nabiał')?
- Czy `meal_type` powinno być enum ('breakfast') czy tłumaczone nazwy ('Śniadanie')?

**Obecna decyzja:** Polskie wartości w MVP, refactor do kluczy + translation table w v1.1

**Migration path:**
```sql
-- Post-MVP migration
ALTER TABLE shopping_list_items
  ADD COLUMN category_key VARCHAR(20);

UPDATE shopping_list_items SET category_key =
  CASE category
    WHEN 'Nabiał' THEN 'dairy'
    WHEN 'Warzywa' THEN 'vegetables'
    -- ...
  END;

ALTER TABLE shopping_list_items DROP COLUMN category;
ALTER TABLE shopping_list_items RENAME COLUMN category_key TO category;
```

---

## Następne kroki

### Immediate (przed rozpoczęciem implementacji)
1. ✅ Podsumowanie planowania bazy danych (ten dokument)
2. ⏳ Review podsumowania przez tech lead / senior developer
3. ⏳ Finalizacja edge cases i nierozwiązanych kwestii
4. ⏳ Setup Supabase project (local + staging + production)

### Implementacja (tydzień 1-2)
1. ⏳ Utworzenie initial migration z pełnym schematem
2. ⏳ Implementacja RLS policies + testing
3. ⏳ Utworzenie TypeScript types (Supabase CLI: `supabase gen types`)
4. ⏳ Setup seed data dla development
5. ⏳ Integration tests dla RLS i podstawowych queries

### Validation (tydzień 2)
1. ⏳ Performance testing (query latency, agregacja składników)
2. ⏳ Security testing (RLS bypass attempts, SQL injection)
3. ⏳ Load testing (1000 concurrent users simulation)
4. ⏳ Backup & recovery testing (restore z PITR)

### Production Ready Checklist
- [ ] Schema w production Supabase project
- [ ] RLS policies włączone i przetestowane
- [ ] Monitoring i alerting skonfigurowane
- [ ] Backup strategy zweryfikowana
- [ ] Documentation (ten dokument + API docs) gotowa
- [ ] Team training (jak używać RPC functions, jak testować RLS)

---

**Dokument przygotowany:** 2025-01-23
**Autor:** Claude Code (AI Planning Assistant)
**Review wymagany:** Tech Lead
**Status:** Ready for Implementation ✅
