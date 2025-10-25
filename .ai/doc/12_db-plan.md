# Schemat Bazy Danych - ShopMate MVP

**Data:** 2025-10-23
**Wersja:** 1.0
**Status:** Gotowy do implementacji

---

## 1. Lista tabel z kolumnami, typami danych i ograniczeniami

### Tabela: `recipes`

**Opis:** Przepisy kulinarne użytkowników

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator przepisu |
| `user_id` | UUID | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel przepisu |
| `name` | TEXT | NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100) | Nazwa przepisu |
| `instructions` | TEXT | Instrukcje przygotowania |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data ostatniej modyfikacji |

**Notatki:**
- Brak UNIQUE constraint na `name` - użytkownik może mieć wiele przepisów o tej samej nazwie
- `updated_at` aktualizowany automatycznie przez trigger

---

### Tabela: `ingredients`

**Opis:** Składniki powiązane z przepisami

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator składnika |
| `recipe_id` | UUID | NOT NULL REFERENCES recipes(id) ON DELETE CASCADE | Przepis, do którego należy składnik |
| `name` | VARCHAR(100) | NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100) | Nazwa składnika |
| `quantity` | NUMERIC | CHECK (quantity IS NULL OR quantity > 0) | Ilość (opcjonalna) |
| `unit` | VARCHAR(50) | CHECK (unit IS NULL OR char_length(unit) <= 50) | Jednostka miary (opcjonalna) |
| `sort_order` | INTEGER | NOT NULL DEFAULT 0 CHECK (sort_order >= 0) | Kolejność wyświetlania |

**Notatki:**
- BRAK pola `category` - kategoryzacja następuje tylko podczas generowania listy zakupów
- `quantity` i `unit` opcjonalne dla składników typu "sól do smaku"
- NUMERIC bez precyzji eliminuje floating-point errors przy sumowaniu
- Minimum 1 składnik, maksimum 50 składników na przepis (walidacja w aplikacji - Zod)

---

### Tabela: `meal_plan`

**Opis:** Kalendarz tygodniowy - przypisania przepisów do dni i posiłków

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator przypisania |
| `user_id` | UUID | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel planu |
| `recipe_id` | UUID | NOT NULL REFERENCES recipes(id) ON DELETE CASCADE | Przypisany przepis |
| `week_start_date` | DATE | NOT NULL | Poniedziałek tygodnia (ISO 8601) |
| `day_of_week` | SMALLINT | NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7) | Dzień tygodnia (1=Pon, 7=Niedz) |
| `meal_type` | VARCHAR(20) | NOT NULL CHECK (meal_type IN ('breakfast', 'second_breakfast', 'lunch', 'dinner')) | Typ posiłku |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia przypisania |

**Notatki:**
- UNIQUE constraint na `(user_id, week_start_date, day_of_week, meal_type)` zapobiega duplikatom
- CASCADE DELETE przy usunięciu przepisu (FR-005)
- Brak `updated_at` - przypisania są tylko dodawane/usuwane, nie edytowane
- `week_start_date` przechowuje zawsze poniedziałek, `day_of_week` określa przesunięcie

---

### Tabela: `shopping_lists`

**Opis:** Zapisane listy zakupów (snapshot pattern)

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator listy |
| `user_id` | UUID | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel listy |
| `name` | VARCHAR(200) | NOT NULL DEFAULT 'Lista zakupów' | Nazwa listy |
| `week_start_date` | DATE | NULL | Data początku tygodnia (NULL dla list "Z przepisów") |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data ostatniej modyfikacji |

**Notatki:**
- Snapshot pattern: zapisana lista NIE aktualizuje się przy edycji przepisów
- `week_start_date` NULL jeśli lista wygenerowana "Z przepisów" (FR-016 Tryb 2)
- BRAK relacji z `meal_plan` - lista jest niezależnym snapshot

---

### Tabela: `shopping_list_items`

**Opis:** Składniki w listach zakupów z kategoriami AI

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator pozycji |
| `shopping_list_id` | UUID | NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE | Lista zakupów |
| `ingredient_name` | VARCHAR(100) | NOT NULL CHECK (char_length(ingredient_name) >= 1 AND char_length(ingredient_name) <= 100) | Nazwa składnika |
| `quantity` | NUMERIC | CHECK (quantity IS NULL OR quantity > 0) | Łączna ilość (zagregowana) |
| `unit` | VARCHAR(50) | NULL | Jednostka miary |
| `category` | VARCHAR(20) | NOT NULL DEFAULT 'Inne' CHECK (category IN ('Nabiał', 'Warzywa', 'Owoce', 'Mięso', 'Pieczywo', 'Przyprawy', 'Inne')) | Kategoria AI |
| `is_checked` | BOOLEAN | NOT NULL DEFAULT FALSE | Czy zakupiony |
| `sort_order` | INTEGER | NOT NULL DEFAULT 0 CHECK (sort_order >= 0) | Kolejność w kategorii |

