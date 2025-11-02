# Prompt dla generatora Proof of Concept - ShopMate

**Data:** 2025-10-22
**Cel:** Weryfikacja podstawowej funkcjonalności aplikacji (generowanie listy zakupów)
**Typ:** Minimal PoC (nie pełne MVP)

---

## INSTRUKCJA DLA GENERATORA

**WAŻNE: Przed rozpoczęciem implementacji:**

1. Przeczytaj poniższy prompt całkowicie
2. Rozplanuj pracę i przedstaw mi plan do akceptacji
3. Czekaj na moją akceptację planu zanim zaczniesz tworzyć kod
4. Dopiero po akceptacji przystąp do implementacji PoC

---

## KONTEKST PROJEKTU

ShopMate to aplikacja webowa do planowania posiłków i automatycznego generowania list zakupów. Użytkownicy:

1. Dodają przepisy kulinarne ze składnikami
2. Przypisują przepisy do kalendarza tygodniowego (dni × posiłki)
3. Generują zagregowaną listę zakupów ze składników
4. AI automatycznie kategoryzuje składniki według działów sklepowych

---

## CEL PROOF OF CONCEPT

Zweryfikować **podstawowy flow aplikacji** - od dodania przepisu do wygenerowania listy zakupów.

**Co musi działać w PoC:**

- ✅ Dodawanie przepisu ze składnikami
- ✅ Wyświetlanie listy przepisów
- ✅ Wybór przepisów do listy zakupów
- ✅ Agregacja składników (sumowanie tych samych składników)
- ✅ AI kategoryzacja składników (lub prosty fallback)
- ✅ Wyświetlenie wygenerowanej listy zakupów

**Czego NIE implementujemy w PoC:**

- ❌ Kalendarz tygodniowy (zbyt złożony dla PoC)
- ❌ System autoryzacji/kont użytkowników (PoC bez auth)
- ❌ Eksport do PDF/TXT (tylko wyświetlanie w przeglądarce)
- ❌ Edycja przepisów (tylko dodawanie i wyświetlanie)
- ❌ Usuwanie przepisów
- ❌ Row Level Security (jedno konto dla wszystkich)
- ❌ Responsywność mobilna (tylko desktop)
- ❌ Zaawansowane UI (shadcn/ui) - użyj prostych komponentów

---

## STACK TECHNOLOGICZNY PoC

**Uproszczony stack dla szybkiego PoC:**

```yaml
Frontend:
  Framework: Next.js 14 (App Router) - prostsze niż Astro dla PoC
  UI Library: React 18
  Language: TypeScript
  Styling: Tailwind CSS (podstawowe style, bez shadcn/ui)

Backend:
  Database: Supabase (PostgreSQL) - tylko podstawowe tabele
  Auth: WYŁĄCZONE w PoC (brak user_id w tabelach)

AI Categorization:
  Option 1: OpenAI API (GPT-4o mini) - jeśli masz API key
  Option 2: Prosty algorytm rule-based jako fallback

Hosting:
  Local development (npm run dev)
  Opcjonalnie: Vercel deployment
```

**Dlaczego Next.js zamiast Astro dla PoC:**

- Szybsza konfiguracja (zero setup dla API routes)
- Jeden framework dla frontend + backend
- Łatwiejsze dla generatorów kodu

---

## SCHEMAT BAZY DANYCH (uproszczony)

### Tabela: recipes

```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  instructions TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: ingredients

```sql
CREATE TABLE ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2),           -- opcjonalne
  unit VARCHAR(50),                  -- opcjonalne (np. "g", "ml", "sztuki")
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: shopping_lists (opcjonalna dla PoC)

```sql
CREATE TABLE shopping_lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) DEFAULT 'Lista zakupów',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: shopping_list_items (opcjonalna dla PoC)

```sql
CREATE TABLE shopping_list_items (
  id SERIAL PRIMARY KEY,
  shopping_list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10, 2),
  unit VARCHAR(50),
  category VARCHAR(50) NOT NULL,     -- Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**UWAGA:** Dla PoC możesz pominąć tabele shopping_lists i shopping_list_items - lista może być generowana on-the-fly bez zapisywania.

---

## FUNKCJONALNOŚCI DO ZAIMPLEMENTOWANIA

### 1. Strona: Dodawanie przepisu (`/recipes/new`)

**UI:**

