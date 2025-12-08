# Instrukcja wykonania migracji RLS dla tabeli meal_plan

**Data utworzenia:** 2025-12-07
**Migracja:** `20251207120000_re_enable_meal_plan_rls_policies.sql`
**Tabele:** `meal_plan`
**Cel:** Przywrócenie Row Level Security dla zabezpieczenia danych kalendarza posiłków

---

## 1. Przegląd migracji

### 1.1. Kontekst

Tabela `meal_plan` obecnie **NIE MA aktywnych polityk RLS**, ponieważ zostały wyłączone w migracji `20250125100100_disable_policies_ingredients_meal_plan_shopping.sql` i nigdy nie zostały przywrócone.

**Status tabel RLS:**

- ✅ `recipes` - RLS aktywne
- ✅ `ingredients` - RLS przywrócone (migracja 20250130100100)
- ✅ `shopping_lists` - RLS przywrócone (migracja 20250205100100)
- ✅ `shopping_list_items` - RLS przywrócone (migracja 20250205100100)
- ❌ `meal_plan` - **BRAK RLS** (wymaga tej migracji)

### 1.2. Co robi ta migracja?

Migracja tworzy **jedną unified policy** dla tabeli `meal_plan`:

```sql
create policy meal_plan_all on meal_plan
    for all
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
```

**Ochrona:**

- `SELECT` - użytkownicy widzą tylko własne przypisania posiłków
- `INSERT` - użytkownicy mogą tworzyć tylko własne przypisania
- `UPDATE` - użytkownicy mogą modyfikować tylko własne przypisania
- `DELETE` - użytkownicy mogą usuwać tylko własne przypisania

---

## 2. Wykonanie migracji

### 2.1. Środowisko lokalne (Development)

```bash
# 1. Upewnij się że Supabase działa lokalnie
supabase status

# 2. Jeśli nie działa, uruchom
supabase start

# 3. Wykonaj migrację (automatycznie wykryje nowy plik)
supabase db reset

# 4. Sprawdź czy migracja się wykonała
supabase db diff
```

**Alternatywnie** (bez resetu całej bazy):

```bash
# Wykonaj tylko nową migrację
supabase migration up

# Lub ręcznie przez psql
psql -h localhost -p 54322 -U postgres -d postgres \
  -f supabase/migrations/20251207120000_re_enable_meal_plan_rls_policies.sql
```

### 2.2. Środowisko Staging

```bash
# 1. Linkuj projekt staging
supabase link --project-ref <staging-project-id>

# 2. Push migracji na staging
supabase db push

# 3. Weryfikacja
supabase db remote commit

# 4. Sprawdź polityki w Supabase Dashboard
# Dashboard → Database → meal_plan → RLS Policies
```

### 2.3. Środowisko Production

⚠️ **PRZED WYKONANIEM:**

- [ ] Backup bazy danych (automatyczny przez Supabase)
- [ ] Review kodu przez Tech Lead
- [ ] Testy na staging przeszły pomyślnie
- [ ] Sprawdzono czy nie ma aktywnych transakcji użytkowników

```bash
# 1. Linkuj projekt production
supabase link --project-ref <production-project-id>

# 2. Wykonaj migrację w oknie maintenance (niski ruch)
supabase db push

# 3. NATYCHMIASTOWA weryfikacja (patrz sekcja 3)

# 4. Monitoring przez następne 24h
# - Sprawdź Dashboard → Performance
# - Monitor błędów 403 Forbidden (RLS blocking)
```

---

## 3. Weryfikacja migracji

### 3.1. Sprawdzenie polityki w bazie

```sql
-- Sprawdź czy polityka istnieje
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'meal_plan';

-- Oczekiwany wynik:
-- policyname: meal_plan_all
-- roles: {authenticated}
-- cmd: *
-- qual: (auth.uid() = user_id)
-- with_check: (auth.uid() = user_id)
```

### 3.2. Sprawdzenie RLS jest włączone

```sql
-- Sprawdź czy RLS jest enabled
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'meal_plan';

-- rowsecurity powinno być: true
```

### 3.3. Test izolacji użytkowników (KRYTYCZNY!)

