Jako starszy programista frontendu Twoim zadaniem jest stworzenie szczegółowego planu wdrożenia nowego widoku w aplikacji internetowej. Plan ten powinien być kompleksowy i wystarczająco jasny dla innego programisty frontendowego, aby mógł poprawnie i wydajnie wdrożyć widok.

Najpierw przejrzyj następujące informacje:

1. Product Requirements Document (PRD):
   <prd>
   @.ai/doc/4_prd.md
   </prd>

2. Opis widoku:
   <view_description>
   @.ai/doc/21_0_all_description_UI.md
   </view_description>

3. User Stories:
   <user_stories>

### 5.2 Zarządzanie przepisami

US-006: Dodawanie nowego przepisu
Jako użytkownik, chcę dodać nowy przepis do mojej kolekcji, aby móc go później przypisać do kalendarza posiłków.

Kryteria akceptacji:

- Przycisk "Dodaj przepis" widoczny na stronie /recipes i w nawigacji
- Formularz zawiera: pole nazwa, textarea instrukcje, dynamiczna lista składników
- Każdy składnik ma pola: ilość (numeryczna, opcjonalna), jednostka (tekstowa, opcjonalna), nazwa (tekstowa, wymagana)
- Przycisk "+ Dodaj składnik" dodaje nowy wiersz składnika
- Ikonka "🗑️" przy składniku usuwa ten składnik
- Walidacja: nazwa 3-100 znaków, instrukcje 10-5000 znaków, minimum 1 składnik, maksimum 50
- Komunikaty błędów inline pod polami w języku polskim
- Przycisk "Zapisz" zapisuje przepis do bazy danych z powiązanymi składnikami
- Po zapisie przekierowanie do widoku szczegółów przepisu
- Toast notification: "Przepis dodany pomyślnie"

US-007: Przeglądanie listy przepisów
Jako użytkownik, chcę przeglądać wszystkie moje przepisy, aby łatwo znaleźć ten którego potrzebuję.

Kryteria akceptacji:

- Strona /recipes wyświetla wszystkie przepisy użytkownika
- Search bar u góry strony z placeholderem "Szukaj przepisu..."
- Wyszukiwanie w czasie rzeczywistym (debounce 300ms) po nazwie przepisu
- Case-insensitive substring matching
- Dropdown sortowania: "Alfabetycznie A-Z", "Alfabetycznie Z-A", "Najnowsze", "Najstarsze"
- Responsywny layout: karty 3 kolumny na desktop, 2 na tablet, 1 na mobile
- Każda karta pokazuje: nazwę przepisu, liczbę składników, datę dodania
- Kliknięcie karty otwiera szczegóły przepisu
- Przycisk "Dodaj przepis" sticky w prawym dolnym rogu
- Lazy loading: ładowanie po 20 przepisów (infinite scroll)
- Empty state: "Brak przepisów. Dodaj pierwszy przepis!" jeśli lista pusta

US-008: Wyświetlanie szczegółów przepisu
Jako użytkownik, chcę zobaczyć pełne szczegóły przepisu, aby zapoznać się z instrukcjami i składnikami.

Kryteria akceptacji:

- Strona /recipes/[id] wyświetla pojedynczy przepis
- Sekcja nagłówka: nazwa przepisu, data dodania, data ostatniej edycji
- Sekcja składniki: lista wszystkich składników (ilość, jednostka, nazwa)
- Sekcja instrukcje: pełny tekst instrukcji z zachowaniem formatowania (newlines)
- Informacja: "Ten przepis jest przypisany do X posiłków w kalendarzu" jeśli istnieją przypisania
- Przyciski akcji: "Edytuj", "Usuń", "Powrót do listy"
- Przycisk "Edytuj" otwiera formularz edycji
- Przycisk "Usuń" otwiera dialog potwierdzenia
- Przycisk "Powrót do listy" kieruje do /recipes

US-009: Edycja istniejącego przepisu
Jako użytkownik, chcę edytować przepis, aby poprawić błędy lub zaktualizować informacje.

Kryteria akceptacji:

- Przycisk "Edytuj" w widoku szczegółów przepisu
- Formularz identyczny jak przy dodawaniu, wypełniony aktualnymi danymi
- Możliwość modyfikacji wszystkich pól: nazwa, instrukcje, składniki
- Możliwość dodawania nowych składników
- Możliwość usuwania istniejących składników
- Możliwość modyfikacji kolejności składników (sort_order)
- Walidacja identyczna jak przy dodawaniu
- Przycisk "Zapisz zmiany" aktualizuje przepis w bazie danych
- Live update: zmiany propagują się do wszystkich przypisań w kalendarzu
- Snapshot pattern: wcześniej wygenerowane listy zakupów pozostają niezmienione
- Po zapisie przekierowanie do widoku szczegółów
- Toast notification: "Przepis zaktualizowany pomyślnie"
- Informacja w formularzu: "Zmiany zaktualizują wszystkie przypisania w kalendarzu"