- Formularz z polami:
  - Nazwa przepisu (input text)
  - Składniki (dynamiczna lista):
    - Każdy składnik ma 3 pola: ilość (number), jednostka (text), nazwa (text)
    - Przycisk "+ Dodaj składnik" dodaje nowy wiersz
    - Przycisk "✕" usuwa składnik (minimum 1 musi zostać)
  - Instrukcje (textarea)
- Przycisk "Zapisz przepis"

**Walidacja (minimalna):**

- Nazwa przepisu: wymagane, min. 3 znaki
- Składniki: minimum 1 składnik z wypełnioną nazwą
- Instrukcje: wymagane, min. 10 znaków

**Backend:**

- API endpoint: `POST /api/recipes`
- Zapisz przepis do tabeli `recipes`
- Zapisz składniki do tabeli `ingredients` (bulk insert)
- Zwróć ID nowego przepisu

**Po zapisie:**

- Przekierowanie do `/recipes` (lista przepisów)

---

### 2. Strona: Lista przepisów (`/recipes`)

**UI:**

- Lista wszystkich przepisów (proste karty lub tabela)
- Każdy przepis pokazuje:
  - Nazwę
  - Liczbę składników
  - Przycisk "Zobacz szczegóły" → przekierowanie do `/recipes/[id]`
- Przycisk "Dodaj przepis" → przekierowanie do `/recipes/new`
- Przycisk "Generuj listę zakupów" → przekierowanie do `/shopping-list/generate`

**Backend:**

- API endpoint: `GET /api/recipes`
- Query: pobierz wszystkie przepisy z liczbą składników

---

### 3. Strona: Szczegóły przepisu (`/recipes/[id]`)

**UI:**

- Wyświetl:
  - Nazwę przepisu
  - Listę składników (ilość + jednostka + nazwa)
  - Instrukcje przygotowania
- Przycisk "Wróć do listy" → `/recipes`

**Backend:**

- API endpoint: `GET /api/recipes/[id]`
- Query: pobierz przepis + wszystkie składniki (JOIN)

---

### 4. Strona: Generowanie listy zakupów (`/shopping-list/generate`)

**UI - Krok 1: Wybór przepisów**

- Lista wszystkich przepisów z checkboxami
- Użytkownik zaznacza przepisy które chce uwzględnić
- Przycisk "Generuj listę" (aktywny gdy ≥1 przepis zaznaczony)

**Backend - Krok 2: Agregacja składników**

- API endpoint: `POST /api/shopping-list/generate`
- Request body: `{ recipeIds: [1, 2, 3] }`
- Logika agregacji:
  1. Pobierz wszystkie składniki z wybranych przepisów
  2. Normalizacja nazw (lowercase, trim)
  3. Grupowanie:
     - Składniki o identycznej nazwie (po normalizacji) i jednostce → sumuj ilości
     - Składniki bez ilości → osobne pozycje (nie sumuj)
     - Składniki z różnymi jednostkami → osobne pozycje
  4. Przykład:

     ```
     Input:
     - 200g mąka (przepis 1)
     - 300g mąka (przepis 2)
     - 2 łyżki mąka (przepis 3)

     Output:
     - 500g mąka (zsumowane)
     - 2 łyżki mąka (osobna pozycja)
     ```

**Backend - Krok 3: AI Kategoryzacja**

**Option A: OpenAI API (jeśli masz klucz)**

```javascript
// Przykładowy kod
const prompt = `Kategoryzuj poniższe składniki do jednej z kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne.

Składniki:
1. mleko
2. marchew
3. kurczak
4. sól

Zwróć odpowiedź w formacie JSON: {"1": "Nabiał", "2": "Warzywa", "3": "Mięso", "4": "Przyprawy"}`;

const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
  temperature: 0,
});
```

**Option B: Rule-based fallback (jeśli brak API key)**

```javascript
const categories = {
  Nabiał: ["mleko", "ser", "jogurt", "masło", "śmietana", "twaróg", "jajko"],
  Warzywa: ["marchew", "ziemniak", "cebula", "czosnek", "pomidor", "papryka", "sałata"],
  Owoce: ["jabłko", "banan", "pomarańcza", "truskawka", "gruszka"],
  Mięso: ["kurczak", "wołowina", "wieprzowina", "ryba", "szynka", "kiełbasa"],
  Pieczywo: ["chleb", "bułka", "bagietka", "tortilla", "pita"],
  Przyprawy: ["sól", "pieprz", "papryka", "bazylia", "oregano", "curry"],
  // Default: 'Inne'
};

function categorize(ingredientName) {
  const normalized = ingredientName.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }
  return "Inne";
}
```

