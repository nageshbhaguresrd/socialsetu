/**
 * Safe OpenRouter fetch utility with fallback support.
 * 
 * This module provides a production-safe way to call OpenRouter APIs:
 * - Sanitizes all messages before sending
 * - Validates payloads before every request
 * - Implements safe fallback chain
 * - Provides detailed debug logging
 * - Prevents recursive fallback loops
 * - Handles timeouts and errors gracefully
 * 
 * Compatible with:
 * - Next.js server-side APIs
 * - LiteLLM routing
 * - VSCode AI extensions
 */

import {
  sanitizeChatMessages,
  validateAndSanitize,
  validatePayload,
  type InputChatPayload,
  type SanitizedChatPayload,
  type ValidationResult,
} from '@/src/ai/litellm/sanitizeChatMessages';

import {
  validateRequest,
  validateSanitizedPayload,
  ValidationError,
} from '@/src/ai/litellm/validateRequest';

// ============================================================================
// Types
// ============================================================================

/** OpenRouter API response structure */
interface OpenRouterResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    message?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

/** Fallback configuration */
export interface FallbackConfig {
  /** Primary model to try first */
  primaryModel: string;
  /** Fallback models in order of preference */
  fallbackModels: string[];
}

/** Fetch options */
export interface SafeFetchOptions {
  /** OpenRouter API key */
  apiKey: string;
  /** Primary model to try first */
  primaryModel?: string;
  /** Fallback models in order of preference */
  fallbackModels?: string[];
  /** Base URL for OpenRouter API (default: https://openrouter.ai/api/v1) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 35000) */
  timeoutMs?: number;
  /** Maximum retries per model (default: 1) */
  maxRetriesPerModel?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
  /** Custom parse function for response content */
  parseJson?: (content: string) => unknown;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/** Result of a fetch operation */
export interface FetchResult<T = OpenRouterResponse> {
  /** Whether the request succeeded */
  success: boolean;
  /** The model that was used */
  model: string;
  /** Whether a fallback was used */
  usedFallback: boolean;
  /** The response data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Validation warnings */
  warnings?: string[];
  /** Debug information */
  debug?: {
    sanitizedMessageCount: number;
    removedFields: string[];
    attempts: Array<{ model: string; success: boolean; error?: string }>;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

/** Default safe fallback configuration */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  primaryModel: 'openrouter/meta-llama/llama-3.1-8b-instruct:free',
  fallbackModels: [
    'openrouter/google/gemma-2-9b-it:free',
    'openrouter/mistralai/mistral-7b-instruct:free',
  ],
};

/** Default OpenRouter base URL */
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

/** Default timeout */
const DEFAULT_TIMEOUT_MS = 35000;

// ============================================================================
// Debug Logger
// ============================================================================

let debugEnabled = process.env.NODE_ENV === 'development' ||
                   process.env.ENABLE_AI_DEBUG === 'true';

/** Set debug mode */
export function setDebugMode(enabled: boolean): void {
  debugEnabled = enabled;
}

/** Log debug message */
function logDebug(...args: unknown[]): void {
  if (!debugEnabled) return;
  console.log('[OpenRouter-Safe]', ...args);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch with timeout support.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<Response> {
  const controller = signal ? undefined : new AbortController();
  const timeoutId = signal
    ? undefined
    : setTimeout(() => controller?.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: signal ?? controller?.signal,
    });
    return response;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Extract text content from OpenRouter response.
 */
function extractContent(response: OpenRouterResponse): string {
  return response.choices?.[0]?.message?.content ?? '';
}

/**
 * Check if an error indicates we should try a fallback.
 */
function shouldFallback(error: unknown): boolean {
  if (error instanceof ValidationError) {
    // Don't fallback on validation errors - they indicate bad input
    return false;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Retry on these errors
    if (message.includes('rate limit') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('network') ||
        message.includes('503') ||
        message.includes('502') ||
        message.includes('500')) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Sanitize and validate a payload.
 * Returns sanitized payload and validation info.
 */
function preparePayload(
  payload: InputChatPayload,
  debug?: boolean
): { sanitized: SanitizedChatPayload; validation: ValidationResult; removed: string[] } {
  // First sanitize
  const sanitized = sanitizeChatMessages(payload, { debug });
  
  // Then validate
  const validation = validatePayload(sanitized);
  
  // Track what was removed
  const removed: string[] = [];
  const originalCount = payload.messages.length;
  const sanitizedCount = sanitized.messages.length;
  
  if (originalCount !== sanitizedCount) {
    removed.push(`${originalCount - sanitizedCount} messages removed (likely tool role)`);
  }
  
  return { sanitized, validation, removed };
}

/**
 * Make a single API call with validation.
 */
async function makeApiCall(
  url: string,
  payload: SanitizedChatPayload,
  options: {
    apiKey: string;
    timeoutMs: number;
    signal?: AbortSignal;
  }
): Promise<OpenRouterResponse> {
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/nageshbhaguresrd/socialsetu',
        'X-Title': 'SocialSetu',
      },
      body: JSON.stringify(payload),
    },
    options.timeoutMs,
    options.signal
  );

  const data = await response.json().catch(() => ({})) as OpenRouterResponse;

  if (!response.ok) {
    const errorMessage = data.error?.message ?? (typeof data.error === 'string' ? data.error : `HTTP ${response.status}`);
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Safe fetch with fallback support.
 * 
 * This is the main entry point for making OpenRouter API calls.
 * It sanitizes, validates, and handles fallbacks automatically.
 */
export async function fetchChatSafe<T = OpenRouterResponse>(
  payload: InputChatPayload,
  options: SafeFetchOptions
): Promise<FetchResult<T>> {
  const {
    apiKey,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetriesPerModel = 1,
    debug = false,
    parseJson,
    signal,
  } = options;

  const url = `${baseUrl}/chat/completions`;
  const attempts: Array<{ model: string; success: boolean; error?: string }> = [];
  let lastError: Error | undefined;

  // Prepare the payload (sanitize + validate)
  const { sanitized, validation, removed } = preparePayload(payload, debug);

  logDebug('Prepared payload:', {
    model: sanitized.model,
    messageCount: sanitized.messages.length,
    removed,
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
  });

  // Build model list: primary + fallbacks
  const models = [
    options.primaryModel || sanitized.model || DEFAULT_FALLBACK_CONFIG.primaryModel,
    ...(options.fallbackModels || DEFAULT_FALLBACK_CONFIG.fallbackModels),
  ];

  // Remove duplicates while preserving order
  const uniqueModels = Array.from(new Set(models));

  // Try each model
  for (const model of uniqueModels) {
    const modelPayload: SanitizedChatPayload = {
      ...sanitized,
      model,
    };

    // Validate the final payload
    const finalValidation = validateSanitizedPayload(modelPayload);
    if (!finalValidation.isValid) {
      const error = new Error(
        `Validation failed for model ${model}: ${finalValidation.errors.join('; ')}`
      );
      attempts.push({ model, success: false, error: error.message });
      lastError = error;
      continue;
    }

    // Try with retries
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        logDebug(`Attempting ${model} (attempt ${attempt + 1}/${maxRetriesPerModel + 1})`);

        const data = await makeApiCall(url, modelPayload, {
          apiKey,
          timeoutMs,
          signal,
        });

        logDebug(`Success with ${model}`);
        attempts.push({ model, success: true });

        // If custom parser provided, use it
        if (parseJson) {
          const content = extractContent(data);
          const parsed = parseJson(content) as T;
          return {
            success: true,
            model,
            usedFallback: model !== uniqueModels[0],
            data: parsed,
            warnings: validation.warnings,
            debug: {
              sanitizedMessageCount: sanitized.messages.length,
              removedFields: removed,
              attempts,
            },
          };
        }

        return {
          success: true,
          model,
          usedFallback: model !== uniqueModels[0],
          data: data as T,
          warnings: validation.warnings,
          debug: {
            sanitizedMessageCount: sanitized.messages.length,
            removedFields: removed,
            attempts,
          },
        };
      } catch (error) {
        lastError = error as Error;
        const errorMessage = (error as Error).message;
        attempts.push({ model, success: false, error: errorMessage });

        logDebug(`Failed ${model}:`, errorMessage);

        // Don't retry on validation errors
        if (error instanceof ValidationError) {
          break;
        }

        // Don't retry if we shouldn't fallback
        if (!shouldFallback(error) && attempt === maxRetriesPerModel) {
          break;
        }
      }
    }
  }

  // All attempts failed
  logDebug('All attempts failed:', attempts);

  return {
    success: false,
    model: uniqueModels[0],
    usedFallback: false,
    error: lastError?.message ?? 'Unknown error',
    warnings: validation.warnings,
    debug: {
      sanitizedMessageCount: sanitized.messages.length,
      removedFields: removed,
      attempts,
    },
  };
}

/**
 * Simple fetch wrapper that just returns the content string.
 */
export async function fetchChatContent(
  payload: InputChatPayload,
  options: Omit<SafeFetchOptions, 'parseJson'>
): Promise<string> {
  const result = await fetchChatSafe<string>(payload, {
    ...options,
    parseJson: (content: string) => content,
  });

  if (!result.success) {
    throw new Error(result.error ?? 'Failed to fetch chat content');
  }

  return result.data as string;
}

/**
 * Fetch and parse JSON response.
 */
export async function fetchChatJson<T = Record<string, unknown>>(
  payload: InputChatPayload,
  options: Omit<SafeFetchOptions, 'parseJson'>
): Promise<T> {
  const result = await fetchChatSafe<T>(payload, {
    ...options,
    parseJson: (content: string) => {
      try {
        return JSON.parse(content) as T;
      } catch {
        // Try to extract JSON from markdown
        const cleaned = content
          .replace(/```json\s*/gi, '')
          .replace(/```/g, '')
          .trim();
        
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          const candidate = cleaned.slice(first, last + 1);
          return JSON.parse(candidate) as T;
        }
        
        throw new Error('Failed to parse JSON response');
      }
    },
  });

  if (!result.success) {
    throw new Error(result.error ?? 'Failed to fetch JSON');
  }

  return result.data as T;
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * Legacy function signature for backward compatibility.
 * @deprecated Use fetchChatSafe instead
 */
export async function fetchChatWithFallbackNoTools<T>(args: {
  apiKey: string;
  primaryModel: string;
  fallbackModels: string[];
  baseUrl?: string;
  timeoutMs?: number;
  maxRetriesPerModel?: number;
  payload: InputChatPayload;
  parseJson: (raw: string) => T;
}): Promise<T> {
  const result = await fetchChatSafe<T>(args.payload, {
    apiKey: args.apiKey,
    baseUrl: args.baseUrl,
    timeoutMs: args.timeoutMs,
    maxRetriesPerModel: args.maxRetriesPerModel,
    primaryModel: args.primaryModel,
    fallbackModels: args.fallbackModels,
    parseJson: args.parseJson,
  });

  if (!result.success) {
    throw new Error(result.error ?? 'Failed to fetch');
  }

  return result.data as T;
}

// ============================================================================
// Exports
// ============================================================================

export { ValidationError };
export type { OpenRouterResponse };