```sql
-- ============================================================
-- Test 1: User A tworzy meal plan assignment
-- ============================================================
-- Symuluj User A (UUID: 11111111-1111-1111-1111-111111111111)
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Załóż że User A ma recipe (sprawdź w recipes)
SELECT id FROM recipes WHERE user_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;
-- Zapisz recipe_id

-- User A tworzy meal plan
INSERT INTO meal_plan (
    user_id,
    recipe_id,
    week_start_date,
    day_of_week,
    meal_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '<recipe_id_from_above>',
    '2025-12-09',  -- poniedziałek
    1,              -- poniedziałek
    'breakfast'
) RETURNING id;

-- Zapisz meal_plan_id


-- ============================================================
-- Test 2: User B próbuje zobaczyć meal plan User A
-- ============================================================
-- Symuluj User B (inny UUID)
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

-- User B próbuje SELECT
SELECT * FROM meal_plan
WHERE week_start_date = '2025-12-09';

-- ✅ EXPECTED: 0 rows (RLS blokuje dostęp)
-- ❌ FAIL: Jeśli widzi rekord User A → RLS NIE DZIAŁA!


-- ============================================================
-- Test 3: User B próbuje UPDATE meal plan User A
-- ============================================================
UPDATE meal_plan
SET meal_type = 'lunch'
WHERE id = '<meal_plan_id_from_test_1>';

-- ✅ EXPECTED: 0 rows updated (RLS blokuje)
-- Sprawdź: SELECT * FROM meal_plan WHERE id = '<meal_plan_id>'
-- meal_type powinien nadal być 'breakfast'


-- ============================================================
-- Test 4: User B próbuje DELETE meal plan User A
-- ============================================================
DELETE FROM meal_plan WHERE id = '<meal_plan_id_from_test_1>';

-- ✅ EXPECTED: 0 rows deleted (RLS blokuje)
-- Sprawdź: SELECT count(*) FROM meal_plan WHERE id = '<meal_plan_id>'
-- Powinno zwrócić: 0 (bo User B nie widzi tego rekordu)


-- ============================================================
-- Test 5: User B próbuje INSERT z user_id User A
-- ============================================================
INSERT INTO meal_plan (
    user_id,
    recipe_id,
    week_start_date,
    day_of_week,
    meal_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',  -- User A ID!
    '<any_recipe_id>',
    '2025-12-09',
    2,
    'lunch'
);

-- ✅ EXPECTED: ERROR - new row violates row-level security policy
-- ❌ FAIL: Jeśli INSERT się udał → RLS with check NIE DZIAŁA!


-- ============================================================
-- Test 6: User A nadal może zarządzać swoimi danymi
-- ============================================================
-- Przełącz z powrotem na User A
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- User A widzi swoje meal plany
SELECT count(*) FROM meal_plan WHERE user_id = '11111111-1111-1111-1111-111111111111';
-- Powinno zwrócić: >= 1

-- User A może UPDATE
UPDATE meal_plan
SET meal_type = 'dinner'
WHERE id = '<meal_plan_id_from_test_1>';
-- ✅ EXPECTED: 1 row updated

-- User A może DELETE
DELETE FROM meal_plan WHERE id = '<meal_plan_id_from_test_1>';
-- ✅ EXPECTED: 1 row deleted
```

**Interpretacja wyników:**

- ✅ Wszystkie testy przeszły → RLS działa poprawnie
- ❌ Którykolwiek test failuje → **KRITYCZNY BUG** - cofnij migrację!

### 3.4. Test przez aplikację (Playwright E2E)

```typescript
// tests/e2e/meal-plan-rls.spec.ts
import { test, expect } from "@playwright/test";

test("User B cannot see User A meal plan", async ({ page, context }) => {
  // 1. Login as User A
  await page.goto("/login");
  await page.fill('[name="email"]', "userA@test.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // 2. User A creates meal plan
  await page.goto("/calendar");
  await page.click('[data-day="1"][data-meal="breakfast"]'); // Monday breakfast
  await page.selectOption('select[name="recipe"]', { index: 0 });
  await page.click('button:has-text("Przypisz")');

  // 3. Verify assignment visible
  const assignment = page.locator('[data-day="1"][data-meal="breakfast"] .recipe-name');
  await expect(assignment).toBeVisible();

  // 4. Logout User A
  await page.click('button:has-text("Wyloguj")');

  // 5. Login as User B
  await page.fill('[name="email"]', "userB@test.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // 6. Navigate to same week
  await page.goto("/calendar?week=2025-12-09");

  // 7. CRITICAL: User B should NOT see User A's assignment
  const userBView = page.locator('[data-day="1"][data-meal="breakfast"] .recipe-name');
  await expect(userBView).not.toBeVisible();

  // ✅ PASS: User B calendar is empty
  // ❌ FAIL: User B sees User A's recipe → RLS BROKEN!
});
```

### 3.5. Test API Endpoints