**UI - Krok 4: Wyświetlenie listy**

- Pokaż wygenerowaną listę pogrupowaną po kategoriach
- Format:

  ```
  === NABIAŁ ===
  ☐ 500g mleko
  ☐ 200g masło

  === WARZYWA ===
  ☐ 3 sztuki marchew
  ☐ 1kg ziemniak

  === INNE ===
  ☐ sól do smaku
  ```

- Przyciski:
  - "Wróć do przepisów"
  - Opcjonalnie: "Zapisz listę" (jeśli implementujesz persist do DB)

---

## PRZYKŁADOWY FLOW UŻYTKOWNIKA

```
1. Start → localhost:3000

2. Użytkownik klika "Dodaj przepis"
   → Formularz (/recipes/new)
   → Wypełnia:
      Nazwa: "Naleśniki"
      Składniki:
        - 500ml mleko
        - 300g mąka
        - 2 sztuki jajko
        - 1 łyżka cukier
      Instrukcje: "Zmiksuj składniki, smaż na patelni..."
   → Klik "Zapisz przepis"
   → Redirect do /recipes

3. Użytkownik dodaje drugi przepis (np. "Omlet")
   → Składniki:
      - 3 sztuki jajko
      - 100ml mleko
      - 50g ser
   → Zapisuje

4. Użytkownik klika "Generuj listę zakupów"
   → Strona /shopping-list/generate
   → Zaznacza oba przepisy (Naleśniki + Omlet)
   → Klik "Generuj listę"

5. System agreguje składniki:
   - mleko: 500ml + 100ml = 600ml
   - mąka: 300g (tylko z jednego przepisu)
   - jajko: 2 + 3 = 5 sztuk
   - cukier: 1 łyżka
   - ser: 50g

6. System kategoryzuje (AI lub rule-based):
   - mleko → Nabiał
   - mąka → Inne (lub Pieczywo)
   - jajko → Nabiał
   - cukier → Przyprawy
   - ser → Nabiał

7. Wyświetlenie listy:

   LISTA ZAKUPÓW

   === NABIAŁ ===
   ☐ 600ml mleko
   ☐ 5 sztuk jajko
   ☐ 50g ser

   === PRZYPRAWY ===
   ☐ 1 łyżka cukier

   === INNE ===
   ☐ 300g mąka
```

---

## WYMAGANIA TECHNICZNE

### Setup projektu

```bash
# Inicjalizacja Next.js
npx create-next-app@latest shopmate-poc --typescript --tailwind --app

# Instalacja zależności
cd shopmate-poc
npm install @supabase/supabase-js
npm install openai  # jeśli używasz OpenAI API

# Environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key  # opcjonalne
```

### Struktura folderów (sugerowana)

```
shopmate-poc/
├── app/
│   ├── page.tsx                      # Strona główna (redirect do /recipes)
│   ├── recipes/
│   │   ├── page.tsx                  # Lista przepisów
│   │   ├── [id]/page.tsx             # Szczegóły przepisu
│   │   └── new/page.tsx              # Dodawanie przepisu
│   ├── shopping-list/
│   │   └── generate/page.tsx         # Generowanie listy
│   └── api/
│       ├── recipes/
│       │   ├── route.ts              # GET /api/recipes, POST /api/recipes
│       │   └── [id]/route.ts         # GET /api/recipes/[id]
│       └── shopping-list/
│           └── generate/route.ts     # POST /api/shopping-list/generate
├── lib/
│   ├── supabase.ts                   # Supabase client
│   ├── categorize.ts                 # AI lub rule-based categorization
│   └── aggregateIngredients.ts       # Logika agregacji
├── types/
│   └── index.ts                      # TypeScript types
└── .env.local
```

### TypeScript Types (przykład)

```typescript
// types/index.ts
export interface Recipe {
  id: number;
  name: string;
  instructions: string;
  created_at: string;
}

export interface Ingredient {
  id: number;
  recipe_id: number;
  quantity: number | null;
  unit: string | null;
  name: string;
  created_at: string;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: Ingredient[];
}

export interface AggregatedIngredient {
  name: string; // normalized name (lowercase)
  quantity: number | null;
  unit: string | null;
  category?: string; // Po kategoryzacji
  originalName: string; // Original case-sensitive name dla display
}

export interface ShoppingListItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
}

export interface ShoppingListByCategory {
  [category: string]: ShoppingListItem[];
}
```

