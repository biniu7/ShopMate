# Plan implementacji usługi OpenRouter

**Data:** 2025-11-10
**Projekt:** ShopMate MVP
**Wersja:** 1.0

---

## 1. Opis usługi

Usługa OpenRouter (`OpenRouterService`) jest warstwą abstrakcji nad OpenRouter API, umożliwiającą komunikację z różnymi modelami LLM (Large Language Models) poprzez zunifikowany interfejs. Usługa zapewnia:

- Wysyłanie zapytań do modeli AI z obsługą komunikatów systemowych i użytkownika
- Wsparcie dla ustrukturyzowanych odpowiedzi (JSON Schema response format)
- Elastyczną konfigurację parametrów modelu (temperatura, max tokens, top_p, etc.)
- Obsługę błędów z mechanizmem retry i exponential backoff
- Walidację odpowiedzi zgodnie ze zdefiniowanym schematem
- Bezpieczne zarządzanie kluczami API
- Logowanie i monitoring błędów

**Główne przypadki użycia:**
1. Kategoryzacja składników przepisów (istniejąca funkcjonalność z OpenAI)
2. Przyszłe rozszerzenia: generowanie przepisów, sugestie zamienników, analiza wartości odżywczych

---

## 2. Opis konstruktora

Konstruktor `OpenRouterService` inicjalizuje usługę z konfiguracją pobieraną z zmiennych środowiskowych oraz opcjonalnymi parametrami nadpisującymi domyślne ustawienia.

### Sygnatura

```typescript
constructor(config?: Partial<OpenRouterConfig>)
```

### Parametry

```typescript
interface OpenRouterConfig {
  apiKey: string;                    // Klucz API OpenRouter (z env: OPENROUTER_API_KEY)
  baseUrl: string;                   // URL bazowy API (default: 'https://openrouter.ai/api/v1')
  defaultModel: string;              // Domyślny model (default: 'openai/gpt-4o-mini')
  timeout: number;                   // Timeout w ms (default: 10000)
  maxRetries: number;                // Max liczba prób (default: 2)
  retryDelay: number;                // Opóźnienie początkowe w ms (default: 1000)
  defaultTemperature: number;        // Default temperatura (default: 0)
  defaultMaxTokens: number;          // Default max tokens (default: 500)
}
```

### Walidacja w konstruktorze

1. Sprawdzenie obecności `apiKey` - rzuć `Error` jeśli brak
2. Walidacja `timeout` > 0
3. Walidacja `maxRetries` >= 0
4. Walidacja `retryDelay` > 0
5. Walidacja `defaultTemperature` w zakresie [0, 2]
6. Walidacja `defaultMaxTokens` > 0

### Przykład inicjalizacji

```typescript
// Domyślna konfiguracja (z env)
const service = new OpenRouterService();

// Niestandardowa konfiguracja
const service = new OpenRouterService({
  defaultModel: 'anthropic/claude-3-haiku',
  timeout: 15000,
  maxRetries: 3
});
```

---

## 3. Publiczne metody i pola

### 3.1 Metoda: `chat()`

Główna metoda do komunikacji z modelem LLM.

#### Sygnatura

```typescript
async chat<T = unknown>(
  options: ChatOptions
): Promise<ChatResponse<T>>
```

#### Parametry

```typescript
interface ChatOptions {
  systemMessage: string;              // Komunikat systemowy (instrukcje dla modelu)
  userMessage: string;                // Komunikat użytkownika (dane wejściowe)
  model?: string;                     // Opcjonalna nazwa modelu (override default)
  temperature?: number;               // Opcjonalna temperatura (override default)
  maxTokens?: number;                 // Opcjonalny max tokens (override default)
  topP?: number;                      // Opcjonalny top_p sampling
  responseFormat?: ResponseFormat;    // Opcjonalny format odpowiedzi (JSON Schema)
}

interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;                     // Nazwa schematu (lowercase, snake_case)
    strict: boolean;                  // Strict mode (zawsze true)
    schema: JSONSchema;               // JSON Schema definicja
  };
}

interface JSONSchema {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
  additionalProperties: boolean;
}
```

#### Zwracana wartość

```typescript
interface ChatResponse<T = unknown> {
  success: boolean;                   // Czy zapytanie zakończyło się sukcesem
  data?: T;                           // Sparsowane dane (jeśli responseFormat podany)
  rawContent?: string;                // Surowa treść odpowiedzi
  model: string;                      // Użyty model
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  error?: {
    message: string;
    code?: string;
    statusCode?: number;
  };
}
```

#### Przykład użycia

```typescript
// Przykład 1: Kategoryzacja składników (JSON Schema response)
const response = await service.chat<{ [key: string]: string }>({
  systemMessage: 'Jesteś ekspertem kulinarnym. Kategoryzuj składniki do kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne.',
  userMessage: 'Kategoryzuj składniki: 1. mleko, 2. pomidor, 3. kurczak',
  model: 'openai/gpt-4o-mini',
  temperature: 0,
  responseFormat: {
    type: 'json_schema',
    json_schema: {
      name: 'ingredient_categories',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          categories: {
            type: 'object',
            additionalProperties: {
              type: 'string',
              enum: ['Nabiał', 'Warzywa', 'Owoce', 'Mięso', 'Pieczywo', 'Przyprawy', 'Inne']
            }
          }
        },
        required: ['categories'],
        additionalProperties: false
      }
    }
  }
});

if (response.success) {
  console.log(response.data); // { "1": "Nabiał", "2": "Warzywa", "3": "Mięso" }
} else {
  console.error(response.error);
}

// Przykład 2: Proste zapytanie bez structured output
const simpleResponse = await service.chat({
  systemMessage: 'Jesteś pomocnym asystentem kulinarnym.',
  userMessage: 'Zaproponuj szybki przepis na obiad.',
  temperature: 0.7
});
```

