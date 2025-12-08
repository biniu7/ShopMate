# OpenRouter Service

Serwis do komunikacji z OpenRouter API w projekcie ShopMate.

## 📋 Spis treści

- [Instalacja](#instalacja)
- [Konfiguracja](#konfiguracja)
- [Podstawowe użycie](#podstawowe-użycie)
- [API Reference](#api-reference)
- [Przykłady](#przykłady)
- [Testowanie](#testowanie)
- [Obsługa błędów](#obsługa-błędów)

## Instalacja

Wymagane pakiety zostały już zainstalowane w projekcie:

- `axios` - klient HTTP
- `zod` - walidacja danych

## Konfiguracja

### Zmienne środowiskowe

Dodaj klucz API OpenRouter do pliku `.env.local`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

### Domyślna konfiguracja

Serwis domyślnie używa następujących ustawień:

```typescript
{
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'openai/gpt-4o-mini',
  timeout: 10000,              // 10 sekund
  maxRetries: 2,               // 2 próby ponawiania
  retryDelay: 1000,           // 1 sekunda początkowego opóźnienia
  defaultTemperature: 0,       // Deterministyczne odpowiedzi
  defaultMaxTokens: 500        // Maksymalna długość odpowiedzi
}
```

### Nadpisywanie konfiguracji

Możesz nadpisać domyślne ustawienia podczas tworzenia instancji:

```typescript
const service = new OpenRouterService({
  defaultModel: "anthropic/claude-3-haiku",
  timeout: 15000,
  maxRetries: 3,
  defaultTemperature: 0.7,
});
```

## Podstawowe użycie

### Import

```typescript
import { OpenRouterService } from "@/lib/services/openrouter";
```

### Proste zapytanie

```typescript
const service = new OpenRouterService();

const response = await service.chat({
  systemMessage: "Jesteś pomocnym asystentem kulinarnym.",
  userMessage: "Zaproponuj szybki przepis na obiad.",
  temperature: 0.7,
});

if (response.success) {
  console.log(response.rawContent);
  console.log("Użyte tokeny:", response.tokensUsed);
} else {
  console.error(response.error);
}
```

### Kategoryzacja składników

```typescript
const result = await service.categorizeIngredients([
  { id: "123e4567-e89b-12d3-a456-426614174000", name: "mleko" },
  { id: "123e4567-e89b-12d3-a456-426614174001", name: "pomidor" },
  { id: "123e4567-e89b-12d3-a456-426614174002", name: "kurczak" },
]);

if (result.success) {
  console.log(result.categories);
  // {
  //   '123e4567-e89b-12d3-a456-426614174000': 'Nabiał',
  //   '123e4567-e89b-12d3-a456-426614174001': 'Warzywa',
  //   '123e4567-e89b-12d3-a456-426614174002': 'Mięso'
  // }
} else {
  console.error(result.error);
}
```

## API Reference

### `OpenRouterService`

#### Konstruktor

```typescript
constructor(config?: Partial<OpenRouterConfig>)
```

#### Metody publiczne

##### `chat<T>(options: ChatOptions): Promise<ChatResponse<T>>`

Główna metoda do komunikacji z modelem LLM.

**Parametry:**

- `systemMessage` (string) - Instrukcje dla modelu (max 5000 znaków)
- `userMessage` (string) - Zapytanie użytkownika (max 10000 znaków)
- `model` (string, opcjonalny) - Nazwa modelu
- `temperature` (number, opcjonalny) - Temperatura (0-2)
- `maxTokens` (number, opcjonalny) - Maksymalna liczba tokenów
- `topP` (number, opcjonalny) - Top-p sampling
- `responseFormat` (ResponseFormat, opcjonalny) - Format odpowiedzi (JSON Schema)

**Zwraca:** `ChatResponse<T>` z polami:

- `success` (boolean) - Czy zapytanie się powiodło
- `data` (T, opcjonalny) - Sparsowane dane (jeśli użyto JSON Schema)
- `rawContent` (string, opcjonalny) - Surowa treść odpowiedzi
- `model` (string) - Użyty model
- `tokensUsed` (object, opcjonalny) - Statystyki tokenów
- `error` (object, opcjonalny) - Informacje o błędzie

##### `categorizeIngredients(ingredients: Array<{id: string, name: string}>): Promise<CategorizeIngredientsResponse>`

Kategoryzuje składniki do predefiniowanych kategorii.

**Parametry:**

- `ingredients` - Tablica składników (max 100 elementów)

**Zwraca:** `CategorizeIngredientsResponse` z polami:

- `success` (boolean)
- `categories` (Record<string, string>) - Mapowanie ID → kategoria
- `error` (object, opcjonalny)

**Dostępne kategorie:**

- Nabiał
- Warzywa
- Owoce
- Mięso
- Pieczywo
- Przyprawy
- Inne (fallback)

##### `testConnection(): Promise<boolean>`

Testuje połączenie z API OpenRouter.

**Zwraca:** `boolean` - true jeśli połączenie działa

## Przykłady

### Structured Output (JSON Schema)

```typescript
const response = await service.chat<{ answer: string }>({
  systemMessage: "Odpowiadaj w formacie JSON.",
  userMessage: "Jaka jest stolica Polski?",
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "answer_format",
      strict: true,
      schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
        },
        required: ["answer"],
        additionalProperties: false,
      },
    },
  },
});

console.log(response.data?.answer); // "Warszawa"
```

### Niestandardowy model

```typescript
const response = await service.chat({
  systemMessage: "Jesteś ekspertem od programowania.",
  userMessage: "Wyjaśnij koncepcję closure w JavaScript.",
  model: "anthropic/claude-3-sonnet",
  temperature: 0.3,
  maxTokens: 1000,
});
```

### Kategoryzacja dużej liczby składników

```typescript
const ingredients = [
  { id: "1", name: "mleko" },
  { id: "2", name: "masło" },
  // ... do 100 składników
];

const result = await service.categorizeIngredients(ingredients);

// Grupowanie według kategorii
const grouped = Object.entries(result.categories).reduce(
  (acc, [id, category]) => {
    if (!acc[category]) acc[category] = [];
    acc[category].push(id);
    return acc;
  },
  {} as Record<string, string[]>
);

console.log(grouped);
// {
//   'Nabiał': ['1', '2'],
//   'Warzywa': ['3', '4'],
//   ...
// }
```

## Testowanie

### Test połączenia

```typescript
const service = new OpenRouterService();
const isConnected = await service.testConnection();

if (!isConnected) {
  console.error("Nie można połączyć się z OpenRouter API");
}
```

### Test przez API endpoint

```bash
# Pobierz token Supabase z przeglądarki (Developer Tools → Application → Local Storage)
curl -X POST http://localhost:3000/api/ai/categorize-ingredients \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH_TOKEN" \
  -d '{
    "ingredients": [
      {"id": "123e4567-e89b-12d3-a456-426614174000", "name": "mleko"},
      {"id": "123e4567-e89b-12d3-a456-426614174001", "name": "pomidor"}
    ]
  }'
```

**Oczekiwana odpowiedź:**

```json
{
  "success": true,
  "categories": {
    "123e4567-e89b-12d3-a456-426614174000": "Nabiał",
    "123e4567-e89b-12d3-a456-426614174001": "Warzywa"
  }
}
```

## Obsługa błędów

### Typy błędów

Serwis definiuje następujące kody błędów:

| Kod                   | HTTP Status | Retryable | Opis                          |
| --------------------- | ----------- | --------- | ----------------------------- |
| `MISSING_API_KEY`     | -           | ❌        | Brak klucza API               |
| `INVALID_CONFIG`      | -           | ❌        | Nieprawidłowa konfiguracja    |
| `INVALID_REQUEST`     | 400         | ❌        | Nieprawidłowe zapytanie       |
| `UNAUTHORIZED`        | 401         | ❌        | Nieprawidłowy klucz API       |
| `FORBIDDEN`           | 403         | ❌        | Brak dostępu                  |
| `MODEL_NOT_FOUND`     | 404         | ❌        | Model nie istnieje            |
| `RATE_LIMIT_EXCEEDED` | 429         | ✅        | Przekroczono limit            |
| `SERVER_ERROR`        | 500-504     | ✅        | Błąd serwera                  |
| `TIMEOUT`             | -           | ✅        | Przekroczono czas oczekiwania |
| `PARSE_ERROR`         | -           | ❌        | Nie można sparsować JSON      |

### Mechanizm retry

Serwis automatycznie ponawia zapytania dla błędów typu `retryable`:

- Exponential backoff: 1s → 2s → 4s
- Maksymalnie 2 próby (domyślnie)
- Retry tylko dla błędów: 408, 429, 500-504, timeout

### Przykład obsługi błędów

```typescript
const response = await service.chat({
  systemMessage: "Odpowiedz krótko.",
  userMessage: "Test",
});

if (!response.success) {
  const { code, message, statusCode } = response.error!;

  switch (code) {
    case "UNAUTHORIZED":
      console.error("Sprawdź klucz API w zmiennych środowiskowych");
      break;
    case "RATE_LIMIT_EXCEEDED":
      console.warn("Limit zapytań osiągnięty, spróbuj za chwilę");
      break;
    case "TIMEOUT":
      console.warn("Zapytanie zbyt długo czekało, spróbuj ponownie");
      break;
    default:
      console.error(`Błąd: ${message}`);
  }
}
```

### Fallback dla kategoryzacji

W przypadku błędu kategoryzacji, wszystkie składniki powinny otrzymać kategorię "Inne":

```typescript
const result = await service.categorizeIngredients(ingredients);

const categories = result.success
  ? result.categories
  : ingredients.reduce(
      (acc, ing) => {
        acc[ing.id] = "Inne";
        return acc;
      },
      {} as Record<string, string>
    );
```

## Bezpieczeństwo

### ⚠️ WAŻNE: Klucz API

- **NIGDY** nie używaj serwisu w kodzie klienta (browser)
- Klucz API powinien być używany **TYLKO** w:
  - API endpoints (`src/pages/api/*`)
  - Server-side functions
  - Edge functions

### Walidacja danych wejściowych

Serwis automatycznie:

- Sanityzuje control characters
- Limituje długość komunikatów (5000/10000 znaków)
- Waliduje liczbę składników (max 100)

## Monitorowanie

### Logowanie

```typescript
// Błędy są automatycznie logowane do konsoli
console.warn("[OpenRouter] Retry attempt 1/2 po 1000ms");
console.error("[OpenRouter] Test connection failed:", error);
```

### Integracja z Sentry (TODO)

```typescript
import * as Sentry from "@sentry/astro";

const response = await service.chat(options);

if (!response.success && !response.error?.code?.includes("RETRY")) {
  Sentry.captureException(new Error(response.error?.message), {
    tags: {
      service: "openrouter",
      errorCode: response.error?.code,
    },
  });
}
```

## Koszty

Przykładowe koszty użycia GPT-4o-mini:

- Średnie zapytanie: ~$0.0001
- Kategoryzacja 50 składników: ~$0.0001
- Miesięczny koszt dla 1000 użytkowników: ~$0.40

## Troubleshooting

### Problem: "Brak klucza API OpenRouter"

**Rozwiązanie:** Dodaj `OPENROUTER_API_KEY` do `.env.local`

### Problem: Timeout

**Rozwiązanie:** Zwiększ timeout w konfiguracji lub sprawdź połączenie internetowe

### Problem: Rate limit exceeded

**Rozwiązanie:** Zaimplementuj kolejkowanie zapytań lub poczekaj

### Problem: Błąd parsowania JSON

**Rozwiązanie:** Sprawdź czy responseFormat jest poprawnie zdefiniowany

## Licencja

Część projektu ShopMate MVP.

---

**Autor:** Claude Code
**Data utworzenia:** 2025-11-10
**Ostatnia aktualizacja:** 2025-11-10