**Notatki:**
- BRAK relacji z `ingredients` - snapshot pattern, kopia danych w momencie generowania
- `category` przypisana przez OpenAI GPT-4o mini lub fallback "Inne"
- `is_checked` dla oznaczania zakupionych pozycji (nie narusza snapshot pattern)
- `ingredient_name` case preserved (oryginalna forma)
- Maksimum 100 pozycji na listę (walidacja w aplikacji - Zod)

---

## 2. Relacje między tabelami

### Diagram relacji

```
auth.users (Supabase Auth)
    ↓ 1:N (ON DELETE CASCADE)
    ├─→ recipes
    │       ↓ 1:N (ON DELETE CASCADE)
    │       └─→ ingredients
    │
    ├─→ meal_plan
    │       ↓ N:1 (ON DELETE CASCADE)
    │       └─→ recipes (same recipe can be assigned multiple times)
    │
    └─→ shopping_lists
            ↓ 1:N (ON DELETE CASCADE)
            └─→ shopping_list_items
```

### Szczegóły relacji

| Relacja | Kardynalność | Typu CASCADE | Opis |
|---------|--------------|--------------|------|
| `auth.users → recipes` | 1:N | ON DELETE CASCADE | Użytkownik ma wiele przepisów. Usunięcie konta = usunięcie wszystkich przepisów (GDPR) |
| `recipes → ingredients` | 1:N | ON DELETE CASCADE | Przepis ma wiele składników. Usunięcie przepisu = usunięcie składników |
| `auth.users → meal_plan` | 1:N | ON DELETE CASCADE | Użytkownik ma wiele przypisań w kalendarzu |
| `recipes → meal_plan` | 1:N | ON DELETE CASCADE | Przepis może być przypisany wiele razy. Usunięcie przepisu = usunięcie przypisań (FR-005) |
| `auth.users → shopping_lists` | 1:N | ON DELETE CASCADE | Użytkownik ma wiele list zakupów |
| `shopping_lists → shopping_list_items` | 1:N | ON DELETE CASCADE | Lista ma wiele pozycji. Usunięcie listy = usunięcie pozycji |

### Brak relacji (snapshot pattern)

- `shopping_lists` NIE ma FK do `meal_plan` - lista jest niezależnym snapshot
- `shopping_list_items` NIE ma FK do `ingredients` - pozycje są kopią w momencie generowania

---

## 3. Indeksy

### Indeksy wydajnościowe

```sql
-- recipes: filtrowanie po user_id
CREATE INDEX idx_recipes_user_id ON recipes(user_id);

-- ingredients: JOIN z recipes
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);

-- meal_plan: główne zapytanie kalendarza (compound index)
CREATE INDEX idx_meal_plan_user_week ON meal_plan(user_id, week_start_date);

-- meal_plan: sprawdzanie przypisań przed usunięciem przepisu
CREATE INDEX idx_meal_plan_recipe_id ON meal_plan(recipe_id);

-- meal_plan: zapobieganie duplikatom (UNIQUE constraint)
CREATE UNIQUE INDEX idx_meal_plan_unique_assignment
  ON meal_plan(user_id, week_start_date, day_of_week, meal_type);

-- shopping_lists: historia list użytkownika
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);

-- shopping_list_items: JOIN z shopping_lists
CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id);

-- shopping_list_items: grupowanie i sortowanie po kategorii (compound index)
CREATE INDEX idx_shopping_list_items_category_sort
  ON shopping_list_items(shopping_list_id, category, sort_order);
```

### Strategie indeksowania

- **Minimalne indeksy dla MVP** - unikanie over-indexing
- Compound index `(user_id, week_start_date)` optymalizuje główne zapytanie kalendarza
- Compound index `(shopping_list_id, category, sort_order)` dla grupowania w eksporcie PDF/TXT
- Monitoring przez Supabase Dashboard dla query performance
- Dodatkowe indeksy tylko jeśli EXPLAIN ANALYZE pokazuje bottleneck

---

## 4. Zasady PostgreSQL (Row Level Security)

