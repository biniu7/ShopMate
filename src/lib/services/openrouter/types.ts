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
  type: "object";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: Record<string, any>; // JSON Schema properties can be arbitrary
  required?: string[];
  additionalProperties: boolean;
}

export interface ResponseFormat {
  type: "json_schema";
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
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
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
    public retryable = false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public originalError?: any // Original error can be of any type
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