US-010: Usuwanie przepisu
Jako użytkownik, chcę usunąć przepis którego już nie potrzebuję, aby utrzymać porządek w kolekcji.

Kryteria akceptacji:

- Przycisk "Usuń" w widoku szczegółów przepisu
- Sprawdzenie czy przepis jest przypisany w kalendarzu
- Jeśli przypisany: dialog "Ten przepis jest przypisany do X posiłków. Usunięcie spowoduje usunięcie przypisań. Kontynuować?"
- Jeśli nie przypisany: dialog "Czy na pewno chcesz usunąć ten przepis?"
- Przyciski w dialogu: "Anuluj" (domyślny focus), "Usuń" (czerwony, destructive)
- Po potwierdzeniu cascade delete: przepis + składniki + przypisania w kalendarzu
- Przekierowanie do /recipes
- Toast notification: "Przepis usunięty" lub "Przepis usunięty wraz z X przypisaniami"

### 5.3 Kalendarz tygodniowy

US-011: Wyświetlanie kalendarza tygodniowego
Jako użytkownik, chcę zobaczyć kalendarz tygodniowy z posiłkami, aby planować menu na nadchodzące dni.

Kryteria akceptacji:

- Strona /calendar wyświetla kalendarz 7 dni × 4 posiłki = 28 komórek
- Dni tygodnia: Poniedziałek, Wtorek, Środa, Czwartek, Piątek, Sobota, Niedziela
- Typy posiłków: Śniadanie, Drugie śniadanie, Obiad, Kolacja
- Responsywny layout: desktop - tabela 7×4, tablet - scrollowalny poziomo, mobile - accordion
- Domyślnie wyświetlany bieżący tydzień (obliczany od bieżącej daty)
- Nagłówek pokazuje zakres dat: "Tydzień 20-26 stycznia 2025"
- Każda komórka zawiera datę i typ posiłku
- Pusta komórka: przycisk "Przypisz przepis"
- Komórka z przepisem: nazwa przepisu (truncate 30 znaków) + przycisk "×"

US-012: Nawigacja między tygodniami
Jako użytkownik, chcę nawigować między różnymi tygodniami, aby planować posiłki z wyprzedzeniem lub sprawdzić historyczne plany.

Kryteria akceptacji:

- Przyciski nawigacji: "← Poprzedni tydzień", "Bieżący tydzień", "Następny tydzień →"
- Kliknięcie "Poprzedni tydzień" ładuje tydzień o 7 dni wcześniej
- Kliknięcie "Następny tydzień" ładuje tydzień o 7 dni później
- Kliknięcie "Bieżący tydzień" wraca do tygodnia zawierającego dzisiejszą datę
- URL zawiera parametr week_start_date: /calendar?week=2025-01-20
- Deep linking: otwarcie URL z parametrem week ładuje odpowiedni tydzień
- Dane wszystkich tygodni przechowywane w bazie danych (brak limitu historii)

US-013: Przypisywanie przepisu do komórki kalendarza
Jako użytkownik, chcę przypisać przepis do konkretnego dnia i posiłku, aby zaplanować co będę jeść.

Kryteria akceptacji:

- Kliknięcie "Przypisz przepis" w pustej komórce otwiera modal
- Modal zawiera: search bar, listę przepisów użytkownika
- Search bar: wyszukiwanie w czasie rzeczywistym po nazwie przepisu
- Lista przepisów: infinite scroll, ładowanie po 20
- Każdy przepis wyświetla: nazwę, liczbę składników
- Kliknięcie przepisu zamyka modal i przypisuje przepis do komórki
- Komórka pokazuje nazwę przepisu (truncate 30 znaków)
- Hover na nazwie: tooltip z pełną nazwą
- Przycisk "×" pojawia się przy nazwie
- Jeden przepis na komórkę (ograniczenie MVP)
- Zapisanie przypisania: user_id, recipe_id, date, meal_type
- Toast notification: "Przepis przypisany do [dzień] - [posiłek]"

US-014: Podgląd przepisu z kalendarza
Jako użytkownik, chcę szybko podejrzeć szczegóły przypisanego przepisu, aby przypomnieć sobie składniki i instrukcje.

Kryteria akceptacji:

- Kliknięcie na nazwę przypisanego przepisu otwiera podgląd
- Podgląd jako modal lub side panel
- Wyświetlanie: nazwa przepisu, składniki, instrukcje
- Przycisk "Edytuj przepis" kieruje do /recipes/[id]/edit
- Przycisk "Usuń z kalendarza" usuwa przypisanie (bez usuwania przepisu)
- Przycisk "Zamknij" zamyka podgląd
- Escape key zamyka podgląd

US-015: Usuwanie przypisania z kalendarza
Jako użytkownik, chcę usunąć przepis z kalendarza, aby zmienić plan posiłków bez usuwania samego przepisu.

Kryteria akceptacji:

- Przycisk "×" widoczny przy każdym przypisanym przepisie
- Kliknięcie "×" usuwa przypisanie bez dialog potwierdzenia (szybka akcja)
- Komórka wraca do stanu pustego z przyciskiem "Przypisz przepis"
- Przepis pozostaje w kolekcji użytkownika (nie jest usuwany)
- Toast notification: "Przepis usunięty z kalendarza"
- Optimistic UI: natychmiastowe usunięcie, rollback przy błędzie API

### 5.4 Generowanie list zakupów

US-016: Wybór trybu generowania listy
Jako użytkownik, chcę wybrać czy generować listę z kalendarza czy z ręcznie wybranych przepisów, aby mieć elastyczność w planowaniu zakupów.

Kryteria akceptacji:

- Strona /shopping-lists/generate z dwoma trybami
- Radio buttons: "Z kalendarza" (default) lub "Z przepisów"
- Tryb "Z kalendarza": checkboxy dla dni (Pon-Niedz) i posiłków (4 typy)
- Shortcut: przycisk "Zaznacz cały tydzień" zaznacza wszystkie checkboxy
- Tryb "Z przepisów": lista przepisów z checkboxami
- Search bar w trybie "Z przepisów" dla szybkiego znajdowania
- Licznik: "Zaznaczono X przepisów" lub "Zaznaczono X posiłków"
- Przycisk "Generuj listę zakupów" disabled jeśli nic nie zaznaczone
- Przycisk aktywny gdy minimum 1 przepis/posiłek zaznaczony

US-017: Generowanie listy z agregacją składników
Jako użytkownik, chcę automatycznie wygenerować listę zakupów z zaznaczonych przepisów, aby nie musieć ręcznie zbierać składników.

Kryteria akceptacji:

- Kliknięcie "Generuj listę zakupów" rozpoczyna proces
- Loading state: spinner + progress bar + komunikat "Pobieram składniki..."
- Fetch składników z zaznaczonych przepisów/posiłków
- Normalizacja: trim wielokrotnych spacji, lowercase dla porównania
- Agregacja: grupowanie identycznych składników (case-insensitive matching nazwy + jednostki)
- Sumowanie ilości dla numerycznych wartości: "200g mąki" + "300g mąki" = "500g mąki"
- Składniki bez ilości jako osobne pozycje (nie agregowane)
- Komunikat "Kategoryzuję składniki..." po agregacji
- AI request do OpenAI GPT-4o mini z wszystkimi składnikami
- Timeout 10s, retry 2x z backoff (1s, 2s)
- Fallback: przy błędzie wszystkie → "Inne"
- Przekierowanie do preview listy po zakończeniu

US-018: AI kategoryzacja składników
Jako użytkownik, chcę aby składniki były automatycznie kategoryzowane, aby łatwiej było robić zakupy w sklepie.

Kryteria akceptacji:

- AI kategoryzacja podczas generowania listy
- 7 kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Batch request: wszystkie składniki w jednym API call do OpenAI
- Model: GPT-4o mini, temperatura=0
- Prompt: lista numerowana składników → JSON mapping {index: kategoria}
- Walidacja kategorii: tylko dozwolone kategorie, fallback "Inne"
- UX: spinner + komunikat "Kategoryzuję składniki..." (estimated time: 1-3s)
- Optimistic UI: użytkownik może edytować podczas kategoryzacji
- Error handling: jeśli AI fail → wszystkie składniki kategoria "Inne"
- Toast notification przy błędzie: "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie."

US-019: Edycja wygenerowanej listy zakupów
Jako użytkownik, chcę edytować wygenerowaną listę przed zapisem, aby dostosować ją do moich potrzeb.

Kryteria akceptacji:

- Preview listy zakupów pogrupowanej po kategoriach
- Kolejność kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Każdy składnik: checkbox (niezaznaczony), ilość, jednostka, nazwa
- Dropdown przy składniku: zmiana kategorii (7 opcji)
- Przycisk "+ Dodaj składnik": modal z formularzem (nazwa, ilość, jednostka, kategoria)
- Przycisk "🗑️" przy składniku: usunięcie z listy (bez potwierdzenia)
- Możliwość zmiany ilości inline (kliknięcie → editable input)
- Przycisk "Zapisz listę" u góry (sticky)
- Przycisk "Anuluj" wraca do /shopping-lists bez zapisywania
- Zmiany są lokalne (nie zapisane) do momentu kliknięcia "Zapisz"

US-020: Zapisywanie listy zakupów
Jako użytkownik, chcę zapisać listę zakupów, aby móc do niej wrócić i wyeksportować później.

Kryteria akceptacji:

- Kliknięcie "Zapisz listę" otwiera dialog z polem nazwa
- Domyślna nazwa: "Lista zakupów - [data]"
- Użytkownik może zmienić nazwę (max 200 znaków)
- Jeśli z kalendarza: zapisanie week_start_date i week_end_date
- Zapis do tabeli shopping_lists + shopping_list_items
- Lista jako niemutowalny snapshot (readonly po zapisie)
- Przekierowanie do /shopping-lists/[id] (widok szczegółów)
- Toast notification: "Lista zakupów zapisana"
- Breadcrumbs: Listy zakupów > [nazwa listy]