### Włączenie RLS na wszystkich tabelach

```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
```

### Polityki RLS dla `recipes`

```sql
-- SELECT: użytkownik widzi tylko własne przepisy
CREATE POLICY recipes_select ON recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: użytkownik może dodać przepis tylko dla siebie
CREATE POLICY recipes_insert ON recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: użytkownik może edytować tylko własne przepisy
CREATE POLICY recipes_update ON recipes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: użytkownik może usuwać tylko własne przepisy
CREATE POLICY recipes_delete ON recipes
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Polityki RLS dla `ingredients`

**Dostęp przez własność `recipes`:**

```sql
-- SELECT: użytkownik widzi składniki tylko swoich przepisów
CREATE POLICY ingredients_select ON ingredients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

-- INSERT: użytkownik może dodać składnik tylko do swoich przepisów
CREATE POLICY ingredients_insert ON ingredients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

-- UPDATE: użytkownik może edytować tylko składniki swoich przepisów
CREATE POLICY ingredients_update ON ingredients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

-- DELETE: użytkownik może usuwać tylko składniki swoich przepisów
CREATE POLICY ingredients_delete ON ingredients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );
```

### Polityki RLS dla `meal_plan`

```sql
-- Unified policy dla wszystkich operacji (SELECT/INSERT/UPDATE/DELETE)
CREATE POLICY meal_plan_all ON meal_plan
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Polityki RLS dla `shopping_lists`

```sql
-- Unified policy dla wszystkich operacji
CREATE POLICY shopping_lists_all ON shopping_lists
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Polityki RLS dla `shopping_list_items`

**Dostęp przez własność `shopping_lists`:**

```sql
-- Unified policy dla wszystkich operacji
CREATE POLICY shopping_list_items_all ON shopping_list_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.shopping_list_id
        AND shopping_lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.shopping_list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );
