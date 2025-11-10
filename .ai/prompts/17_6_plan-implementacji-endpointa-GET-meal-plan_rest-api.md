Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
   <route_api_specification>
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

</route_api_specification>

2. Related database resources:
   <related_db_resources>

### Tabela: `meal_plan`

**Opis:** Kalendarz tygodniowy - przypisania przepisów do dni i posiłków

| Kolumna           | Typ         | Ograniczenia                                                                       | Opis                               |
| ----------------- | ----------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| `id`              | UUID        | PRIMARY KEY DEFAULT gen_random_uuid()                                              | Unikalny identyfikator przypisania |
| `user_id`         | UUID        | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE                               | Właściciel planu                   |
| `recipe_id`       | UUID        | NOT NULL REFERENCES recipes(id) ON DELETE CASCADE                                  | Przypisany przepis                 |
| `week_start_date` | DATE        | NOT NULL                                                                           | Poniedziałek tygodnia (ISO 8601)   |
| `day_of_week`     | SMALLINT    | NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7)                             | Dzień tygodnia (1=Pon, 7=Niedz)    |
| `meal_type`       | VARCHAR(20) | NOT NULL CHECK (meal_type IN ('breakfast', 'second_breakfast', 'lunch', 'dinner')) | Typ posiłku                        |
| `created_at`      | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                                                             | Data utworzenia przypisania        |

**Notatki:**

- UNIQUE constraint na `(user_id, week_start_date, day_of_week, meal_type)` zapobiega duplikatom
- CASCADE DELETE przy usunięciu przepisu (FR-005)
- Brak `updated_at` - przypisania są tylko dodawane/usuwane, nie edytowane
- `week_start_date` przechowuje zawsze poniedziałek, `day_of_week` określa przesunięcie

</related_db_resources>

3. Definicje typów:
   <type_definitions>
   @src\types.ts
   </type_definitions>

4. Tech stack:
   <tech_stack>
   @ai\doc\tech-stack.md
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

Pamiętaj, aby zapisać swój plan wdrożenia jako .ai/doc/17_6_endpoint-GET-meal-plan-implementation-plan.md Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów.
```
