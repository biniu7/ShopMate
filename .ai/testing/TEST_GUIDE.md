# Test Guide: Shopping List Preview API

## Przegląd

Ten przewodnik opisuje jak przetestować endpoint `POST /api/shopping-lists/preview`.

**Endpoint**: `POST /api/shopping-lists/preview`
**Port**: http://localhost:3001 (lub 3000 jeśli wolny)
**Autentykacja**: Wymagana (Bearer token z Supabase)

---

## Przygotowanie do testów

### 1. Uruchom serwer deweloperski

```bash
npm run dev
```

Sprawdź w konsoli:
```
✓ Local    http://localhost:3001/
```

### 2. Dodaj OPENAI_API_KEY do .env

```bash
# .env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

**Gdzie wziąć klucz**: https://platform.openai.com/api-keys

### 3. Pobierz token autoryzacji

**Metoda 1: Przez Supabase Dashboard**
1. Idź do Supabase Dashboard → Authentication → Users
2. Skopiuj JWT token zalogowanego użytkownika

**Metoda 2: Przez browser DevTools**
1. Zaloguj się w aplikacji
2. Otwórz DevTools → Application → Storage → Local Storage
3. Znajdź klucz `supabase.auth.token` lub podobny
4. Skopiuj `access_token`

**Metoda 3: Przez Supabase CLI**
```bash
supabase auth login --email user@example.com --password password123
```

### 4. Znajdź recipe UUIDs

**SQL query w Supabase Dashboard**:
```sql
SELECT id, name FROM recipes WHERE user_id = 'your_user_id' LIMIT 5;
```

Lub przez API:
```bash
curl http://localhost:3001/api/recipes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Opcja 1: Testowanie z Bruno

### Instalacja Bruno
```bash
# Windows
winget install Bruno.Bruno

# Mac
brew install bruno

# Linux
snap install bruno
```

### Import Collection
1. Otwórz Bruno
2. Import Collection → Select Folder
3. Wybierz: `.ai/testing/bruno-collection/`
4. Skonfiguruj zmienne środowiskowe:
   - `authToken`: Twój JWT token
   - `recipe_id_1`: UUID pierwszego przepisu
   - `recipe_id_2`: UUID drugiego przepisu
   - `baseUrl`: `http://localhost:3001`

### Uruchom testy
1. **shopping-lists-preview.bru** - Recipes Mode (happy path)
2. **shopping-lists-preview-calendar.bru** - Calendar Mode (happy path)
3. **shopping-lists-preview-errors.bru** - Error cases

---

## Opcja 2: Testowanie z Postman

### Import Collection
1. Otwórz Postman
2. Import → File → Select Files
3. Wybierz wszystkie pliki `.bru` z `.ai/testing/bruno-collection/`
4. Postman automatycznie skonwertuje format Bruno

### Konfiguracja Environment
Utwórz environment `ShopMate Local`:
```json
{
  "baseUrl": "http://localhost:3001",
  "authToken": "YOUR_JWT_TOKEN_HERE",
  "recipe_id_1": "UUID_HERE",
  "recipe_id_2": "UUID_HERE"
}
```

---

## Opcja 3: Testowanie z curl

### Szybki test (manual)

```bash
# Zastąp zmienne swoimi wartościami
curl -X POST http://localhost:3001/api/shopping-lists/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "source": "recipes",
    "recipe_ids": ["YOUR_RECIPE_UUID"]
  }' \
  | jq .
```

### Automatyczne testy (script)

```bash
# Edytuj zmienne w pliku
nano .ai/testing/curl-examples.sh

# Ustaw zmienne:
AUTH_TOKEN="your_token"
RECIPE_ID_1="your_uuid_1"
RECIPE_ID_2="your_uuid_2"

# Uruchom wszystkie testy
chmod +x .ai/testing/curl-examples.sh
./.ai/testing/curl-examples.sh
```

---

## Scenariusze testowe

### ✅ Test 1: Recipes Mode - Happy Path