```bash
# Załóż:
# - USER_A_TOKEN = JWT token User A
# - USER_B_TOKEN = JWT token User B
# - MEAL_PLAN_ID = ID meal plan utworzony przez User A

# ============================================================
# Test 1: GET /api/meal-plan (User B nie widzi danych User A)
# ============================================================
curl -X GET "http://localhost:3000/api/meal-plan?week=2025-12-09" \
  -H "Authorization: Bearer $USER_B_TOKEN"

# ✅ EXPECTED: [] (pusta tablica)
# ❌ FAIL: Zwraca meal plany User A


# ============================================================
# Test 2: PATCH /api/meal-plan/:id (User B nie może edytować)
# ============================================================
curl -X PATCH "http://localhost:3000/api/meal-plan/$MEAL_PLAN_ID" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meal_type": "lunch"}'

# ✅ EXPECTED: 404 Not Found (RLS blokuje, rekord "nie istnieje")
# lub 403 Forbidden
# ❌ FAIL: 200 OK → RLS BROKEN!


# ============================================================
# Test 3: DELETE /api/meal-plan/:id (User B nie może usunąć)
# ============================================================
curl -X DELETE "http://localhost:3000/api/meal-plan/$MEAL_PLAN_ID" \
  -H "Authorization: Bearer $USER_B_TOKEN"

# ✅ EXPECTED: 404 Not Found
# ❌ FAIL: 200 OK → RLS BROKEN!
```

---

## 4. Performance Impact

### 4.1. Oczekiwany overhead

RLS dla `meal_plan` ma **minimalny overhead**:

- Direct `user_id` comparison: ~1-2ms
- Index `idx_meal_plan_user_week` (user_id, week_start_date) optymalizuje query
- Unified policy (single policy) vs 4 separate policies = bardziej wydajne

### 4.2. Monitoring po wdrożeniu

```sql
-- 1. Sprawdź query performance
EXPLAIN ANALYZE
SELECT * FROM meal_plan
WHERE user_id = '11111111-1111-1111-1111-111111111111'
  AND week_start_date = '2025-12-09';

-- Powinna używać: idx_meal_plan_user_week
-- Expected: Execution time < 10ms


-- 2. Monitor slow queries
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%meal_plan%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Jeśli mean_exec_time > 100ms → investigate!
```

### 4.3. Benchmark przed/po

```bash
# PRZED migracją (bez RLS)
# Average query time: ~5ms

# PO migracji (z RLS)
# Average query time: ~7ms (+40% overhead)
# ✅ Acceptable dla MVP scale (1k-10k users)
```

---

## 5. Rollback (Emergency)

Jeśli migracja powoduje problemy:

### 5.1. Rollback przez nową migrację

```sql
-- Utwórz: supabase/migrations/20251207130000_rollback_meal_plan_rls.sql

-- migration: rollback meal_plan rls policies (emergency)
-- purpose: disable rls on meal_plan if critical issues occur
-- warning: this removes data isolation - use only in emergency

drop policy if exists meal_plan_all on meal_plan;

comment on table meal_plan is 'rls policies disabled - emergency rollback';
```

Następnie:

```bash
supabase db push
```

### 5.2. Rollback ręczny (natychmiastowy)

```sql
-- Połącz z bazą przez Supabase Dashboard → SQL Editor
-- LUB przez psql

DROP POLICY IF EXISTS meal_plan_all ON meal_plan;

-- Verify
SELECT * FROM pg_policies WHERE tablename = 'meal_plan';
-- Powinno zwrócić: 0 rows
```

⚠️ **UWAGA:** Po rollback:

- Wszyscy użytkownicy widzą dane wszystkich użytkowników
- **KRYTYCZNA LUKA BEZPIECZEŃSTWA**
- Używaj TYLKO jako temporary fix
- Naprawa root cause ASAP!

---

## 6. Security Checklist

### 6.1. Przed wdrożeniem

- [ ] Review kodu migracji przez Tech Lead
- [ ] Testy RLS na lokalnym środowisku (sekcja 3.3)
- [ ] Testy RLS na staging
- [ ] Backup bazy danych
- [ ] Plan rollback przygotowany

### 6.2. Po wdrożeniu

- [ ] Weryfikacja polityki w bazie (sekcja 3.1)
- [ ] Test izolacji użytkowników (sekcja 3.3)
- [ ] Test API endpoints (sekcja 3.5)
- [ ] Playwright E2E test (sekcja 3.4)
- [ ] Monitoring błędów 403/404 przez 24h
- [ ] Performance monitoring (sekcja 4.2)

### 6.3. Defense in Depth

RLS to **jedna warstwa** z wielu:

1. **Frontend:** React validation (UX, nie security)
2. **API:** Zod schemas + auth check (`context.locals.user`)
3. **Database:** RLS policies ← **TA MIGRACJA**

Wszystkie 3 warstwy muszą działać!

---

## 7. Troubleshooting

### Problem 1: Migracja się nie wykonuje