### 3.2 Metoda: `categorizeIngredients()`

Wyspecjalizowana metoda do kategoryzacji składników (wrapper nad `chat()`).

#### Sygnatura

```typescript
async categorizeIngredients(
  ingredients: Array<{ id: string; name: string }>
): Promise<CategorizeIngredientsResponse>
```

#### Parametry

```typescript
interface CategorizeIngredientsResponse {
  success: boolean;
  categories: Record<string, string>; // { ingredientId: category }
  error?: {
    message: string;
    failedIngredients?: string[];
  };
}
```

#### Implementacja

```typescript
async categorizeIngredients(
  ingredients: Array<{ id: string; name: string }>
): Promise<CategorizeIngredientsResponse> {
  // 1. Walidacja: max 100 składników
  if (ingredients.length > 100) {
    return {
      success: false,
      categories: {},
      error: {
        message: 'Przekroczono limit 100 składników',
        failedIngredients: ingredients.map(i => i.id)
      }
    };
  }

  // 2. Przygotowanie komunikatu użytkownika
  const userMessage = ingredients
    .map((ing, idx) => `${idx + 1}. ${ing.name}`)
    .join('\n');

  // 3. Wywołanie chat() z response_format
  const response = await this.chat<{ categories: Record<string, string> }>({
    systemMessage: 'Jesteś ekspertem kulinarnym. Kategoryzuj składniki do kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne. Zwróć obiekt JSON z kluczami będącymi numerami składników (jako stringi) i wartościami będącymi nazwami kategorii.',
    userMessage: `Kategoryzuj następujące składniki:\n${userMessage}`,
    model: this.config.defaultModel,
    temperature: 0,
    responseFormat: {
      type: 'json_schema',
      json_schema: {
        name: 'ingredient_categories',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            categories: {
              type: 'object',
              additionalProperties: {
                type: 'string',
                enum: ['Nabiał', 'Warzywa', 'Owoce', 'Mięso', 'Pieczywo', 'Przyprawy', 'Inne']
              }
            }
          },
          required: ['categories'],
          additionalProperties: false
        }
      }
    }
  });

  // 4. Przetworzenie odpowiedzi
  if (!response.success || !response.data?.categories) {
    return {
      success: false,
      categories: {},
      error: {
        message: response.error?.message || 'Nieznany błąd kategoryzacji',
        failedIngredients: ingredients.map(i => i.id)
      }
    };
  }

  // 5. Mapowanie indeksów na ID składników
  const categories: Record<string, string> = {};
  ingredients.forEach((ing, idx) => {
    const category = response.data.categories[(idx + 1).toString()];
    categories[ing.id] = category || 'Inne'; // Fallback
  });

  return {
    success: true,
    categories
  };
}
```

### 3.3 Metoda: `testConnection()`

Testuje połączenie z OpenRouter API.

#### Sygnatura

```typescript
async testConnection(): Promise<boolean>
```

#### Przykład

```typescript
const isConnected = await service.testConnection();
if (!isConnected) {
  console.error('Nie można połączyć się z OpenRouter API');
}
```

---

## 4. Prywatne metody i pola

### 4.1 Pole: `config`

```typescript
private readonly config: OpenRouterConfig;
```

### 4.2 Pole: `httpClient`

```typescript
private readonly httpClient: AxiosInstance; // lub fetch wrapper
```

### 4.3 Metoda: `executeWithRetry()`

Wykonuje zapytanie HTTP z mechanizmem retry i exponential backoff.

#### Sygnatura

```typescript
private async executeWithRetry<T>(
  requestFn: () => Promise<T>,
  attempt: number = 0
): Promise<T>
```

#### Implementacja (pseudokod)

```typescript
private async executeWithRetry<T>(
  requestFn: () => Promise<T>,
  attempt: number = 0
): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    // Jeśli przekroczono maxRetries, rzuć błąd
    if (attempt >= this.config.maxRetries) {
      throw error;
    }

    // Sprawdź czy błąd jest retryable (429, 500, 502, 503, 504, timeout)
    if (!this.isRetryableError(error)) {
      throw error;
    }

    // Exponential backoff: retryDelay * 2^attempt
    const delay = this.config.retryDelay * Math.pow(2, attempt);
    await this.sleep(delay);

    // Retry
    return this.executeWithRetry(requestFn, attempt + 1);
  }
}
```

### 4.4 Metoda: `isRetryableError()`

Sprawdza czy błąd jest retryable.

```typescript
private isRetryableError(error: any): boolean {
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  const statusCode = error.response?.status || error.statusCode;

  return (
    retryableStatusCodes.includes(statusCode) ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT'
  );
}
```

### 4.5 Metoda: `sleep()`