US-021: Przeglądanie historii list zakupów
Jako użytkownik, chcę zobaczyć wszystkie moje zapisane listy zakupów, aby móc do nich wrócić i porównać zakupy.

Kryteria akceptacji:

- Strona /shopping-lists wyświetla wszystkie listy użytkownika
- Sortowanie: według daty utworzenia (najnowsze pierwsze)
- Każda pozycja: nazwa listy, data utworzenia, zakres dat (jeśli z kalendarza), liczba składników
- Kliknięcie listy otwiera szczegóły /shopping-lists/[id]
- Przycisk "Usuń" przy każdej liście
- Kliknięcie "Usuń": dialog potwierdzenia "Czy na pewno usunąć listę [nazwa]?"
- Po potwierdzeniu: cascade delete lista + items
- Toast notification: "Lista usunięta"
- Empty state: "Brak list zakupów. Wygeneruj pierwszą listę!"
- Przycisk "Generuj nową listę" kieruje do /shopping-lists/generate

US-022: Obsługa pustych wyborów przy generowaniu
Jako użytkownik, chcę otrzymać jasny komunikat gdy próbuję wygenerować listę z pustych komórek kalendarza.

Kryteria akceptacji:

- Jeśli wszystkie zaznaczone komórki kalendarza puste: komunikat błędu
- Alert: "Wybrane posiłki nie mają przypisanych przepisów. Przypisz przepisy w kalendarzu lub wybierz inne posiłki."
- Przycisk "Przejdź do kalendarza" kieruje do /calendar
- Jeśli przynajmniej jedna komórka niepusta: pomijanie pustych bez ostrzeżenia
- Komunikat informacyjny: "Pominięto X pustych posiłków"
- Jeśli żaden przepis nie zaznaczony w trybie "Z przepisów": przycisk "Generuj" disabled
- Tooltip na disabled przycisku: "Zaznacz minimum 1 przepis"

### 5.5 Eksport list zakupów

US-023: Eksport listy do PDF
Jako użytkownik, chcę wyeksportować listę zakupów do PDF, aby móc ją wydrukować lub mieć na telefonie podczas zakupów.

Kryteria akceptacji:

- Przycisk "Eksportuj PDF" w widoku szczegółów listy /shopping-lists/[id]
- Kliknięcie otwiera preview modal z renderowanym PDF
- PDF layout: A4 pionowy, font Helvetica
- Nagłówek: "Lista zakupów - [nazwa listy]", data generowania
- Jeśli z kalendarza: zakres dat "Tydzień [data start] - [data end]"
- Treść: kategorie jako sekcje (bold, uppercase, podkreślone)
- Składniki: checkbox ☐, ilość, jednostka, nazwa (jedna linia per składnik)
- Kolejność kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Pominięcie pustych kategorii
- Stopka: "Wygenerowano przez ShopMate - [URL]"
- Modal przyciski: "Pobierz PDF", "Anuluj"
- Kliknięcie "Pobierz PDF": download pliku [nazwa-listy]-[data].pdf
- Filename: lowercase, spacje → myślniki, znaki specjalne usunięte

US-024: Eksport listy do TXT
Jako użytkownik, chcę wyeksportować listę do TXT, aby móc ją łatwo udostępnić przez wiadomość lub email.

Kryteria akceptacji:

- Przycisk "Eksportuj TXT" w widoku szczegółów listy
- Kliknięcie natychmiast pobiera plik (bez preview)
- Format plaintext: nagłówek (50x =), kategorie (uppercase), składniki, stopka
- Nagłówek: "LISTA ZAKUPÓW SHOPMATE", nazwa listy, zakres dat, separator
- Kategorie: nazwa kategorii (uppercase), separator (20x -), składniki
- Składniki: ilość jednostka nazwa (jedna linia per składnik)
- Kolejność kategorii identyczna jak PDF
- Stopka: separator (50x =), timestamp
- Encoding: UTF-8
- Filename: [nazwa-listy]-[data].txt
- Download pliku do lokalnego systemu

US-025: Kolejność kategorii w eksporcie
Jako użytkownik, chcę aby kategorie były zawsze w tej samej kolejności, aby łatwo było znaleźć składniki w sklepie.

Kryteria akceptacji:

- Stała kolejność kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Zawsze ta sama kolejność w PDF, TXT i UI
- Pominięcie kategorii bez składników (nie wyświetlane puste sekcje)
- Składniki w kategorii: sortowanie alfabetyczne po nazwie
- Case-insensitive sorting składników

</user_stories>

4. Endpoint Description:
   <endpoint_description>

## 2. Endpoints

### 2.1 Recipes

#### Create Recipe

**Method:** `POST`
**Path:** `/api/recipes`
**Description:** Create a new recipe with ingredients

**Request Body:**