**Request**:
```json
POST /api/shopping-lists/preview
{
  "source": "recipes",
  "recipe_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

**Oczekiwana odpowiedź (200 OK)**:
```json
{
  "items": [
    {
      "ingredient_name": "jajka",
      "quantity": 12,
      "unit": "szt",
      "category": "Nabiał",
      "sort_order": 0
    },
    {
      "ingredient_name": "mąka",
      "quantity": 500,
      "unit": "g",
      "category": "Pieczywo",
      "sort_order": 0
    }
  ],
  "metadata": {
    "source": "recipes",
    "total_recipes": 2,
    "total_items": 10,
    "ai_categorization_status": "success"
  }
}
```

**Sprawdź**:
- ✅ Status code: 200
- ✅ Items są posortowane według kategorii (Nabiał → Warzywa → Owoce → Mięso → Pieczywo → Przyprawy → Inne)
- ✅ Alfabetycznie w ramach kategorii
- ✅ `sort_order` zaczyna się od 0 w każdej kategorii
- ✅ `ai_categorization_status` = "success"

---

### ✅ Test 2: Calendar Mode - Happy Path

**Request**:
```json
POST /api/shopping-lists/preview
{
  "source": "calendar",
  "week_start_date": "2025-11-04",
  "selections": [
    {
      "day_of_week": 1,
      "meal_types": ["breakfast", "lunch"]
    },
    {
      "day_of_week": 2,
      "meal_types": ["dinner"]
    }
  ]
}
```

**Oczekiwana odpowiedź (200 OK)**:
```json
{
  "items": [...],
  "metadata": {
    "source": "calendar",
    "week_start_date": "2025-11-04",
    "total_recipes": 3,
    "total_items": 23,
    "ai_categorization_status": "success",
    "skipped_empty_meals": 0
  }
}
```

**Sprawdź**:
- ✅ Status code: 200
- ✅ `week_start_date` obecne w metadata
- ✅ `skipped_empty_meals` pokazuje ile posiłków nie miało przypisanych przepisów
- ✅ Items zagregowane (np. jeśli "jajka" pojawiają się w wielu przepisach, quantity jest zsumowane)

---

### ❌ Test 3: Error - Unauthorized (401)

**Request** (BEZ Authorization header):
```json
POST /api/shopping-lists/preview
{
  "source": "recipes",
  "recipe_ids": ["550e8400-e29b-41d4-a716-446655440000"]
}
```

**Oczekiwana odpowiedź (401)**:
```json
{
  "error": "Unauthorized"
}
```

---

### ❌ Test 4: Error - Validation Failed (400)

**Request** (pusta tablica recipe_ids):
```json
POST /api/shopping-lists/preview
{
  "source": "recipes",
  "recipe_ids": []
}
```

**Oczekiwana odpowiedź (400)**:
```json
{
  "error": "Validation failed",
  "details": {
    "recipe_ids": ["Array must contain at least 1 element"]
  }
}
```

---

### ❌ Test 5: Error - Invalid UUID (400)

**Request**:
```json
POST /api/shopping-lists/preview
{
  "source": "recipes",
  "recipe_ids": ["not-a-valid-uuid"]
}
```

**Oczekiwana odpowiedź (400)**:
```json
{
  "error": "Validation failed",
  "details": {
    "recipe_ids": ["Invalid recipe ID format. Expected UUID"]
  }
}
```

---

### ❌ Test 6: Error - Not Monday (400)

**Request** (2025-11-05 to wtorek):
```json
POST /api/shopping-lists/preview
{
  "source": "calendar",
  "week_start_date": "2025-11-05",
  "selections": [
    {"day_of_week": 1, "meal_types": ["breakfast"]}
  ]
}
```

**Oczekiwana odpowiedź (400)**:
```json
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Week start date must be a Monday"]
  }
}
```

---

### ❌ Test 7: Error - No Recipes Found (400)

**Request** (UUID nie należy do użytkownika lub nie istnieje):
```json
POST /api/shopping-lists/preview
{
  "source": "recipes",
  "recipe_ids": ["550e8400-0000-0000-0000-000000000000"]
}
```

**Oczekiwana odpowiedź (400)**:
```json
{
  "error": "No recipes selected or all selected meals are empty"
}
```

---

### ⚠️ Test 8: Partial Success - AI Failed

**Symulacja**: Nieprawidłowy OPENAI_API_KEY lub timeout

**Oczekiwana odpowiedź (200 OK)**:
```json
{
  "items": [
    {
      "ingredient_name": "jajka",
      "quantity": 12,
      "unit": "szt",
      "category": "Inne",
      "sort_order": 0
    }
  ],
  "metadata": {
    "source": "recipes",
    "total_recipes": 2,
    "total_items": 10,
    "ai_categorization_status": "failed",
    "ai_error": "OpenAI timeout after 2 retries"
  }
}
```

**Sprawdź**:
- ✅ Status code: 200 (NIE 422 lub 500!)
- ✅ Wszystkie items mają `category: "Inne"`
- ✅ `ai_categorization_status: "failed"`
- ✅ `ai_error` zawiera opis błędu

---

## Checklist testów

### Podstawowe testy
- [ ] Server uruchomiony bez błędów
- [ ] OPENAI_API_KEY skonfigurowany w .env
- [ ] Token autoryzacji działa (401 bez tokena)
- [ ] Happy path - Recipes mode (200 OK)
- [ ] Happy path - Calendar mode (200 OK)

### Walidacja
- [ ] Empty recipe_ids → 400
- [ ] Invalid UUID → 400
- [ ] Invalid date format → 400
- [ ] Not Monday → 400
- [ ] Invalid source value → 400
- [ ] Invalid meal_type → 400
- [ ] day_of_week < 1 lub > 7 → 400

### Business Logic
- [ ] Agregacja ingredients (same name+unit → sumowanie quantity)
- [ ] Agregacja null quantities (mixed → null)
- [ ] Sortowanie według kategorii
- [ ] Sortowanie alfabetyczne w kategorii
- [ ] sort_order poprawnie przypisane
- [ ] RLS protection (cudzę recipe_ids → 400 No recipes found)
- [ ] Empty meals skipped (skipped_empty_meals counter)

### AI Integration
- [ ] AI success → kategorie poprawne
- [ ] AI failed → wszystkie "Inne", status "failed"
- [ ] Console logs pokazują retry attempts

### Performance
- [ ] Response time < 3s (p50)
- [ ] Response time < 8s (p95, z AI retries)
- [ ] Brak memory leaks (powtórz test 10x)

---

## Rozwiązywanie problemów

### Problem: "OPENAI_API_KEY environment variable is not set"

**Rozwiązanie**:
1. Sprawdź czy `.env` istnieje w root projektu
2. Sprawdź czy `OPENAI_API_KEY=sk-...` jest w pliku
3. Restart servera (`npm run dev`)

### Problem: "Unauthorized" mimo poprawnego tokena

**Rozwiązanie**:
1. Sprawdź czy token jest aktualny (Supabase JWT ma expiration)
2. Sprawdź format: `Authorization: Bearer YOUR_TOKEN` (ze spacją!)
3. Zweryfikuj token na https://jwt.io (powinna być sekcja `sub` z user_id)

### Problem: "No recipes found" mimo istniejących przepisów

**Rozwiązanie**:
1. Sprawdź czy recipe należy do zalogowanego użytkownika (RLS filtruje)
2. Sprawdź czy recipe ma ingredients (bez ingredients → pusta lista)
3. Verify user_id w token vs user_id w recipes table

### Problem: AI zawsze zwraca "Inne"

**Możliwe przyczyny**:
1. Nieprawidłowy OPENAI_API_KEY
2. Brak środków na koncie OpenAI
3. Rate limit exceeded (sprawdź https://platform.openai.com/usage)
4. Network issue (firewall, proxy)

**Debug**:
- Sprawdź console logs: `[AI Categorization] Attempt 1/3...`
- Jeśli widzisz error, sprawdź OpenAI dashboard

### Problem: Response time > 10s

**Możliwe przyczyny**:
1. Duża liczba ingredients (>50) → AI call zajmuje więcej czasu
2. AI timeout + retries (10s × 3 = 30s worst case)
3. Wolne zapytania do bazy (missing indexes)

**Rozwiązanie**:
- Sprawdź logi czasów
- Rozważ cache dla common ingredients (post-MVP)

---

## Przykładowe dane testowe

### Utworzenie testowego przepisu

```sql
-- W Supabase SQL Editor
INSERT INTO recipes (id, user_id, name, instructions)
VALUES (
  gen_random_uuid(),
  'your_user_id',
  'Jajecznica',
  'Usmaż jajka na maśle'
);