```typescript
private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 4.6 Metoda: `makeRequest()`

Wykonuje faktyczne zapytanie HTTP do OpenRouter API.

```typescript
private async makeRequest(
  systemMessage: string,
  userMessage: string,
  options: Partial<ChatOptions>
): Promise<OpenRouterAPIResponse> {
  const payload = {
    model: options.model || this.config.defaultModel,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ],
    temperature: options.temperature ?? this.config.defaultTemperature,
    max_tokens: options.maxTokens ?? this.config.defaultMaxTokens,
    top_p: options.topP,
    response_format: options.responseFormat
  };

  const response = await this.httpClient.post('/chat/completions', payload, {
    headers: {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://shopmate.app', // Opcjonalne (dla credits)
      'X-Title': 'ShopMate'                   // Opcjonalne
    },
    timeout: this.config.timeout
  });

  return response.data;
}
```

### 4.7 Metoda: `parseResponse()`

Parsuje odpowiedź z OpenRouter API.

```typescript
private parseResponse<T>(
  apiResponse: OpenRouterAPIResponse,
  responseFormat?: ResponseFormat
): { data?: T; rawContent: string } {
  const rawContent = apiResponse.choices[0]?.message?.content || '';

  // Jeśli nie ma response_format, zwróć surową treść
  if (!responseFormat) {
    return { rawContent };
  }

  // Parsowanie JSON
  try {
    const data = JSON.parse(rawContent) as T;
    return { data, rawContent };
  } catch (error) {
    throw new Error(`Nie można sparsować odpowiedzi JSON: ${error.message}`);
  }
}
```

### 4.8 Metoda: `validateResponseAgainstSchema()`

Waliduje odpowiedź zgodnie ze schematem (opcjonalna walidacja po stronie klienta).

```typescript
private validateResponseAgainstSchema(
  data: any,
  schema: JSONSchema
): { valid: boolean; errors?: string[] } {
  // Implementacja z użyciem biblioteki jak ajv
  // Lub uproszczona walidacja jeśli strict: true w OpenRouter
  // W przypadku strict: true, OpenRouter gwarantuje zgodność
  return { valid: true };
}
```

---

## 5. Obsługa błędów

### 5.1 Scenariusze błędów

#### Błąd 1: Brak klucza API
**Kod:** `MISSING_API_KEY`
**Komunikat:** `"Brak klucza API OpenRouter. Ustaw zmienną środowiskową OPENROUTER_API_KEY."`
**Akcja:** Rzuć błąd w konstruktorze.

#### Błąd 2: Nieprawidłowa konfiguracja
**Kod:** `INVALID_CONFIG`
**Komunikat:** `"Nieprawidłowa konfiguracja: {szczegóły}"`
**Akcja:** Rzuć błąd w konstruktorze.

#### Błąd 3: Timeout
**Kod:** `TIMEOUT`
**Komunikat:** `"Przekroczono limit czasu zapytania ({timeout}ms)"`
**Akcja:** Retry (jeśli attempt < maxRetries), w przeciwnym razie zwróć błąd.

#### Błąd 4: Rate limit (429)
**Kod:** `RATE_LIMIT_EXCEEDED`
**Komunikat:** `"Przekroczono limit zapytań. Spróbuj ponownie za {retry-after}s."`
**Akcja:** Retry z exponential backoff.

#### Błąd 5: Błąd serwera (500, 502, 503, 504)
**Kod:** `SERVER_ERROR`
**Komunikat:** `"Błąd serwera OpenRouter. Kod: {statusCode}"`
**Akcja:** Retry z exponential backoff.

#### Błąd 6: Nieprawidłowe zapytanie (400)
**Kod:** `INVALID_REQUEST`
**Komunikat:** `"Nieprawidłowe zapytanie: {szczegóły z API}"`
**Akcja:** Nie retry, zwróć błąd.

#### Błąd 7: Brak autoryzacji (401)
**Kod:** `UNAUTHORIZED`
**Komunikat:** `"Nieprawidłowy klucz API OpenRouter"`
**Akcja:** Nie retry, zwróć błąd.

#### Błąd 8: Brak dostępu do modelu (403)
**Kod:** `FORBIDDEN`
**Komunikat:** `"Brak dostępu do modelu {model}"`
**Akcja:** Nie retry, zwróć błąd.

#### Błąd 9: Model nie znaleziony (404)
**Kod:** `MODEL_NOT_FOUND`
**Komunikat:** `"Model {model} nie istnieje"`
**Akcja:** Nie retry, zwróć błąd.

#### Błąd 10: Błąd parsowania odpowiedzi
**Kod:** `PARSE_ERROR`
**Komunikat:** `"Nie można sparsować odpowiedzi JSON"`
**Akcja:** Nie retry, zwróć błąd.

#### Błąd 11: Przekroczono limit składników
**Kod:** `TOO_MANY_INGREDIENTS`
**Komunikat:** `"Przekroczono limit 100 składników (otrzymano: {count})"`
**Akcja:** Zwróć błąd bez wywołania API.

### 5.2 Struktura błędu

```typescript
class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public originalError?: any
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}
```

### 5.3 Przykład obsługi

```typescript
try {
  const response = await service.chat({
    systemMessage: '...',
    userMessage: '...'
  });
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.error(`[${error.code}] ${error.message}`);

    if (error.retryable) {
      // Zaloguj do monitoringu
      Sentry.captureException(error);
    }

    // Obsługa specyficznych kodów błędów
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Powiadom admina o nieprawidłowym kluczu API
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // Implementuj circuit breaker lub queue
        break;
      default:
        // Fallback do "Inne" w przypadku kategoryzacji
        break;
    }
  }
}
```

---

## 6. Kwestie bezpieczeństwa

### 6.1 Zarządzanie kluczem API

**Problem:** Klucz API nie może być eksponowany w kodzie klienta (browser).

**Rozwiązanie:**
1. Przechowuj klucz API w zmiennej środowiskowej: `OPENROUTER_API_KEY`
2. Używaj klucza TYLKO w server-side code:
   - Astro API endpoints (`src/pages/api/*`)
   - Supabase Edge Functions (jeśli używane)
   - Middleware (server-side only)
3. NIGDY nie wysyłaj klucza do browsera
4. W Vercel: dodaj `OPENROUTER_API_KEY` w Settings → Environment Variables
5. Używaj różnych kluczy dla development/staging/production

### 6.2 Walidacja danych wejściowych

**Problem:** User input może zawierać złośliwe dane (prompt injection).

**Rozwiązanie:**
1. Waliduj długość `userMessage` (max 10000 znaków)
2. Waliduj długość `systemMessage` (max 5000 znaków)
3. Sanityzuj input:
   ```typescript
   private sanitizeInput(input: string): string {
     return input
       .trim()
       .replace(/[\x00-\x1F\x7F]/g, '') // Usuń control characters
       .slice(0, 10000); // Limit długości
   }
   ```
4. Używaj Zod schemas dla walidacji request body w API endpoints

### 6.3 Rate limiting

**Problem:** Użytkownicy mogą spamować API, generując wysokie koszty.

**Rozwiązanie:**
1. Implementuj rate limiting w Astro middleware:
   ```typescript
   // src/middleware/rate-limit.ts
   const rateLimiter = new Map<string, { count: number; resetAt: number }>();

   export function rateLimit(userId: string, limit: number = 10, windowMs: number = 60000) {
     const now = Date.now();
     const userLimit = rateLimiter.get(userId);

     if (!userLimit || now > userLimit.resetAt) {
       rateLimiter.set(userId, { count: 1, resetAt: now + windowMs });
       return true;
     }

     if (userLimit.count >= limit) {
       return false;
     }

     userLimit.count++;
     return true;
   }
   ```
2. Supabase RLS: Dodaj constraint na liczbę shopping lists per user per day
3. Implementuj exponential backoff dla retry (już zrobione w `executeWithRetry()`)

### 6.4 Logowanie wrażliwych danych

**Problem:** Logi mogą zawierać wrażliwe dane (API keys, user data).

**Rozwiązanie:**
1. NIGDY nie loguj klucza API
2. Maskuj wrażliwe dane w logach:
   ```typescript
   console.log(`API Key: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
   ```
3. Nie loguj pełnych response'ów (mogą zawierać user data)
4. Używaj structured logging (Sentry) z poziomami (debug, info, warning, error)

### 6.5 CORS i Content Security Policy

**Problem:** API endpoints mogą być wywoływane z niepowołanych źródeł.

**Rozwiązanie:**
1. W Astro API endpoints sprawdzaj `Origin` header:
   ```typescript
   const allowedOrigins = ['https://shopmate.app', 'http://localhost:3000'];
   const origin = request.headers.get('origin');

   if (!allowedOrigins.includes(origin)) {
     return new Response('Forbidden', { status: 403 });
   }
   ```
2. Dodaj CSP headers w `astro.config.mjs`:
   ```typescript
   headers: {
     'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://openrouter.ai"
   }
   ```

### 6.6 Audyt bezpieczeństwa

**Checklist:**
- [ ] Klucz API przechowywany w zmiennych środowiskowych
- [ ] Klucz API używany TYLKO w server-side code
- [ ] Walidacja input z użyciem Zod schemas
- [ ] Rate limiting zaimplementowane
- [ ] Sanityzacja user input
- [ ] Maskowanie wrażliwych danych w logach
- [ ] CORS configuration
- [ ] Error handling bez eksponowania szczegółów wewnętrznych
- [ ] HTTPS enforced (Vercel automatic)
- [ ] Dependencies up-to-date (`npm audit`)

---

## 7. Plan wdrożenia krok po kroku

### Krok 1: Setup projektu i dependencies

**Zadania:**
1. Zainstaluj wymagane pakiety:
   ```bash
   npm install axios zod
   npm install --save-dev @types/node
   ```
2. Dodaj zmienną środowiskową do `.env`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   ```
3. Dodaj do `.env.example`:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```
4. Dodaj do `import.meta.env` types w `src/env.d.ts`:
   ```typescript
   /// <reference types="astro/client" />
   interface ImportMetaEnv {
     readonly OPENROUTER_API_KEY: string;
     // ... inne env vars
   }
   ```

**Weryfikacja:**
- [ ] Pakiety zainstalowane
- [ ] `.env.local` utworzony z kluczem API
- [ ] Types dla env vars zaktualizowane

---

### Krok 2: Utworzenie types i interfaces

**Lokalizacja:** `src/lib/services/openrouter/types.ts`

**Kod:**
```typescript
// src/lib/services/openrouter/types.ts

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  defaultTemperature: number;
  defaultMaxTokens: number;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
  additionalProperties: boolean;
}

export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JSONSchema;
  };
}

export interface ChatOptions {
  systemMessage: string;
  userMessage: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  responseFormat?: ResponseFormat;
}

export interface ChatResponse<T = unknown> {
  success: boolean;
  data?: T;
  rawContent?: string;
  model: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  error?: {
    message: string;
    code?: string;
    statusCode?: number;
  };
}

export interface CategorizeIngredientsResponse {
  success: boolean;
  categories: Record<string, string>;
  error?: {
    message: string;
    failedIngredients?: string[];
  };
}

export interface OpenRouterAPIResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public originalError?: any
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}
```

**Weryfikacja:**
- [ ] Plik utworzony z wszystkimi interfejsami
- [ ] TypeScript kompiluje się bez błędów

---

### Krok 3: Utworzenie klasy OpenRouterService - konstruktor i pola

**Lokalizacja:** `src/lib/services/openrouter/openrouter.service.ts`

**Kod:**
```typescript
// src/lib/services/openrouter/openrouter.service.ts

import axios, { AxiosInstance } from 'axios';
import type {
  OpenRouterConfig,
  ChatOptions,
  ChatResponse,
  CategorizeIngredientsResponse,
  OpenRouterAPIResponse
} from './types';
import { OpenRouterError } from './types';

export class OpenRouterService {
  private readonly config: OpenRouterConfig;
  private readonly httpClient: AxiosInstance;

  constructor(config?: Partial<OpenRouterConfig>) {
    // Domyślna konfiguracja
    const defaultConfig: OpenRouterConfig = {
      apiKey: import.meta.env.OPENROUTER_API_KEY || '',
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'openai/gpt-4o-mini',
      timeout: 10000,
      maxRetries: 2,
      retryDelay: 1000,
      defaultTemperature: 0,
      defaultMaxTokens: 500
    };

    // Merge z custom config
    this.config = { ...defaultConfig, ...config };

    // Walidacja konfiguracji
    this.validateConfig();

    // Inicjalizacja HTTP client
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://shopmate.app',
        'X-Title': 'ShopMate'
      }
    });
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new OpenRouterError(
        'Brak klucza API OpenRouter. Ustaw zmienną środowiskową OPENROUTER_API_KEY.',
        'MISSING_API_KEY'
      );
    }

    if (this.config.timeout <= 0) {
      throw new OpenRouterError(
        `Timeout musi być większy od 0 (otrzymano: ${this.config.timeout})`,
        'INVALID_CONFIG'
      );
    }

    if (this.config.maxRetries < 0) {
      throw new OpenRouterError(
        `maxRetries musi być >= 0 (otrzymano: ${this.config.maxRetries})`,
        'INVALID_CONFIG'
      );
    }

    if (this.config.retryDelay <= 0) {
      throw new OpenRouterError(
        `retryDelay musi być > 0 (otrzymano: ${this.config.retryDelay})`,
        'INVALID_CONFIG'
      );
    }

    if (this.config.defaultTemperature < 0 || this.config.defaultTemperature > 2) {
      throw new OpenRouterError(
        `defaultTemperature musi być w zakresie [0, 2] (otrzymano: ${this.config.defaultTemperature})`,
        'INVALID_CONFIG'
      );
    }

    if (this.config.defaultMaxTokens <= 0) {
      throw new OpenRouterError(
        `defaultMaxTokens musi być > 0 (otrzymano: ${this.config.defaultMaxTokens})`,
        'INVALID_CONFIG'
      );
    }
  }

  // Metody publiczne i prywatne będą dodane w kolejnych krokach
}
```

**Weryfikacja:**
- [ ] Konstruktor waliduje konfigurację
- [ ] Rzuca odpowiednie błędy dla nieprawidłowej konfiguracji
- [ ] HTTP client inicjalizowany z poprawnymi headerami

---

### Krok 4: Implementacja metod pomocniczych (private)

**Kod (dodaj do `openrouter.service.ts`):**
```typescript
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRetryableError(error: any): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const statusCode = error.response?.status || error.statusCode;

    return (
      retryableStatusCodes.includes(statusCode) ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET'
    );
  }

  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      // Jeśli przekroczono maxRetries, rzuć błąd
      if (attempt >= this.config.maxRetries) {
        throw this.normalizeError(error);
      }

      // Sprawdź czy błąd jest retryable
      if (!this.isRetryableError(error)) {
        throw this.normalizeError(error);
      }

      // Exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, attempt);
      console.warn(`[OpenRouter] Retry attempt ${attempt + 1}/${this.config.maxRetries} po ${delay}ms`);
      await this.sleep(delay);

      // Retry
      return this.executeWithRetry(requestFn, attempt + 1);
    }
  }

  private normalizeError(error: any): OpenRouterError {
    const statusCode = error.response?.status;
    const message = error.response?.data?.error?.message || error.message || 'Nieznany błąd';

    // Mapowanie statusów na kody błędów
    switch (statusCode) {
      case 400:
        return new OpenRouterError(
          `Nieprawidłowe zapytanie: ${message}`,
          'INVALID_REQUEST',
          400,
          false,
          error
        );
      case 401:
        return new OpenRouterError(
          'Nieprawidłowy klucz API OpenRouter',
          'UNAUTHORIZED',
          401,
          false,
          error
        );
      case 403:
        return new OpenRouterError(
          `Brak dostępu: ${message}`,
          'FORBIDDEN',
          403,
          false,
          error
        );
      case 404:
        return new OpenRouterError(
          `Model nie znaleziony: ${message}`,
          'MODEL_NOT_FOUND',
          404,
          false,
          error
        );
      case 429:
        return new OpenRouterError(
          'Przekroczono limit zapytań. Spróbuj ponownie później.',
          'RATE_LIMIT_EXCEEDED',
          429,
          true,
          error
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new OpenRouterError(
          `Błąd serwera OpenRouter (${statusCode})`,
          'SERVER_ERROR',
          statusCode,
          true,
          error
        );
      default:
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          return new OpenRouterError(
            `Przekroczono limit czasu zapytania (${this.config.timeout}ms)`,
            'TIMEOUT',
            undefined,
            true,
            error
          );
        }
        return new OpenRouterError(
          message,
          'UNKNOWN_ERROR',
          statusCode,
          false,
          error
        );
    }
  }

  private sanitizeInput(input: string, maxLength: number = 10000): string {
    return input
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Usuń control characters
      .slice(0, maxLength);
  }

  private parseResponse<T>(
    apiResponse: OpenRouterAPIResponse,
    responseFormat?: ResponseFormat
  ): { data?: T; rawContent: string } {
    const rawContent = apiResponse.choices[0]?.message?.content || '';

    // Jeśli nie ma response_format, zwróć surową treść
    if (!responseFormat) {
      return { rawContent };
    }

    // Parsowanie JSON
    try {
      const data = JSON.parse(rawContent) as T;
      return { data, rawContent };
    } catch (error: any) {
      throw new OpenRouterError(
        `Nie można sparsować odpowiedzi JSON: ${error.message}`,
        'PARSE_ERROR',
        undefined,
        false,
        error
      );
    }
  }
```

**Weryfikacja:**
- [ ] Metody pomocnicze działają poprawnie
- [ ] Exponential backoff działa (test ręczny z timeout)
- [ ] Normalizacja błędów mapuje status codes na odpowiednie kody

---

### Krok 5: Implementacja metody `chat()`

**Kod (dodaj do `openrouter.service.ts`):**
```typescript
  async chat<T = unknown>(options: ChatOptions): Promise<ChatResponse<T>> {
    try {
      // Sanityzacja inputów
      const systemMessage = this.sanitizeInput(options.systemMessage, 5000);
      const userMessage = this.sanitizeInput(options.userMessage, 10000);

      // Przygotowanie payload
      const payload: any = {
        model: options.model || this.config.defaultModel,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: options.temperature ?? this.config.defaultTemperature,
        max_tokens: options.maxTokens ?? this.config.defaultMaxTokens
      };

      // Dodaj opcjonalne parametry
      if (options.topP !== undefined) {
        payload.top_p = options.topP;
      }

      if (options.responseFormat) {
        payload.response_format = options.responseFormat;
      }

      // Wykonaj zapytanie z retry
      const apiResponse = await this.executeWithRetry<OpenRouterAPIResponse>(
        async () => {
          const response = await this.httpClient.post('/chat/completions', payload);
          return response.data;
        }
      );

      // Parsuj odpowiedź
      const { data, rawContent } = this.parseResponse<T>(apiResponse, options.responseFormat);

      // Zwróć sukces
      return {
        success: true,
        data,
        rawContent,
        model: apiResponse.model,
        tokensUsed: {
          prompt: apiResponse.usage.prompt_tokens,
          completion: apiResponse.usage.completion_tokens,
          total: apiResponse.usage.total_tokens
        }
      };
    } catch (error: any) {
      // Obsługa błędów
      const normalizedError = error instanceof OpenRouterError
        ? error
        : this.normalizeError(error);

      return {
        success: false,
        model: options.model || this.config.defaultModel,
        error: {
          message: normalizedError.message,
          code: normalizedError.code,
          statusCode: normalizedError.statusCode
        }
      };
    }
  }
```

**Weryfikacja:**
- [ ] Metoda `chat()` wysyła zapytania do OpenRouter API
- [ ] Retry działa dla błędów retryable
- [ ] Parsowanie JSON działa dla structured outputs
- [ ] Error handling zwraca odpowiednie błędy

**Test ręczny:**
```typescript
const service = new OpenRouterService();

const response = await service.chat({
  systemMessage: 'Jesteś pomocnym asystentem.',
  userMessage: 'Powiedz "test"',
  temperature: 0
});

console.log(response);
```

---

### Krok 6: Implementacja metody `categorizeIngredients()`

**Kod (dodaj do `openrouter.service.ts`):**
```typescript
  async categorizeIngredients(
    ingredients: Array<{ id: string; name: string }>
  ): Promise<CategorizeIngredientsResponse> {
    // Walidacja: max 100 składników
    if (ingredients.length === 0) {
      return {
        success: false,
        categories: {},
        error: {
          message: 'Lista składników jest pusta',
          failedIngredients: []
        }
      };
    }

    if (ingredients.length > 100) {
      return {
        success: false,
        categories: {},
        error: {
          message: `Przekroczono limit 100 składników (otrzymano: ${ingredients.length})`,
          failedIngredients: ingredients.map(i => i.id)
        }
      };
    }

    // Przygotowanie komunikatu użytkownika
    const userMessage = ingredients
      .map((ing, idx) => `${idx + 1}. ${ing.name}`)
      .join('\n');

    // Definicja response format
    const responseFormat: ResponseFormat = {
      type: 'json_schema',
      json_schema: {
        name: 'ingredient_categories',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            categories: {
              type: 'object',
              additionalProperties: {
                type: 'string',
                enum: ['Nabiał', 'Warzywa', 'Owoce', 'Mięso', 'Pieczywo', 'Przyprawy', 'Inne']
              }
            }
          },
          required: ['categories'],
          additionalProperties: false
        }
      }
    };

    // Wywołanie chat()
    const response = await this.chat<{ categories: Record<string, string> }>({
      systemMessage:
        'Jesteś ekspertem kulinarnym. Twoim zadaniem jest kategoryzowanie składników ' +
        'do jednej z następujących kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne. ' +
        'Zwróć obiekt JSON z kluczami będącymi numerami składników (jako stringi: "1", "2", itd.) ' +
        'i wartościami będącymi nazwami kategorii.',
      userMessage: `Kategoryzuj następujące składniki:\n${userMessage}`,
      model: this.config.defaultModel,
      temperature: 0,
      responseFormat
    });

    // Obsługa błędu
    if (!response.success || !response.data?.categories) {
      return {
        success: false,
        categories: {},
        error: {
          message: response.error?.message || 'Nie udało się skategoryzować składników',
          failedIngredients: ingredients.map(i => i.id)
        }
      };
    }

    // Mapowanie indeksów na ID składników
    const categories: Record<string, string> = {};
    const validCategories = ['Nabiał', 'Warzywa', 'Owoce', 'Mięso', 'Pieczywo', 'Przyprawy', 'Inne'];

    ingredients.forEach((ing, idx) => {
      const category = response.data!.categories[(idx + 1).toString()];

      // Fallback do "Inne" jeśli kategoria nieprawidłowa
      categories[ing.id] = validCategories.includes(category) ? category : 'Inne';
    });

    return {
      success: true,
      categories
    };
  }
```

**Weryfikacja:**
- [ ] Metoda kategoryzuje składniki poprawnie
- [ ] Fallback do "Inne" działa
- [ ] Walidacja limitu 100 składników działa

**Test ręczny:**
```typescript
const response = await service.categorizeIngredients([
  { id: '1', name: 'mleko' },
  { id: '2', name: 'pomidor' },
  { id: '3', name: 'kurczak' }
]);

console.log(response);
// Expected: { success: true, categories: { '1': 'Nabiał', '2': 'Warzywa', '3': 'Mięso' } }
```

---

### Krok 7: Implementacja metody `testConnection()`

**Kod (dodaj do `openrouter.service.ts`):**
```typescript
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chat({
        systemMessage: 'Odpowiedz jednym słowem "ok"',
        userMessage: 'test',
        maxTokens: 10
      });

      return response.success && response.rawContent?.toLowerCase().includes('ok');
    } catch (error) {
      console.error('[OpenRouter] Test connection failed:', error);
      return false;
    }
  }
```

**Weryfikacja:**
- [ ] Metoda zwraca `true` dla prawidłowego połączenia
- [ ] Metoda zwraca `false` dla błędnej konfiguracji

---

### Krok 8: Utworzenie API endpoint dla kategoryzacji

**Lokalizacja:** `src/pages/api/ai/categorize-ingredients.ts`

**Kod:**
```typescript
// src/pages/api/ai/categorize-ingredients.ts

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { OpenRouterService } from '@/lib/services/openrouter/openrouter.service';

// Zod schema dla request body
const requestSchema = z.object({
  ingredients: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100)
    })
  ).min(1).max(100)
});

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Sprawdź autentykację
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parsuj i waliduj request body
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: validation.error.flatten()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { ingredients } = validation.data;

    // 3. Wywołaj OpenRouterService
    const service = new OpenRouterService();
    const result = await service.categorizeIngredients(ingredients);

    // 4. Zwróć odpowiedź
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: result.error?.message || 'Categorization failed',
          failedIngredients: result.error?.failedIngredients
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        categories: result.categories
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[API] Categorize ingredients error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Weryfikacja:**
- [ ] Endpoint wymaga autentykacji
- [ ] Walidacja request body działa
- [ ] Endpoint zwraca poprawne kategorie
- [ ] Error handling działa

**Test endpoint:**
```bash
curl -X POST http://localhost:3000/api/ai/categorize-ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "ingredients": [
      { "id": "123e4567-e89b-12d3-a456-426614174000", "name": "mleko" },
      { "id": "123e4567-e89b-12d3-a456-426614174001", "name": "pomidor" }
    ]
  }'
```

---

### Krok 9: Integracja z istniejącym workflow

**Lokalizacja:** `src/pages/api/shopping-lists/generate.ts`

**Modyfikacja istniejącego kodu:**
```typescript
// src/pages/api/shopping-lists/generate.ts

import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/services/openrouter/openrouter.service';

export const POST: APIRoute = async ({ request, locals }) => {
  // ... (istniejący kod autentykacji i walidacji)

  try {
    // 1. Pobierz przepisy i składniki z bazy danych
    // ... (istniejący kod)

    // 2. Agreguj składniki
    const aggregatedIngredients = aggregateIngredients(allIngredients);

    // 3. Kategoryzuj składniki używając OpenRouter
    const service = new OpenRouterService();
    const ingredientsToCategori ze = aggregatedIngredients.map(ing => ({
      id: ing.id,
      name: ing.name
    }));

    const categorizationResult = await service.categorizeIngredients(ingredientsToCategori ze);

    // 4. Przypisz kategorie do składników (z fallback do "Inne")
    const categorizedIngredients = aggregatedIngredients.map(ing => ({
      ...ing,
      category: categorizationResult.categories[ing.id] || 'Inne'
    }));

    // 5. Zapisz do bazy danych
    // ... (istniejący kod zapisu do shopping_list_items)

    return new Response(
      JSON.stringify({
        success: true,
        shoppingListId: shoppingList.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[API] Generate shopping list error:', error);

    // Fallback: wszystkie składniki → "Inne"
    // ... (istniejący kod fallback)
  }
};
```

**Weryfikacja:**
- [ ] Integracja z istniejącym workflow działa
- [ ] Fallback do "Inne" działa w przypadku błędu
- [ ] Shopping list generuje się poprawnie z kategoriami

---

### Krok 10: Testy jednostkowe

**Lokalizacja:** `src/lib/services/openrouter/__tests__/openrouter.service.test.ts`

**Kod (przykładowe testy z vitest):**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenRouterService } from '../openrouter.service';
import { OpenRouterError } from '../types';

describe('OpenRouterService', () => {
  beforeEach(() => {
    // Mock environment variable
    vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key');
  });

  describe('Constructor', () => {
    it('should throw error when API key is missing', () => {
      vi.stubEnv('OPENROUTER_API_KEY', '');

      expect(() => new OpenRouterService()).toThrow(OpenRouterError);
      expect(() => new OpenRouterService()).toThrow('Brak klucza API');
    });

    it('should validate timeout', () => {
      expect(() => new OpenRouterService({ timeout: -1 })).toThrow('Timeout musi być większy od 0');
    });

    it('should validate temperature range', () => {
      expect(() => new OpenRouterService({ defaultTemperature: 3 })).toThrow('w zakresie [0, 2]');
    });
  });

  describe('categorizeIngredients', () => {
    it('should return error for empty ingredients', async () => {
      const service = new OpenRouterService();
      const result = await service.categorizeIngredients([]);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('pusta');
    });

    it('should return error for > 100 ingredients', async () => {
      const service = new OpenRouterService();
      const ingredients = Array.from({ length: 101 }, (_, i) => ({
        id: `${i}`,
        name: `ingredient${i}`
      }));

      const result = await service.categorizeIngredients(ingredients);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('limit 100');
    });

    // Mock test dla sukcesu
    it('should categorize ingredients successfully', async () => {
      // Mock axios response
      // ... (implementation z vi.mock)
    });
  });
});
```

**Weryfikacja:**
- [ ] Testy jednostkowe dla konstruktora przechodzą
- [ ] Testy dla walidacji przechodzą
- [ ] Testy dla `categorizeIngredients()` przechodzą

**Uruchomienie testów:**
```bash
npm run test
```

---

### Krok 11: Dokumentacja API

**Lokalizacja:** `src/lib/services/openrouter/README.md`

**Kod:**
```markdown
# OpenRouter Service

Service dla komunikacji z OpenRouter API w projekcie ShopMate.

## Instalacja

```bash
npm install
```

## Konfiguracja

Dodaj klucz API do `.env.local`:

```
OPENROUTER_API_KEY=sk-or-v1-...
```

## Użycie

### Podstawowe użycie

```typescript
import { OpenRouterService } from '@/lib/services/openrouter/openrouter.service';

const service = new OpenRouterService();

const response = await service.chat({
  systemMessage: 'Jesteś pomocnym asystentem.',
  userMessage: 'Powiedz coś zabawnego.',
  temperature: 0.7
});

console.log(response.rawContent);
```

### Kategoryzacja składników

```typescript
const result = await service.categorizeIngredients([
  { id: '1', name: 'mleko' },
  { id: '2', name: 'pomidor' }
]);

console.log(result.categories);
// { '1': 'Nabiał', '2': 'Warzywa' }
```

### Structured Output (JSON Schema)

```typescript
const response = await service.chat<{ answer: string }>({
  systemMessage: 'Odpowiadaj w formacie JSON.',
  userMessage: 'Jaka jest stolica Polski?',
  responseFormat: {
    type: 'json_schema',
    json_schema: {
      name: 'answer_format',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' }
        },
        required: ['answer'],
        additionalProperties: false
      }
    }
  }
});

console.log(response.data?.answer); // "Warszawa"
```

## API Reference

Pełna dokumentacja znajduje się w pliku implementacji.
```

**Weryfikacja:**
- [ ] Dokumentacja jest jasna i kompletna
- [ ] Przykłady działają

---

### Krok 12: Monitoring i logowanie (opcjonalne)

**Integracja z Sentry:**

```typescript
// src/lib/services/openrouter/openrouter.service.ts

import * as Sentry from '@sentry/astro';

// W metodzie chat(), dodaj logowanie błędów
catch (error: any) {
  const normalizedError = error instanceof OpenRouterError
    ? error
    : this.normalizeError(error);

  // Loguj do Sentry tylko critical errors
  if (!normalizedError.retryable) {
    Sentry.captureException(normalizedError, {
      tags: {
        service: 'openrouter',
        model: options.model || this.config.defaultModel
      },
      extra: {
        systemMessage: options.systemMessage.slice(0, 200),
        userMessage: options.userMessage.slice(0, 200)
      }
    });
  }

  // ...
}
```

**Weryfikacja:**
- [ ] Błędy są logowane do Sentry
- [ ] Nie logujemy wrażliwych danych (API keys, pełne messages)

---

### Krok 13: Deployment

**Vercel Configuration:**

1. Dodaj environment variable w Vercel Dashboard:
   - `OPENROUTER_API_KEY=sk-or-v1-...`

2. Deploy:
   ```bash
   git add .
   git commit -m "feat: add OpenRouter service integration"
   git push origin main
   ```

3. Vercel automatycznie wdroży zmiany.

**Weryfikacja:**
- [ ] Aplikacja deployuje się bez błędów
- [ ] API endpoint działa na production
- [ ] Kategoryzacja składników działa end-to-end

---

## Podsumowanie

Plan implementacji obejmuje:

1. ✅ Setup projektu i dependencies
2. ✅ Utworzenie types i interfaces
3. ✅ Implementacja konstruktora i walidacji
4. ✅ Implementacja metod pomocniczych (retry, error handling)
5. ✅ Implementacja metody `chat()`
6. ✅ Implementacja metody `categorizeIngredients()`
7. ✅ Implementacja metody `testConnection()`
8. ✅ Utworzenie API endpoint
9. ✅ Integracja z istniejącym workflow
10. ✅ Testy jednostkowe
11. ✅ Dokumentacja
12. ✅ Monitoring (Sentry)
13. ✅ Deployment (Vercel)

**Szacowany czas implementacji:** 4-6 godzin dla doświadczonego developera.

**Priorytety:**
- **Must have:** Kroki 1-9 (core functionality)
- **Should have:** Krok 10-11 (testy, dokumentacja)
- **Nice to have:** Krok 12-13 (monitoring, advanced deployment)

---

**Autor:** Claude Code
**Data utworzenia:** 2025-11-10
**Ostatnia aktualizacja:** 2025-11-10