```

### Testing RLS

**Krytyczne wymaganie bezpieczeństwa (FR-015):**
- Automatyczne testy SQL w migrations (DO $$ block)
- Integration tests (Vitest + Supabase client) z wieloma użytkownikami
- Manual testing checklist przed production deploy
- Penetration testing RLS policies (planned w PRD)

---

## 5. Triggery i funkcje pomocnicze

### Trigger dla automatycznej aktualizacji `updated_at`

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla recipes
CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger dla shopping_lists
CREATE TRIGGER shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### RPC Function dla atomowego generowania listy zakupów

```sql
CREATE OR REPLACE FUNCTION generate_shopping_list(
  p_name VARCHAR,
  p_week_start_date DATE,
  p_items JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_list_id UUID;
  v_user_id UUID;
BEGIN
  -- Pobierz user_id z auth.uid()
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insert shopping_list
  INSERT INTO shopping_lists (user_id, name, week_start_date)
  VALUES (v_user_id, p_name, p_week_start_date)
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
    CASE
      WHEN item->>'quantity' IS NOT NULL
      THEN (item->>'quantity')::NUMERIC
      ELSE NULL
    END,
    item->>'unit',
    COALESCE(item->>'category', 'Inne'),
    COALESCE((item->>'sort_order')::INTEGER, 0)
  FROM jsonb_array_elements(p_items) AS item;

  RETURN v_list_id;
END;
$$;

-- Nadaj uprawnienia do wykonania funkcji zalogowanym użytkownikom
GRANT EXECUTE ON FUNCTION generate_shopping_list(VARCHAR, DATE, JSONB) TO authenticated;
```

**Korzyści:**
- Atomowa transakcja (INSERT shopping_lists + bulk INSERT items)
- SECURITY DEFINER zapewnia kontrolę dostępu
- Walidacja auth.uid() wewnątrz funkcji
- Eliminuje N+1 problem przy tworzeniu wielu pozycji

---

## 6. Dodatkowe uwagi i wyjaśnienia decyzji projektowych

### Architektura i wzorce

**1. Snapshot Pattern dla list zakupów**
- `shopping_lists` i `shopping_list_items` są niezależne od `recipes` i `meal_plan`
- Edycja przepisu NIE aktualizuje zapisanych list zakupów
- Korzyści: prostota, przewidywalność, brak konieczności wersjonowania
- Trade-off: duplikacja danych (akceptowalne dla MVP)

**2. Brak własnej tabeli `users`**
- Wykorzystanie Supabase Auth (`auth.users`) jako single source of truth
- Korzyści: mniej kodu, automatic auth management, GDPR compliance
- Jeśli w przyszłości potrzeba dodatkowych pól użytkownika: tabela `user_profiles` z 1:1 relation

**3. Kategoryzacja tylko w listach zakupów**
- Pole `category` NIE istnieje w `ingredients`
- Kategoryzacja następuje podczas generowania listy przez OpenAI GPT-4o mini
- Ten sam składnik może mieć różne kategorie w różnych listach (edge case)
- Korzyści: prostota schematu, flexibility, brak migracji przy zmianie kategorii

**4. CASCADE DELETE dla GDPR compliance**
- Wszystkie tabele mają `ON DELETE CASCADE` od `auth.users(id)`
- Usunięcie konta użytkownika = automatyczne usunięcie wszystkich danych
- Zgodność z GDPR "right to be forgotten"

### Typy danych i walidacja

**5. TEXT vs VARCHAR dla długich pól**
- `recipes.name`, `recipes.instructions`: TEXT z CHECK constraint na `char_length()`
- PostgreSQL przechowuje TEXT i VARCHAR identycznie (performance brak różnicy)
- CHECK constraint daje taką samą walidację jak VARCHAR(N)
- Zaleta TEXT: łatwiejsze migracje (zmiana limitu = zmiana CHECK, nie ALTER TYPE)

**6. NUMERIC bez precyzji dla `quantity`**
- Eliminuje floating-point errors przy sumowaniu składników
- Unlimited precision = brak overflow
- Trade-off: nieco wolniejsze operacje (marginal dla MVP scale)

**7. VARCHAR z CHECK zamiast PostgreSQL ENUM**
- `meal_type` i `category`: VARCHAR(20) z CHECK IN (...)
- Łatwiejsze migracje: dodanie wartości = ALTER TABLE CHECK, nie ALTER TYPE ENUM
- ENUM wymaga rebuild całej tabeli przy zmianie wartości

**8. TIMESTAMPTZ zamiast TIMESTAMP**
- Automatic UTC conversion, zgodność międzynarodowa
- Best practice dla aplikacji multi-region (future-proofing)

### Wydajność i skalowalność

**9. Compound indexes dla głównych zapytań**
- `idx_meal_plan_user_week` (user_id, week_start_date) - kalendarz tygodnia
- `idx_shopping_list_items_category_sort` - grupowanie w eksporcie
- Minimalizacja liczby indeksów (7 total) dla szybkości zapisu

**10. Connection pooling przez PgBouncer**
- Supabase używa PgBouncer automatycznie
- Eliminuje problem limitu concurrent connections PostgreSQL

**11. RLS overhead dla large scale**
- RLS dodaje 10-30% overhead do queries
- Dla MVP (1k-10k users) = acceptable
- Dla 100k+ users: rozważyć app-level authorization

### Bezpieczeństwo

**12. Defense in depth - wielowarstwowa walidacja**
- Frontend: React forms z live validation
- Application: Zod schemas w API endpoints
- Database: CHECK constraints
- RLS: policy-based authorization

**13. SECURITY DEFINER dla RPC functions**
- `generate_shopping_list()` wykonywana z elevated privileges
- Walidacja `auth.uid()` wewnątrz funkcji zapewnia bezpieczeństwo
- Zapobiega SQL injection (parameterized queries)

### Naming conventions

**14. PostgreSQL best practices**
- Tabele: snake_case, plural (`recipes`, `shopping_lists`)
- Kolumny: snake_case, singular (`user_id`, `created_at`)
- Indeksy: `idx_<table>_<columns>`
- Polityki RLS: `<table>_<action>`

### Out of scope (post-MVP)

**15. Nie implementowane w MVP:**
- Soft deletes (używamy hard deletes dla prostoty i GDPR)
- Audit log / history table
- Automatic backup logic (Supabase Pro PITR wystarczający)
- Unit conversion (różne jednostki = osobne pozycje na liście)
- Recipe sharing (każdy user ma własne przepisy)
- Template recipes (pre-loaded content)

### Migration strategy

**16. Przygotowanie na przyszłe zmiany:**
- Internacjonalizacja: `category` jako klucze ('dairy') zamiast wartości ('Nabiał') w v1.1
- Multi-currency: dodanie `price` i `currency` w `shopping_list_items` (post-MVP)
- Recipe images: dodanie `image_url` w `recipes` + Supabase Storage (post-MVP)
- Realtime collaboration: Supabase Realtime subscriptions (post-MVP)

---

## Production Readiness Checklist

### Must Have przed deploymentem

- [ ] Wszystkie tabele utworzone z poprawnymi typami i constraints
- [ ] RLS włączone na wszystkich tabelach aplikacyjnych
- [ ] Polityki RLS przetestowane (unit + integration tests)
- [ ] Indeksy utworzone i zweryfikowane (EXPLAIN ANALYZE)
- [ ] Triggery dla `updated_at` działają poprawnie
- [ ] RPC function `generate_shopping_list()` przetestowana
- [ ] Migracje są idempotent (IF NOT EXISTS)
- [ ] Seed data dla development environment
- [ ] TypeScript types wygenerowane (`supabase gen types`)
- [ ] Dokumentacja schema dostępna dla team

### Should Have (przed production launch)

- [ ] Performance testing (query latency <100ms p95)
- [ ] Load testing (1000 concurrent users simulation)
- [ ] Security audit RLS policies (penetration testing)
- [ ] Backup & recovery testing (PITR restore)
- [ ] Monitoring i alerting skonfigurowane (Sentry + Supabase Dashboard)
- [ ] GDPR compliance verification (CASCADE DELETE działa)

### Nice to Have (continuous improvement)

- [ ] Automatic migration testing w CI/CD
- [ ] Query performance monitoring (slow query log)
- [ ] Database size monitoring (alert at 80% quota)
- [ ] Index usage analysis (identify unused indexes)
- [ ] Periodic VACUUM ANALYZE (Supabase automatic, verify)

---

## Przykładowe zapytania

### Pobierz wszystkie przepisy użytkownika

```sql
SELECT id, name, instructions, created_at, updated_at
FROM recipes
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Pobierz przepis ze składnikami

```sql
SELECT
  r.id, r.name, r.instructions,
  i.id AS ingredient_id, i.name AS ingredient_name,
  i.quantity, i.unit, i.sort_order
FROM recipes r
LEFT JOIN ingredients i ON r.id = i.recipe_id
WHERE r.id = $1 AND r.user_id = auth.uid()
ORDER BY i.sort_order;
```

### Pobierz kalendarz tygodnia

```sql
SELECT
  mp.day_of_week, mp.meal_type,
  r.id AS recipe_id, r.name AS recipe_name
FROM meal_plan mp
JOIN recipes r ON mp.recipe_id = r.id
WHERE mp.user_id = auth.uid()
  AND mp.week_start_date = $1
ORDER BY mp.day_of_week,
  CASE mp.meal_type
    WHEN 'breakfast' THEN 1
    WHEN 'second_breakfast' THEN 2
    WHEN 'lunch' THEN 3
    WHEN 'dinner' THEN 4
  END;
```

### Pobierz listę zakupów z pozycjami zgrupowanymi po kategorii

```sql
SELECT
  sl.id, sl.name, sl.week_start_date, sl.created_at,
  sli.category, sli.ingredient_name, sli.quantity,
  sli.unit, sli.is_checked, sli.sort_order
FROM shopping_lists sl
JOIN shopping_list_items sli ON sl.id = sli.shopping_list_id
WHERE sl.id = $1 AND sl.user_id = auth.uid()
ORDER BY
  CASE sli.category
    WHEN 'Nabiał' THEN 1
    WHEN 'Warzywa' THEN 2
    WHEN 'Owoce' THEN 3
    WHEN 'Mięso' THEN 4
    WHEN 'Pieczywo' THEN 5
    WHEN 'Przyprawy' THEN 6
    WHEN 'Inne' THEN 7
  END,
  sli.sort_order;
```

### Sprawdź czy przepis jest przypisany w kalendarzu

```sql
SELECT EXISTS (
  SELECT 1
  FROM meal_plan
  WHERE recipe_id = $1 AND user_id = auth.uid()
) AS is_assigned;
```

---

## Kolejne kroki implementacji

1. **Utworzenie initial migration** - pełny schemat w `supabase/migrations/`
2. **Testing RLS policies** - unit tests + manual security testing
3. **Generowanie TypeScript types** - `supabase gen types typescript`
4. **Seed data setup** - `supabase/seed.sql` dla local development
5. **Integration tests** - Vitest + Supabase client testing CRUD operations
6. **Performance baseline** - EXPLAIN ANALYZE dla głównych zapytań
7. **Documentation** - API docs dla team + onboarding guide

---

**Schemat przygotowany:** 2025-10-23
**Autor:** Claude Code (Database Architect)
**Status:** ✅ Ready for Implementation
**Wymaga review:** Tech Lead + Security Audit przed production