-- Pobierz ID przepisu
SELECT id FROM recipes WHERE name = 'Jajecznica';

-- Dodaj składniki
INSERT INTO ingredients (recipe_id, name, quantity, unit, sort_order)
VALUES
  ('recipe_id_here', 'jajka', 4, 'szt', 0),
  ('recipe_id_here', 'masło', 20, 'g', 1),
  ('recipe_id_here', 'sól', NULL, NULL, 2);
```

### Utworzenie testowego meal plan

```sql
INSERT INTO meal_plan (user_id, recipe_id, week_start_date, day_of_week, meal_type)
VALUES
  ('your_user_id', 'recipe_id_here', '2025-11-04', 1, 'breakfast'),
  ('your_user_id', 'recipe_id_here', '2025-11-04', 1, 'lunch');
```

---

## Monitoring

### Console Logs (Development)

Prawidłowe logi:
```
[POST /api/shopping-lists/preview] User abc123 requesting preview
[Shopping List Preview] Generating preview for source: recipes
[Shopping List Preview] Fetched 50 ingredients from 2 recipes
[Shopping List Preview] Aggregated 50 ingredients into 23 unique items
[AI Categorization] Attempt 1/3 for 23 ingredients
[AI Categorization] Success on attempt 1
[Shopping List Preview] Preview generated successfully. 23 items, AI status: success
```

Logi z błędem:
```
[POST /api/shopping-lists/preview] Unauthorized access attempt
```

Logi AI failure:
```
[AI Categorization] Attempt 1 failed: Timeout
[AI Categorization] Retrying in 1000ms...
[AI Categorization] All 3 attempts failed. Using fallback category "Inne" for all items.
```

---

## Następne kroki po testach

1. ✅ Wszystkie testy pass → Merge do main branch
2. ❌ Jakieś testy fail → Debug i fix
3. 📝 Dokumentacja → Zaktualizować API docs
4. 🚀 Deploy → Vercel (dodać OPENAI_API_KEY do env variables)

---

**Happy Testing!** 🧪🚀
