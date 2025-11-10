Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
   <route_api_specification>
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

</route_api_specification>

2. Related database resources:
   <related_db_resources>

### Tabela: `shopping_lists`

**Opis:** Zapisane listy zakupów (snapshot pattern)

| Kolumna           | Typ          | Ograniczenia                                         | Opis                                                 |
| ----------------- | ------------ | ---------------------------------------------------- | ---------------------------------------------------- |
| `id`              | UUID         | PRIMARY KEY DEFAULT gen_random_uuid()                | Unikalny identyfikator listy                         |
| `user_id`         | UUID         | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel listy                                     |
| `name`            | VARCHAR(200) | NOT NULL DEFAULT 'Lista zakupów'                     | Nazwa listy                                          |
| `week_start_date` | DATE         | NULL                                                 | Data początku tygodnia (NULL dla list "Z przepisów") |
| `created_at`      | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                               | Data utworzenia                                      |
| `updated_at`      | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                               | Data ostatniej modyfikacji                           |

**Notatki:**

- Snapshot pattern: zapisana lista NIE aktualizuje się przy edycji przepisów
- `week_start_date` NULL jeśli lista wygenerowana "Z przepisów" (FR-016 Tryb 2)
- BRAK relacji z `meal_plan` - lista jest niezależnym snapshot

---

### Tabela: `shopping_list_items`

**Opis:** Składniki w listach zakupów z kategoriami AI

| Kolumna            | Typ          | Ograniczenia                                                                                                         | Opis                           |
| ------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `id`               | UUID         | PRIMARY KEY DEFAULT gen_random_uuid()                                                                                | Unikalny identyfikator pozycji |
| `shopping_list_id` | UUID         | NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE                                                             | Lista zakupów                  |
| `ingredient_name`  | VARCHAR(100) | NOT NULL CHECK (char_length(ingredient_name) >= 1 AND char_length(ingredient_name) <= 100)                           | Nazwa składnika                |
| `quantity`         | NUMERIC      | CHECK (quantity IS NULL OR quantity > 0)                                                                             | Łączna ilość (zagregowana)     |
| `unit`             | VARCHAR(50)  | NULL                                                                                                                 | Jednostka miary                |
| `category`         | VARCHAR(20)  | NOT NULL DEFAULT 'Inne' CHECK (category IN ('Nabiał', 'Warzywa', 'Owoce', 'Mięso', 'Pieczywo', 'Przyprawy', 'Inne')) | Kategoria AI                   |
| `is_checked`       | BOOLEAN      | NOT NULL DEFAULT FALSE                                                                                               | Czy zakupiony                  |
| `sort_order`       | INTEGER      | NOT NULL DEFAULT 0 CHECK (sort_order >= 0)                                                                           | Kolejność w kategorii          |

**Notatki:**

- BRAK relacji z `ingredients` - snapshot pattern, kopia danych w momencie generowania
- `category` przypisana przez OpenAI GPT-4o mini lub fallback "Inne"
- `is_checked` dla oznaczania zakupionych pozycji (nie narusza snapshot pattern)
- `ingredient_name` case preserved (oryginalna forma)
- Maksimum 100 pozycji na listę (walidacja w aplikacji - Zod)

---

</related_db_resources>

3. Definicje typów:
   <type_definitions>
   @src\types.ts
   </type_definitions>

4. Tech stack:
   <tech_stack>
   @.ai\doc\tech-stack.md
   </tech_stack>

5. Implementation rules:
   <implementation_rules>
   @.cursor\rules\shared.mdc,
   @.cursor\rules\backend.mdc,
   @.cursor\rules\astro.mdc)
   </implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointu interfejsu API REST. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele.
4. Zastanów się, jak wyodrębnić logikę do service (istniejącego lub nowego, jeśli nie istnieje).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API endpointa, zasobami bazy danych i regułami implementacji.
6. Określenie sposobu rejestrowania błędów w tabeli błędów (jeśli dotyczy).
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa w oparciu o specyfikację API i stack technologiczny.
8. Nakreśl potencjalne scenariusze błędów i odpowiadające im kody stanu.

Po przeprowadzeniu analizy utwórz szczegółowy plan wdrożenia w formacie markdown. Plan powinien zawierać następujące sekcje:

1. Przegląd punktu końcowego
2. Szczegóły żądania
3. Szczegóły odpowiedzi
4. Przepływ danych
5. Względy bezpieczeństwa
6. Obsługa błędów
7. Wydajność
8. Kroki implementacji

W całym planie upewnij się, że

- Używać prawidłowych kodów stanu API:
  - 200 dla pomyślnego odczytu
  - 201 dla pomyślnego utworzenia
  - 400 dla nieprawidłowych danych wejściowych
  - 401 dla nieautoryzowanego dostępu
  - 404 dla nie znalezionych zasobów
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown. Oto przykład tego, jak powinny wyglądać dane wyjściowe:

``markdown

# API Endpoint Implementation Plan: GET /api/recipes

## 1. Przegląd punktu końcowego

[Krótki opis celu i funkcjonalności punktu końcowego]

## 2. Szczegóły żądania

- Metoda HTTP: [GET/POST/PUT/DELETE]
- Struktura URL: [wzorzec URL]
- Parametry:
  - Wymagane: [Lista wymaganych parametrów]
  - Opcjonalne: [Lista opcjonalnych parametrów]
- Request Body: [Struktura treści żądania, jeśli dotyczy]

## 3. Wykorzystywane typy

[DTOs i Command Modele niezbędne do implementacji]

## 3. Szczegóły odpowiedzi

[Oczekiwana struktura odpowiedzi i kody statusu]

## 4. Przepływ danych

[Opis przepływu danych, w tym interakcji z zewnętrznymi usługami lub bazami danych]

## 5. Względy bezpieczeństwa

[Szczegóły uwierzytelniania, autoryzacji i walidacji danych]

## 6. Obsługa błędów

[Lista potencjalnych błędów i sposób ich obsługi]

## 7. Rozważania dotyczące wydajności

[Potencjalne wąskie gardła i strategie optymalizacji]

## 8. Etapy wdrożenia

1. [Krok 1]
2. [Krok 2]
3. [Krok 3]
   ...

```

Końcowe wyniki powinny składać się wyłącznie z planu wdrożenia w formacie markdown i nie powinny powielać ani powtarzać żadnej pracy wykonanej w sekcji analizy.

Pamiętaj, aby zapisać swój plan wdrożenia jako .ai/doc/17_11_endpoint-GET-shopping-lists-implementation-plan.md Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów.
```
