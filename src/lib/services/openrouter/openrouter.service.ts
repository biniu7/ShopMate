// src/lib/services/openrouter/openrouter.service.ts

import axios, { type AxiosInstance } from "axios";
import type {
  OpenRouterConfig,
  ChatOptions,
  ChatResponse,
  CategorizeIngredientsResponse,
  OpenRouterAPIResponse,
  ResponseFormat,
} from "./types";
import { OpenRouterError } from "./types";

export class OpenRouterService {
  private readonly config: OpenRouterConfig;
  private readonly httpClient: AxiosInstance;

  constructor(config?: Partial<OpenRouterConfig>) {
    // Domyślna konfiguracja
    const defaultConfig: OpenRouterConfig = {
      apiKey: import.meta.env.OPENROUTER_API_KEY || "",
      baseUrl: "https://openrouter.ai/api/v1",
      defaultModel: "openai/gpt-4o-mini",
      timeout: 10000,
      maxRetries: 2,
      retryDelay: 1000,
      defaultTemperature: 0,
      defaultMaxTokens: 500,
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
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        "HTTP-Referer": "https://shopmate.app",
        "X-Title": "ShopMate",
      },
    });
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new OpenRouterError(
        "Brak klucza API OpenRouter. Ustaw zmienną środowiskową OPENROUTER_API_KEY.",
        "MISSING_API_KEY"
      );
    }

    if (this.config.timeout <= 0) {
      throw new OpenRouterError(`Timeout musi być większy od 0 (otrzymano: ${this.config.timeout})`, "INVALID_CONFIG");
    }

    if (this.config.maxRetries < 0) {
      throw new OpenRouterError(`maxRetries musi być >= 0 (otrzymano: ${this.config.maxRetries})`, "INVALID_CONFIG");
    }

    if (this.config.retryDelay <= 0) {
      throw new OpenRouterError(`retryDelay musi być > 0 (otrzymano: ${this.config.retryDelay})`, "INVALID_CONFIG");
    }

    if (this.config.defaultTemperature < 0 || this.config.defaultTemperature > 2) {
      throw new OpenRouterError(
        `defaultTemperature musi być w zakresie [0, 2] (otrzymano: ${this.config.defaultTemperature})`,
        "INVALID_CONFIG"
      );
    }

    if (this.config.defaultMaxTokens <= 0) {
      throw new OpenRouterError(
        `defaultMaxTokens musi być > 0 (otrzymano: ${this.config.defaultMaxTokens})`,
        "INVALID_CONFIG"
      );
    }
  }

  // ========================================
  // Metody pomocnicze (private)
  // ========================================

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableError(error: any): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const statusCode = error.response?.status || error.statusCode;

    return (
      retryableStatusCodes.includes(statusCode) ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNRESET"
    );
  }

  private async executeWithRetry<T>(requestFn: () => Promise<T>, attempt = 0): Promise<T> {
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
    const message = error.response?.data?.error?.message || error.message || "Nieznany błąd";

    // Mapowanie statusów na kody błędów
    switch (statusCode) {
      case 400:
        return new OpenRouterError(`Nieprawidłowe zapytanie: ${message}`, "INVALID_REQUEST", 400, false, error);
      case 401:
        return new OpenRouterError("Nieprawidłowy klucz API OpenRouter", "UNAUTHORIZED", 401, false, error);
      case 403:
        return new OpenRouterError(`Brak dostępu: ${message}`, "FORBIDDEN", 403, false, error);
      case 404:
        return new OpenRouterError(`Model nie znaleziony: ${message}`, "MODEL_NOT_FOUND", 404, false, error);
      case 429:
        return new OpenRouterError(
          "Przekroczono limit zapytań. Spróbuj ponownie później.",
          "RATE_LIMIT_EXCEEDED",
          429,
          true,
          error
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new OpenRouterError(`Błąd serwera OpenRouter (${statusCode})`, "SERVER_ERROR", statusCode, true, error);
      default:
        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
          return new OpenRouterError(
            `Przekroczono limit czasu zapytania (${this.config.timeout}ms)`,
            "TIMEOUT",
            undefined,
            true,
            error
          );
        }
        return new OpenRouterError(message, "UNKNOWN_ERROR", statusCode, false, error);
    }
  }

  private sanitizeInput(input: string, maxLength = 10000): string {
    return (
      input
        .trim()
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x1F\x7F]/g, "") // Usuń control characters
        .slice(0, maxLength)
    );
  }

  private parseResponse<T>(
    apiResponse: OpenRouterAPIResponse,
    responseFormat?: ResponseFormat
  ): { data?: T; rawContent: string } {
    const rawContent = apiResponse.choices[0]?.message?.content || "";

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
        "PARSE_ERROR",
        undefined,
        false,
        error
      );
    }
  }

  // ========================================
  // Metody publiczne
  // ========================================

  async chat<T = unknown>(options: ChatOptions): Promise<ChatResponse<T>> {
    try {
      // Sanityzacja inputów
      const systemMessage = this.sanitizeInput(options.systemMessage, 5000);
      const userMessage = this.sanitizeInput(options.userMessage, 10000);

      // Przygotowanie payload
      const payload: any = {
        model: options.model || this.config.defaultModel,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        temperature: options.temperature ?? this.config.defaultTemperature,
        max_tokens: options.maxTokens ?? this.config.defaultMaxTokens,
      };

      // Dodaj opcjonalne parametry
      if (options.topP !== undefined) {
        payload.top_p = options.topP;
      }

      if (options.responseFormat) {
        payload.response_format = options.responseFormat;
      }

      // Wykonaj zapytanie z retry
      const apiResponse = await this.executeWithRetry<OpenRouterAPIResponse>(async () => {
        const response = await this.httpClient.post("/chat/completions", payload);
        return response.data;
      });

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
          total: apiResponse.usage.total_tokens,
        },
      };
    } catch (error: any) {
      // Obsługa błędów
      const normalizedError = error instanceof OpenRouterError ? error : this.normalizeError(error);

      return {
        success: false,
        model: options.model || this.config.defaultModel,
        error: {
          message: normalizedError.message,
          code: normalizedError.code,
          statusCode: normalizedError.statusCode,
        },
      };
    }
  }

  async categorizeIngredients(ingredients: { id: string; name: string }[]): Promise<CategorizeIngredientsResponse> {
    // Walidacja: pusta lista
    if (ingredients.length === 0) {
      return {
        success: false,
        categories: {},
        error: {
          message: "Lista składników jest pusta",
          failedIngredients: [],
        },
      };
    }

    // Walidacja: max 100 składników
    if (ingredients.length > 100) {
      return {
        success: false,
        categories: {},
        error: {
          message: `Przekroczono limit 100 składników (otrzymano: ${ingredients.length})`,
          failedIngredients: ingredients.map((i) => i.id),
        },
      };
    }

    // Przygotowanie komunikatu użytkownika
    const userMessage = ingredients.map((ing, idx) => `${idx + 1}. ${ing.name}`).join("\n");

    // Definicja response format
    const responseFormat: ResponseFormat = {
      type: "json_schema",
      json_schema: {
        name: "ingredient_categories",
        strict: true,
        schema: {
          type: "object",
          properties: {
            categories: {
              type: "object",
              additionalProperties: {
                type: "string",
                enum: ["Nabiał", "Warzywa", "Owoce", "Mięso", "Pieczywo", "Przyprawy", "Inne"],
              },
            },
          },
          required: ["categories"],
          additionalProperties: false,
        },
      },
    };

    // Wywołanie chat()
    const response = await this.chat<{ categories: Record<string, string> }>({
      systemMessage:
        "Jesteś ekspertem kulinarnym. Twoim zadaniem jest kategoryzowanie składników " +
        "do jednej z następujących kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne. " +
        'Zwróć obiekt JSON z kluczami będącymi numerami składników (jako stringi: "1", "2", itd.) ' +
        "i wartościami będącymi nazwami kategorii.",
      userMessage: `Kategoryzuj następujące składniki:\n${userMessage}`,
      model: this.config.defaultModel,
      temperature: 0,
      responseFormat,
    });

    // Obsługa błędu
    if (!response.success || !response.data?.categories) {
      return {
        success: false,
        categories: {},
        error: {
          message: response.error?.message || "Nie udało się skategoryzować składników",
          failedIngredients: ingredients.map((i) => i.id),
        },
      };
    }

    // Mapowanie indeksów na ID składników
    const categories: Record<string, string> = {};
    const validCategories = ["Nabiał", "Warzywa", "Owoce", "Mięso", "Pieczywo", "Przyprawy", "Inne"];

    ingredients.forEach((ing, idx) => {
      const category = response.data!.categories[(idx + 1).toString()];

      // Fallback do "Inne" jeśli kategoria nieprawidłowa
      categories[ing.id] = validCategories.includes(category) ? category : "Inne";
    });

    return {
      success: true,
      categories,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chat({
        systemMessage: 'Odpowiedz jednym słowem "ok"',
        userMessage: "test",
        maxTokens: 10,
      });

      return response.success && (response.rawContent?.toLowerCase().includes("ok") ?? false);
    } catch (error) {
      console.error("[OpenRouter] Test connection failed:", error);
      return false;
    }
  }
}