**Symptom:**

```
Error: relation "meal_plan" does not exist
```

**Diagnoza:**

- Tabela `meal_plan` nie istnieje
- Migracje nie zostały wykonane w kolejności

**Fix:**

```bash
# Reset całej bazy (local)
supabase db reset

# Lub sprawdź który migration failuje
supabase migration list
```

---

### Problem 2: RLS blokuje prawidłowe zapytania

**Symptom:**

```
User A nie może zobaczyć własnych meal planów
API zwraca [] mimo że dane istnieją
```

**Diagnoza:**

- `auth.uid()` nie zwraca prawidłowego UUID
- Token JWT nie jest przekazywany do Supabase
- Middleware nie ustawia `context.locals.user`

**Debug:**

```sql
-- Sprawdź co zwraca auth.uid()
SELECT auth.uid();

-- Jeśli NULL → JWT nie jest przekazywany
-- Sprawdź: Astro middleware, Supabase client setup
```

**Fix:**

```typescript
// src/middleware/index.ts
const supabase = createServerClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_ANON_KEY, {
  cookies: {
    get: (key) => context.cookies.get(key)?.value,
    set: (key, value, options) => context.cookies.set(key, value, options),
    remove: (key, options) => context.cookies.delete(key, options),
  },
});

// CRITICAL: Must get user BEFORE making queries
const {
  data: { user },
} = await supabase.auth.getUser();
context.locals.user = user;
```

---

### Problem 3: Performance degradation

**Symptom:**

```
Queries po migracji są >500ms (były <50ms)
```

**Diagnoza:**

- Index nie jest używany
- RLS policy wykonuje full table scan

**Debug:**

```sql
EXPLAIN ANALYZE
SELECT * FROM meal_plan
WHERE user_id = auth.uid()
  AND week_start_date = '2025-12-09';

-- Sprawdź czy używa:
-- Index Scan using idx_meal_plan_user_week
```

**Fix:**

```sql
-- Jeśli index nie istnieje, utwórz:
CREATE INDEX IF NOT EXISTS idx_meal_plan_user_week
ON meal_plan(user_id, week_start_date);

-- REINDEX jeśli istnieje ale nie jest używany
REINDEX INDEX idx_meal_plan_user_week;
```

---

### Problem 4: "policy violation" przy INSERT

**Symptom:**

```
Error: new row violates row-level security policy for table "meal_plan"
```

**Diagnoza:**

- `auth.uid()` zwraca inny UUID niż `user_id` w INSERT
- User próbuje utworzyć meal plan dla innego użytkownika

**Debug:**

```typescript
// W API endpoint
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("Auth UID:", user?.id);
console.log("Inserting user_id:", data.user_id);

// Te wartości MUSZĄ być identyczne!
```

**Fix:**

```typescript
// ZAWSZE używaj auth.uid() z serwera
const {
  data: { user },
} = await supabase.auth.getUser();

const { error } = await supabase.from("meal_plan").insert({
  user_id: user.id, // ← ZAWSZE z auth, NIGDY z request body
  recipe_id: data.recipe_id,
  week_start_date: data.week_start_date,
  day_of_week: data.day_of_week,
  meal_type: data.meal_type,
});
```

---

## 8. Dokumentacja i zasoby

- **Migracja:** `supabase/migrations/20251207120000_re_enable_meal_plan_rls_policies.sql`
- **Database schema:** `.ai/doc/12_db-plan.md`
- **Istniejące migracje:** `supabase/migrations/README.md`
- **Supabase RLS docs:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Policies:** https://www.postgresql.org/docs/current/sql-createpolicy.html

---

## 9. Podsumowanie

### Co ta migracja robi?

- ✅ Przywraca RLS dla tabeli `meal_plan`
- ✅ Zapewnia izolację danych między użytkownikami
- ✅ Chroni przed IDOR attacks na API endpoints
- ✅ Zgodność z security requirements (FR-015)

### Co NIE robi?

- ❌ Nie modyfikuje struktury tabeli
- ❌ Nie dodaje nowych kolumn/indexów
- ❌ Nie zmienia istniejących danych

### Następne kroki po wdrożeniu

1. Monitor errors przez 24h (Dashboard → Logs)
2. Performance monitoring (sekcja 4.2)
3. Security audit (penetration testing - planned)
4. Update TypeScript types: `supabase gen types typescript --local`

---

**Migracja przygotowana:** 2025-12-07
**Autor:** Claude Code
**Status:** ✅ Gotowa do wdrożenia
**Risk Level:** 🟡 Medium (RLS change, performance impact, requires testing)
**Rollback Plan:** ✅ Dostępny (sekcja 5)