```json
{
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta...\n2. Cook bacon...",
  "ingredients": [
    {
      "name": "spaghetti",
      "quantity": 500,
      "unit": "g",
      "sort_order": 0
    },
    {
      "name": "bacon",
      "quantity": 200,
      "unit": "g",
      "sort_order": 1
    },
    {
      "name": "parmesan cheese",
      "quantity": 100,
      "unit": "g",
      "sort_order": 2
    },
    {
      "name": "eggs",
      "quantity": 3,
      "unit": "pcs",
      "sort_order": 3
    },
    {
      "name": "salt",
      "quantity": null,
      "unit": null,
      "sort_order": 4
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta...\n2. Cook bacon...",
  "created_at": "2025-01-26T10:00:00Z",
  "updated_at": "2025-01-26T10:00:00Z",
  "ingredients": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "spaghetti",
      "quantity": 500,
      "unit": "g",
      "sort_order": 0
    }
    // ... other ingredients
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
  ```json
  {
    "error": "Validation failed",
    "details": {
      "name": ["Name must be between 3 and 100 characters"],
      "instructions": ["Instructions must be between 10 and 5000 characters"],
      "ingredients": ["At least 1 ingredient required, maximum 50"]
    }
  }
  ```
- `401 Unauthorized` - User not authenticated
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

#### List Recipes

**Method:** `GET`
**Path:** `/api/recipes`
**Description:** Get user's recipes with optional search and sorting

**Query Parameters:**

- `search` (optional): Case-insensitive substring match on recipe name
- `sort` (optional): `name_asc` | `name_desc` | `created_asc` | `created_desc` (default: `created_desc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**