---

## KLUCZOWE ALGORYTMY

### Agregacja składników

```typescript
// lib/aggregateIngredients.ts
export function aggregateIngredients(ingredients: Ingredient[]): AggregatedIngredient[] {
  const map = new Map<string, AggregatedIngredient>();

  for (const ingredient of ingredients) {
    const normalizedName = ingredient.name.toLowerCase().trim();
    const key = `${normalizedName}|${ingredient.unit || "no-unit"}`;

    if (map.has(key)) {
      const existing = map.get(key)!;
      // Sumuj ilości jeśli obie są numeryczne
      if (existing.quantity !== null && ingredient.quantity !== null) {
        existing.quantity += ingredient.quantity;
      } else {
        // Jeśli któraś nie ma ilości, nie sumuj (dodaj jako osobną pozycję)
        // Dla PoC: możemy po prostu dodać jako duplikat
        const newKey = `${key}|${Math.random()}`;
        map.set(newKey, {
          name: normalizedName,
          originalName: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        });
      }
    } else {
      map.set(key, {
        name: normalizedName,
        originalName: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      });
    }
  }

  return Array.from(map.values());
}
```

### AI Kategoryzacja (opcjonalna)

```typescript
// lib/categorize.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function categorizeWithAI(ingredients: string[]): Promise<{ [key: string]: string }> {
  const prompt = `Kategoryzuj poniższe składniki do jednej z kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne.

Składniki:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join("\n")}

Zwróć odpowiedź w formacie JSON: {"1": "kategoria", "2": "kategoria", ...}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || "{}");
  } catch (error) {
    console.error("AI categorization failed:", error);
    // Fallback to rule-based
    return categorizeRuleBased(ingredients);
  }
}