```
GET /api/recipes?search=pasta&sort=name_asc&page=1&limit=20
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Spaghetti Carbonara",
      "ingredients_count": 5,
      "created_at": "2025-01-26T10:00:00Z",
      "updated_at": "2025-01-26T10:00:00Z"
    }
    // ... more recipes
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated

---

#### Get Recipe

**Method:** `GET`
**Path:** `/api/recipes/:id`
**Description:** Get single recipe with all ingredients

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta...\n2. Cook bacon...",
  "created_at": "2025-01-26T10:00:00Z",
  "updated_at": "2025-01-26T10:00:00Z",
  "ingredients": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "spaghetti",
      "quantity": 500,
      "unit": "g",
      "sort_order": 0
    }
    // ... other ingredients sorted by sort_order
  ],
  "meal_plan_assignments": 3
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Recipe not found or doesn't belong to user
  ```json
  {
    "error": "Recipe not found"
  }
  ```

---

#### Update Recipe

**Method:** `PUT`
**Path:** `/api/recipes/:id`
**Description:** Update recipe and ingredients (full replacement)

**Request Body:**

```json
{
  "name": "Spaghetti Carbonara (Updated)",
  "instructions": "1. Boil pasta al dente...\n2. Cook bacon crispy...",
  "ingredients": [
    {
      "name": "spaghetti",
      "quantity": 600,
      "unit": "g",
      "sort_order": 0
    }
    // ... other ingredients
  ]
}
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Spaghetti Carbonara (Updated)",
  "instructions": "1. Boil pasta al dente...\n2. Cook bacon crispy...",
  "created_at": "2025-01-26T10:00:00Z",
  "updated_at": "2025-01-26T11:30:00Z",
  "ingredients": [
    // ... new ingredients with new IDs
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Recipe not found or doesn't belong to user

**Note:** Changes propagate to meal plan assignments (live update), but NOT to previously saved shopping lists (snapshot pattern).

---

#### Delete Recipe

**Method:** `DELETE`
**Path:** `/api/recipes/:id`
**Description:** Delete recipe, ingredients, and meal plan assignments (CASCADE)

**Response (200 OK):**

```json
{
  "message": "Recipe deleted successfully",
  "deleted_meal_plan_assignments": 3
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Recipe not found or doesn't belong to user

---

### 2.2 Meal Plan (Weekly Calendar)

#### Get Week Calendar

**Method:** `GET`
**Path:** `/api/meal-plan`
**Description:** Get meal plan assignments for a specific week

**Query Parameters:**

- `week_start_date` (required): ISO date string for Monday of the week (YYYY-MM-DD)

**Example Request:**

```
GET /api/meal-plan?week_start_date=2025-01-20
```

**Response (200 OK):**

```json
{
  "week_start_date": "2025-01-20",
  "week_end_date": "2025-01-26",
  "assignments": [
    {
      "id": "750e8400-e29b-41d4-a716-446655440000",
      "day_of_week": 1,
      "meal_type": "breakfast",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "recipe_name": "Scrambled Eggs",
      "created_at": "2025-01-20T08:00:00Z"
    },
    {
      "id": "750e8400-e29b-41d4-a716-446655440001",
      "day_of_week": 1,
      "meal_type": "lunch",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440001",
      "recipe_name": "Spaghetti Carbonara",
      "created_at": "2025-01-20T09:00:00Z"
    }
    // ... more assignments for the week
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid date format
  ```json
  {
    "error": "Invalid week_start_date format. Expected YYYY-MM-DD"
  }
  ```
- `401 Unauthorized` - User not authenticated

---

#### Create Meal Plan Assignment

**Method:** `POST`
**Path:** `/api/meal-plan`
**Description:** Assign recipe to a specific day and meal type

**Request Body:**

```json
{
  "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
  "week_start_date": "2025-01-20",
  "day_of_week": 3,
  "meal_type": "lunch"
}
```

**Response (201 Created):**

```json
{
  "id": "750e8400-e29b-41d4-a716-446655440002",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
  "recipe_name": "Spaghetti Carbonara",
  "week_start_date": "2025-01-20",
  "day_of_week": 3,
  "meal_type": "lunch",
  "created_at": "2025-01-26T12:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or duplicate assignment
  ```json
  {
    "error": "Validation failed",
    "details": {
      "day_of_week": ["Must be between 1 and 7"],
      "meal_type": ["Must be one of: breakfast, second_breakfast, lunch, dinner"]
    }
  }
  ```
  ```json
  {
    "error": "This meal slot is already assigned. Remove existing assignment first."
  }
  ```
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Recipe not found or doesn't belong to user

**Validation:**

- `day_of_week`: 1-7 (1 = Monday, 7 = Sunday)
- `meal_type`: `breakfast` | `second_breakfast` | `lunch` | `dinner`
- `week_start_date`: ISO date string (YYYY-MM-DD), must be Monday
- UNIQUE constraint: one recipe per (user_id, week_start_date, day_of_week, meal_type)

---

#### Delete Meal Plan Assignment

**Method:** `DELETE`
**Path:** `/api/meal-plan/:id`
**Description:** Remove recipe from calendar (does NOT delete recipe itself)

**Response (200 OK):**

```json
{
  "message": "Assignment removed successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Assignment not found or doesn't belong to user

---

### 2.3 Shopping Lists

#### Preview Shopping List

**Method:** `POST`
**Path:** `/api/shopping-lists/preview`
**Description:** Generate shopping list preview with aggregated ingredients and AI categorization

**Request Body (Mode 1: From Calendar):**

```json
{
  "source": "calendar",
  "week_start_date": "2025-01-20",
  "selections": [
    {
      "day_of_week": 1,
      "meal_types": ["breakfast", "lunch"]
    },
    {
      "day_of_week": 2,
      "meal_types": ["breakfast", "second_breakfast", "lunch", "dinner"]
    }
    // ... more days
  ]
}
```

**Request Body (Mode 2: From Recipes):**

```json
{
  "source": "recipes",
  "recipe_ids": ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]
}
```

**Response (200 OK):**

```json
{
  "items": [
    {
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "sort_order": 0
    },
    {
      "ingredient_name": "bacon",
      "quantity": 600,
      "unit": "g",
      "category": "Mięso",
      "sort_order": 0
    },
    {
      "ingredient_name": "parmesan cheese",
      "quantity": 300,
      "unit": "g",
      "category": "Nabiał",
      "sort_order": 0
    },
    {
      "ingredient_name": "eggs",
      "quantity": 9,
      "unit": "pcs",
      "category": "Nabiał",
      "sort_order": 1
    },
    {
      "ingredient_name": "salt",
      "quantity": null,
      "unit": null,
      "category": "Przyprawy",
      "sort_order": 0
    }
  ],
  "metadata": {
    "source": "calendar",
    "week_start_date": "2025-01-20",
    "total_recipes": 5,
    "total_items": 23,
    "ai_categorization_status": "success",
    "skipped_empty_meals": 2
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or no recipes selected
  ```json
  {
    "error": "No recipes selected or all selected meals are empty"
  }
  ```
- `401 Unauthorized` - User not authenticated
- `422 Unprocessable Entity` - AI categorization failed (partial response with fallback)
  ```json
  {
    "items": [
      {
        "ingredient_name": "spaghetti",
        "quantity": 1500,
        "unit": "g",
        "category": "Inne",
        "sort_order": 0
      }
      // ... all items with category "Inne"
    ],
    "metadata": {
      "ai_categorization_status": "failed",
      "ai_error": "OpenAI timeout after 2 retries"
    }
  }
  ```

**Business Logic:**

1. Fetch ingredients from selected recipes/meals
2. Normalize ingredient names: trim, lowercase for comparison
3. Aggregate identical ingredients: group by (name + unit), sum quantities
4. AI categorization via OpenAI GPT-4o mini:
   - Batch request with all ingredients
   - Timeout: 10s, Retry: 2 times with exponential backoff (1s, 2s)
   - Fallback: All items → category "Inne" if AI fails
5. Sort items by category (fixed order), then alphabetically within category
6. Return preview (NOT saved yet)

**Categories (Polish):**

- Nabiał (Dairy)
- Warzywa (Vegetables)
- Owoce (Fruits)
- Mięso (Meat/Fish)
- Pieczywo (Bread/Pasta)
- Przyprawy (Spices)
- Inne (Other - fallback)

---

#### Save Shopping List

**Method:** `POST`
**Path:** `/api/shopping-lists`
**Description:** Save shopping list as immutable snapshot (after user edits preview)

**Request Body:**

```json
{
  "name": "Lista zakupów - Tydzień 20-26 stycznia",
  "week_start_date": "2025-01-20",
  "items": [
    {
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "sort_order": 0
    }
    // ... edited items from preview
  ]
}
```

**Response (201 Created):**

```json
{
  "id": "850e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Lista zakupów - Tydzień 20-26 stycznia",
  "week_start_date": "2025-01-20",
  "created_at": "2025-01-26T14:00:00Z",
  "updated_at": "2025-01-26T14:00:00Z",
  "items": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "shopping_list_id": "850e8400-e29b-41d4-a716-446655440000",
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "is_checked": false,
      "sort_order": 0
    }
    // ... all items
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
  ```json
  {
    "error": "Validation failed",
    "details": {
      "name": ["Name must not exceed 200 characters"],
      "items": ["Maximum 100 items allowed"]
    }
  }
  ```
- `401 Unauthorized` - User not authenticated

**Validation:**

- `name`: max 200 chars, default "Lista zakupów"
- `week_start_date`: nullable (NULL if generated from "From Recipes" mode)
- `items`: max 100 items
- Item `ingredient_name`: 1-100 chars
- Item `quantity`: NULL OR > 0
- Item `category`: must be one of 7 valid categories

**Note:** This creates an immutable snapshot. Future recipe edits do NOT update this saved list.

---

#### List Shopping Lists

**Method:** `GET`
**Path:** `/api/shopping-lists`
**Description:** Get user's saved shopping lists (history)

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "name": "Lista zakupów - Tydzień 20-26 stycznia",
      "week_start_date": "2025-01-20",
      "items_count": 23,
      "created_at": "2025-01-26T14:00:00Z"
    }
    // ... more lists sorted by created_at DESC
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "total_pages": 1
  }
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated

---

#### Get Shopping List

**Method:** `GET`
**Path:** `/api/shopping-lists/:id`
**Description:** Get single shopping list with all items

**Response (200 OK):**

```json
{
  "id": "850e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Lista zakupów - Tydzień 20-26 stycznia",
  "week_start_date": "2025-01-20",
  "created_at": "2025-01-26T14:00:00Z",
  "updated_at": "2025-01-26T14:00:00Z",
  "items": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "shopping_list_id": "850e8400-e29b-41d4-a716-446655440000",
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "is_checked": false,
      "sort_order": 0
    }
    // ... all items grouped by category in fixed order
  ]
}
```

**Items sorted by:**

1. Category (fixed order: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne)
2. `sort_order` within category
3. Alphabetically by `ingredient_name` (case-insensitive)

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Shopping list not found or doesn't belong to user

---

#### Update Shopping List Item (Check/Uncheck)

**Method:** `PATCH`
**Path:** `/api/shopping-lists/:list_id/items/:item_id`
**Description:** Toggle item checked status (mark as purchased)

**Request Body:**

```json
{
  "is_checked": true
}
```

**Response (200 OK):**

```json
{
  "id": "950e8400-e29b-41d4-a716-446655440000",
  "shopping_list_id": "850e8400-e29b-41d4-a716-446655440000",
  "ingredient_name": "spaghetti",
  "quantity": 1500,
  "unit": "g",
  "category": "Pieczywo",
  "is_checked": true,
  "sort_order": 0
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Item or list not found or doesn't belong to user

**Note:** This is the ONLY mutation allowed on saved shopping lists (snapshot pattern). Updating `is_checked` does NOT violate immutability.

---

#### Delete Shopping List

**Method:** `DELETE`
**Path:** `/api/shopping-lists/:id`
**Description:** Delete shopping list and all items (CASCADE)

**Response (200 OK):**

```json
{
  "message": "Shopping list deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Shopping list not found or doesn't belong to user

---

</endpoint_description>

5. Endpoint Implementation:
   <endpoint_implementation>
   @src/pages/api/meal-plan/[id].ts
   @src/pages/api/meal-plan/index.ts,
   @src/pages/api/recipes/index.ts,
   @src/pages/api/recipes/[id].ts,
   @src/pages/api/shopping-lists/[id].ts,
   @src/pages/api/shopping-lists/preview.ts,
   @src/pages/api/shopping-lists/index.ts
   </endpoint_implementation>

6. Type Definitions:
   <type_definitions>
   @src/types.ts
   </type_definitions>

7. Tech Stack:
   <tech_stack>
   @.ai/doc/tech-stack.md
   </tech_stack>

Przed utworzeniem ostatecznego planu wdrożenia przeprowadź analizę i planowanie wewnątrz tagów <implementation_breakdown> w swoim bloku myślenia. Ta sekcja może być dość długa, ponieważ ważne jest, aby być dokładnym.

W swoim podziale implementacji wykonaj następujące kroki:

1. Dla każdej sekcji wejściowej (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):

- Podsumuj kluczowe punkty
- Wymień wszelkie wymagania lub ograniczenia
- Zwróć uwagę na wszelkie potencjalne wyzwania lub ważne kwestie

2. Wyodrębnienie i wypisanie kluczowych wymagań z PRD
3. Wypisanie wszystkich potrzebnych głównych komponentów, wraz z krótkim opisem ich opisu, potrzebnych typów, obsługiwanych zdarzeń i warunków walidacji
4. Stworzenie wysokopoziomowego diagramu drzewa komponentów
5. Zidentyfikuj wymagane DTO i niestandardowe typy ViewModel dla każdego komponentu widoku. Szczegółowo wyjaśnij te nowe typy, dzieląc ich pola i powiązane typy.
6. Zidentyfikuj potencjalne zmienne stanu i niestandardowe hooki, wyjaśniając ich cel i sposób ich użycia
7. Wymień wymagane wywołania API i odpowiadające im akcje frontendowe
8. Zmapuj każdej historii użytkownika do konkretnych szczegółów implementacji, komponentów lub funkcji
9. Wymień interakcje użytkownika i ich oczekiwane wyniki
10. Wymień warunki wymagane przez API i jak je weryfikować na poziomie komponentów
11. Zidentyfikuj potencjalne scenariusze błędów i zasugeruj, jak sobie z nimi poradzić
12. Wymień potencjalne wyzwania związane z wdrożeniem tego widoku i zasugeruj możliwe rozwiązania

Po przeprowadzeniu analizy dostarcz plan wdrożenia w formacie Markdown z następującymi sekcjami:

1. Przegląd: Krótkie podsumowanie widoku i jego celu.
2. Routing widoku: Określenie ścieżki, na której widok powinien być dostępny.
3. Struktura komponentów: Zarys głównych komponentów i ich hierarchii.
4. Szczegóły komponentu: Dla każdego komponentu należy opisać:

- Opis komponentu, jego przeznaczenie i z czego się składa
- Główne elementy HTML i komponenty dzieci, które budują komponent
- Obsługiwane zdarzenia
- Warunki walidacji (szczegółowe warunki, zgodnie z API)
- Typy (DTO i ViewModel) wymagane przez komponent
- Propsy, które komponent przyjmuje od rodzica (interfejs komponentu)

5. Typy: Szczegółowy opis typów wymaganych do implementacji widoku, w tym dokładny podział wszelkich nowych typów lub modeli widoku według pól i typów.
6. Zarządzanie stanem: Szczegółowy opis sposobu zarządzania stanem w widoku, określenie, czy wymagany jest customowy hook.
7. Integracja API: Wyjaśnienie sposobu integracji z dostarczonym punktem końcowym. Precyzyjnie wskazuje typy żądania i odpowiedzi.
8. Interakcje użytkownika: Szczegółowy opis interakcji użytkownika i sposobu ich obsługi.
9. Warunki i walidacja: Opisz jakie warunki są weryfikowane przez interfejs, których komponentów dotyczą i jak wpływają one na stan interfejsu
10. Obsługa błędów: Opis sposobu obsługi potencjalnych błędów lub przypadków brzegowych.
11. Kroki implementacji: Przewodnik krok po kroku dotyczący implementacji widoku.

Upewnij się, że Twój plan jest zgodny z PRD, historyjkami użytkownika i uwzględnia dostarczony stack technologiczny.

Ostateczne wyniki powinny być w języku polskim i zapisane w pliku o nazwie .ai/{view-name}-view-implementation-plan.md. Nie uwzględniaj żadnej analizy i planowania w końcowym wyniku.

Oto przykład tego, jak powinien wyglądać plik wyjściowy (treść jest do zastąpienia):

```markdown
# Plan implementacji widoku [Nazwa widoku]

## 1. Przegląd

[Krótki opis widoku i jego celu]

## 2. Routing widoku

[Ścieżka, na której widok powinien być dostępny]

## 3. Struktura komponentów

[Zarys głównych komponentów i ich hierarchii]

## 4. Szczegóły komponentów

### [Nazwa komponentu 1]

- Opis komponentu [opis]
- Główne elementy: [opis]
- Obsługiwane interakcje: [lista]
- Obsługiwana walidacja: [lista, szczegółowa]
- Typy: [lista]
- Propsy: [lista]

### [Nazwa komponentu 2]

[...]

## 5. Typy

[Szczegółowy opis wymaganych typów]

## 6. Zarządzanie stanem

[Opis zarządzania stanem w widoku]

## 7. Integracja API

[Wyjaśnienie integracji z dostarczonym endpointem, wskazanie typów żądania i odpowiedzi]

## 8. Interakcje użytkownika

[Szczegółowy opis interakcji użytkownika]

## 9. Warunki i walidacja

[Szczegółowy opis warunków i ich walidacji]

## 10. Obsługa błędów

[Opis obsługi potencjalnych błędów]

## 11. Kroki implementacji

1. [Krok 1]
2. [Krok 2]
3. [...]
```

Rozpocznij analizę i planowanie już teraz. Twój ostateczny wynik powinien składać się wyłącznie z planu wdrożenia w języku polskim w formacie markdown, który zapiszesz w pliku .ai/{view-name}-view-implementation-plan.md i nie powinien powielać ani powtarzać żadnej pracy wykonanej w podziale implementacji.