export function categorizeRuleBased(ingredients: string[]): { [key: string]: string } {
  const rules = {
    Nabiał: ["mleko", "ser", "jogurt", "masło", "śmietana", "twaróg", "jajko", "jajka"],
    Warzywa: ["marchew", "ziemniak", "cebula", "czosnek", "pomidor", "papryka", "sałata", "ogórek", "brokuł"],
    Owoce: ["jabłko", "banan", "pomarańcza", "truskawka", "gruszka", "winogrona"],
    Mięso: ["kurczak", "wołowina", "wieprzowina", "ryba", "szynka", "kiełbasa", "mięso"],
    Pieczywo: ["chleb", "bułka", "bagietka", "tortilla", "pita"],
    Przyprawy: ["sól", "pieprz", "papryka", "bazylia", "oregano", "curry", "cukier", "mąka"],
  };

  const result: { [key: string]: string } = {};

  ingredients.forEach((ingredient, index) => {
    const normalized = ingredient.toLowerCase();
    let category = "Inne";

    for (const [cat, keywords] of Object.entries(rules)) {
      if (keywords.some((keyword) => normalized.includes(keyword))) {
        category = cat;
        break;
      }
    }

    result[(index + 1).toString()] = category;
  });

  return result;
}
```

---

## KRYTERIA SUKCESU PoC

PoC jest uznany za sukces jeśli:

1. ✅ **Można dodać przepis** ze składnikami i zapisać do bazy danych
2. ✅ **Składniki są poprawnie zapisane** z relacją do przepisu (foreign key)
3. ✅ **Lista przepisów wyświetla się** z poprawnymi danymi
4. ✅ **Agregacja składników działa** - te same składniki są sumowane
5. ✅ **Kategoryzacja działa** - składniki są pogrupowane (AI lub rule-based)
6. ✅ **Lista zakupów wyświetla się** w czytelnej formie pogrupowanej po kategoriach
7. ✅ **Flow jest kompletny** - od dodania przepisu do wygenerowania listy

**Dodatkowe (nice-to-have):**

- Podstawowa walidacja formularzy
- Ładne UI (ale nie wymagane - może być brzydkie)
- Loading states podczas API calls
- Error handling (toast notifications lub alerts)

---

## CO ROBIĆ JEŚLI COŚ NIE DZIAŁA

### Problem: Brak OpenAI API key

**Rozwiązanie:** Użyj rule-based categorization (pełny kod powyżej)

### Problem: Supabase setup jest skomplikowany

**Rozwiązanie opcjonalna:** Użyj in-memory storage (array w pamięci) dla PoC

```typescript
// Pseudo-database
let recipes: Recipe[] = [];
let ingredients: Ingredient[] = [];
let nextRecipeId = 1;
let nextIngredientId = 1;
```

### Problem: Agregacja nie działa poprawnie

**Rozwiązanie:** Zacznij od prostszej wersji - nie sumuj, tylko wyświetl wszystkie składniki

```typescript
// Simplified version - no aggregation
function getAllIngredients(recipeIds: number[]): Ingredient[] {
  return ingredients.filter((ing) => recipeIds.includes(ing.recipe_id));
}
```

### Problem: UI jest brzydki

**Rozwiązanie:** To jest OK dla PoC! Funkcjonalność > wygląd

---

## HARMONOGRAM (sugerowany)

**TOTAL TIME: 4-6 godzin dla doświadczonego developera**

1. **Setup projektu** (30 min)
   - Next.js init
   - Supabase setup + schema creation
   - Environment variables

2. **Backend API** (1.5 godz)
   - POST /api/recipes (create recipe)
   - GET /api/recipes (list recipes)
   - GET /api/recipes/[id] (recipe details)
   - POST /api/shopping-list/generate (agregacja + kategoryzacja)

3. **Frontend - Przepisy** (1.5 godz)
   - /recipes (lista)
   - /recipes/new (formularz dodawania)
   - /recipes/[id] (szczegóły)

4. **Frontend - Lista zakupów** (1 godz)
   - /shopping-list/generate (wybór przepisów + wyświetlenie listy)

5. **Testing + bugfixing** (30 min)
   - Test całego flow
   - Fix edge cases

---

## DELIVERABLES

Po zakończeniu PoC dostarcz:

1. **Działającą aplikację** (lokalnie lub deployed na Vercel)
2. **Kod źródłowy** (GitHub repo lub zip)
3. **Krótkie README.md** z:
   - Instrukcjami setup (jak uruchomić lokalnie)
   - Listą zaimplementowanych features
   - Notatkami o tym co działa vs co nie działa
   - Screenshots (opcjonalnie)

4. **Krótkie wideo demo** (1-2 minuty, opcjonalnie):
   - Dodanie 2 przepisów
   - Wygenerowanie listy zakupów
   - Pokazanie agregacji i kategoryzacji

---

## PYTANIA DO CLARIFICATION (przed startem)

Proszę odpowiedz przed rozpoczęciem implementacji:

1. **Czy masz dostęp do OpenAI API key?**
   - Jeśli TAK: użyj AI categorization
   - Jeśli NIE: użyj rule-based fallback

2. **Czy preferujesz Supabase czy in-memory storage dla PoC?**
   - Supabase: bardziej realistic, ale więcej setup
   - In-memory: ultra szybki start, ale dane tracone po restart

3. **Czy chcesz aby lista była zapisywana do DB czy tylko wyświetlana?**
   - Zapisywana: więcej kodu, ale bliższe MVP
   - Tylko wyświetlana: szybsze, wystarczające dla PoC

4. **Czy deployment na Vercel jest wymagany czy wystarczy localhost?**
   - Vercel: mogę przetestować zdalnie
   - Localhost: szybsze, wystarczające dla weryfikacji koncept

5. **Jaką wersję Next.js preferujesz?**
   - Next.js 14 (App Router) - recommended
   - Next.js 13/14 (Pages Router) - starsze podejście

---

## FINALNE PRZYPOMNIENIE

**🚨 PRZED ROZPOCZĘCIEM IMPLEMENTACJI:**

1. Przeczytaj cały ten dokument
2. Przygotuj plan pracy (breakdown na mniejsze zadania)
3. Przedstaw mi plan do akceptacji w formie:

   ```
   PLAN IMPLEMENTACJI PoC ShopMate:

   Zadanie 1: Setup projektu (30 min)
   - [ ] Next.js init
   - [ ] Supabase schema
   - [ ] .env configuration

   Zadanie 2: Backend API (1.5h)
   - [ ] ...

   [itd.]

   TOTAL TIME: X godzin
   PYTANIA DO CLARIFICATION: [lista pytań]
   ```

4. Czekaj na moją akceptację i odpowiedzi na pytania
5. Dopiero wtedy zacznij implementację

**Powodzenia!** 🚀

---

**Data utworzenia:** 2025-10-22
**Przygotował:** Claude Code (Anthropic)
**Wersja:** 1.0
