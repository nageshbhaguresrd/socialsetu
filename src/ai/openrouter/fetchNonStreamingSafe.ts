/**
 * Non-Streaming Safe OpenRouter Fetch Utility
 * 
 * This module provides a production-safe way to call OpenRouter APIs:
 * - DISABLES streaming completely
 * - Sanitizes all messages before sending
 * - Validates payloads before every request
 * - Implements safe fallback chain with provider health detection
 * - Provides detailed debug logging
 * - Prevents recursive fallback loops
 * - Handles timeouts and errors gracefully
 * - Does NOT retry failed providers
 * 
 * Compatible with:
 * - Next.js server-side APIs
 * - Vercel AI Gateway
 * - LiteLLM routing
 * - Cline, Cursor, VSCode AI extensions
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

/** OpenRouter API response structure (non-streaming) */
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

/** Provider health status */
interface ProviderHealth {
  model: string;
  healthy: boolean;
  lastError?: string;
  lastChecked: number;
  failCount: number;
}

/** Fallback configuration */
export interface NonStreamingFallbackConfig {
  /** Primary model to try first */
  primaryModel: string;
  /** Fallback models in order of preference */
  fallbackModels: string[];
}

/** Fetch options */
export interface NonStreamingFetchOptions {
  /** OpenRouter API key */
  apiKey: string;
  /** Primary model to try first */
  primaryModel?: string;
  /** Fallback models in order of preference */
  fallbackModels?: string[];
  /** Base URL for OpenRouter API (default: https://openrouter.ai/api/v1) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 45000) */
  timeoutMs?: number;
  /** Maximum retries per model (default: 2) */
  maxRetries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
  /** Custom parse function for response content */
  parseJson?: (content: string) => unknown;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/** Result of a fetch operation */
export interface NonStreamingFetchResult<T = OpenRouterResponse> {
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
    streamingDisabled: true;
    attempts: Array<{ 
      model: string; 
      success: boolean; 
      error?: string;
      wasFallback: boolean;
    }>;
    selectedModel: string;
    providerHealth: Record<string, ProviderHealth>;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

/** Default safe fallback configuration (NO kwaipilot/kat-coder-pro) */
export const DEFAULT_NON_STREAMING_CONFIG: NonStreamingFallbackConfig = {
  primaryModel: 'openrouter/google/gemma-2-9b-it:free',
  fallbackModels: [
    'openrouter/meta-llama/llama-3.1-8b-instruct:free',
    'openrouter/mistralai/mistral-7b-instruct:free',
  ],
};

/** Default OpenRouter base URL */
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

/** Default timeout - 45 seconds */
const DEFAULT_TIMEOUT_MS = 45000;

/** Default max retries */
const DEFAULT_MAX_RETRIES = 2;

// ============================================================================
// Provider Health Tracking
// ============================================================================

const providerHealth: Map<string, ProviderHealth> = new Map();

/**
 * Check if a provider is healthy (not recently failed).
 */
function isProviderHealthy(model: string): boolean {
  const health = providerHealth.get(model);
  if (!health) return true; // No history = healthy
  
  // If failed more than 3 times, mark as unhealthy for 5 minutes
  if (health.failCount >= 3) {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (health.lastChecked > fiveMinutesAgo) {
      return false;
    }
  }
  
  return true;
}

/**
 * Mark a provider as failed.
 */
function markProviderFailed(model: string, error: string): void {
  const existing = providerHealth.get(model) || {
    model,
    healthy: true,
    lastChecked: Date.now(),
    failCount: 0,
  };
  
  providerHealth.set(model, {
    ...existing,
    healthy: false,
    lastError: error,
    lastChecked: Date.now(),
    failCount: existing.failCount + 1,
  });
}

/**
 * Mark a provider as healthy.
 */
function markProviderHealthy(model: string): void {
  providerHealth.set(model, {
    model,
    healthy: true,
    lastChecked: Date.now(),
    failCount: 0,
  });
}

/**
 * Get all provider health statuses.
 */
function getAllProviderHealth(): Record<string, ProviderHealth> {
  const result: Record<string, ProviderHealth> = {};
  providerHealth.forEach((health, model) => {
    result[model] = health;
  });
  return result;
}

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
  console.log('[OpenRouter-NonStreaming]', ...args);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch with timeout support (non-streaming).
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
 * Does NOT retry on streaming errors - just rotates to next provider.
 */
function shouldFallback(error: unknown): { fallback: boolean; reason: string } {
  if (error instanceof ValidationError) {
    return { fallback: false, reason: 'validation_error' };
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Streaming errors - immediately rotate, don't retry
    if (message.includes('stream') || 
        message.includes('stream_initialization_failed')) {
      return { fallback: true, reason: 'streaming_error' };
    }
    
    // Retry on these errors
    if (message.includes('rate limit') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('network') ||
        message.includes('503') ||
        message.includes('502') ||
        message.includes('500')) {
      return { fallback: true, reason: 'retryable_error' };
    }
    
    // Don't retry on these
    if (message.includes('invalid') ||
        message.includes('authentication') ||
        message.includes('unauthorized') ||
        message.includes('bad request')) {
      return { fallback: false, reason: 'non_retryable_error' };
    }
  }

  return { fallback: true, reason: 'unknown' };
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
 * Make a single API call (non-streaming).
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
        // Explicitly disable streaming
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        ...payload,
        stream: false, // Explicitly disable streaming
      }),
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
 * Non-streaming safe fetch with fallback support.
 * 
 * This is the main entry point for making OpenRouter API calls.
 * It sanitizes, validates, and handles fallbacks automatically.
 * STREAMING IS COMPLETELY DISABLED.
 */
export async function fetchNonStreamingSafe<T = OpenRouterResponse>(
  payload: InputChatPayload,
  options: NonStreamingFetchOptions
): Promise<NonStreamingFetchResult<T>> {
  const {
    apiKey,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    debug = false,
    parseJson,
    signal,
  } = options;

  const url = `${baseUrl}/chat/completions`;
  const attempts: Array<{ model: string; success: boolean; error?: string; wasFallback: boolean }> = [];
  let lastError: Error | undefined;
  let selectedModel = '';

  // Prepare the payload (sanitize + validate)
  const { sanitized, validation, removed } = preparePayload(payload, debug);

  logDebug('Prepared payload:', {
    model: sanitized.model,
    messageCount: sanitized.messages.length,
    removed,
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
    streamingDisabled: true,
  });

  // Build model list: primary + fallbacks
  const models = [
    options.primaryModel || sanitized.model || DEFAULT_NON_STREAMING_CONFIG.primaryModel,
    ...(options.fallbackModels || DEFAULT_NON_STREAMING_CONFIG.fallbackModels),
  ];

  // Remove duplicates while preserving order
  const uniqueModels = Array.from(new Set(models));

  // Track if we're using a fallback
  let usedFallback = false;

  // Try each model
  for (let modelIndex = 0; modelIndex < uniqueModels.length; modelIndex++) {
    const model = uniqueModels[modelIndex];
    selectedModel = model;
    
    // Check provider health - skip unhealthy providers
    if (!isProviderHealthy(model)) {
      const health = providerHealth.get(model);
      logDebug(`Skipping unhealthy provider: ${model}`, health?.lastError);
      attempts.push({ 
        model, 
        success: false, 
        error: `Provider unhealthy: ${health?.lastError}`,
        wasFallback: modelIndex > 0 
      });
      usedFallback = true;
      continue;
    }

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
      attempts.push({ 
        model, 
        success: false, 
        error: error.message,
        wasFallback: modelIndex > 0 
      });
      lastError = error;
      markProviderFailed(model, error.message);
      usedFallback = true;
      continue;
    }

    // Try with retries (but don't retry same provider if it fails)
    let providerFailed = false;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (providerFailed) break;

      try {
        logDebug(`Attempting ${model} (attempt ${attempt + 1}/${maxRetries + 1}), streaming: false`);

        const data = await makeApiCall(url, modelPayload, {
          apiKey,
          timeoutMs,
          signal,
        });

        logDebug(`Success with ${model}`);
        markProviderHealthy(model);
        attempts.push({ 
          model, 
          success: true,
          wasFallback: modelIndex > 0 
        });

        // If custom parser provided, use it
        if (parseJson) {
          const content = extractContent(data);
          const parsed = parseJson(content) as T;
          return {
            success: true,
            model,
            usedFallback: modelIndex > 0,
            data: parsed,
            warnings: validation.warnings,
            debug: {
              sanitizedMessageCount: sanitized.messages.length,
              removedFields: removed,
              streamingDisabled: true,
              selectedModel: model,
              attempts,
              providerHealth: getAllProviderHealth(),
            },
          };
        }

        return {
          success: true,
          model,
          usedFallback: modelIndex > 0,
          data: data as T,
          warnings: validation.warnings,
          debug: {
            sanitizedMessageCount: sanitized.messages.length,
            removedFields: removed,
            streamingDisabled: true,
            selectedModel: model,
            attempts,
            providerHealth: getAllProviderHealth(),
          },
        };
      } catch (error) {
        lastError = error as Error;
        const errorMessage = (error as Error).message;
        
        const { fallback, reason } = shouldFallback(error);
        
        logDebug(`Failed ${model}:`, errorMessage, `reason: ${reason}`);
        
        // Mark provider as failed
        markProviderFailed(model, errorMessage);
        
        // Don't retry on validation errors or non-retryable errors
        if (!fallback) {
          providerFailed = true;
          attempts.push({ 
            model, 
            success: false, 
            error: errorMessage,
            wasFallback: modelIndex > 0 
          });
          break;
        }
        
        // For streaming errors, immediately move to next provider
        if (reason === 'streaming_error') {
          providerFailed = true;
          attempts.push({ 
            model, 
            success: false, 
            error: `Streaming error: ${errorMessage}`,
            wasFallback: modelIndex > 0 
          });
          break;
        }
        
        // For retryable errors, we already marked as failed, move on
        providerFailed = true;
        attempts.push({ 
          model, 
          success: false, 
          error: errorMessage,
          wasFallback: modelIndex > 0 
        });
      }
    }
    
    // If this attempt failed, mark as fallback for subsequent attempts
    usedFallback = true;
  }

  // All attempts failed
  logDebug('All attempts failed:', attempts);

  return {
    success: false,
    model: selectedModel || uniqueModels[0],
    usedFallback: false,
    error: lastError?.message ?? 'Unknown error',
    warnings: validation.warnings,
    debug: {
      sanitizedMessageCount: sanitized.messages.length,
      removedFields: removed,
      streamingDisabled: true,
      selectedModel: selectedModel,
      attempts,
      providerHealth: getAllProviderHealth(),
    },
  };
}

/**
 * Simple fetch wrapper that just returns the content string.
 */
export async function fetchNonStreamingContent(
  payload: InputChatPayload,
  options: Omit<NonStreamingFetchOptions, 'parseJson'>
): Promise<string> {
  const result = await fetchNonStreamingSafe<string>(payload, {
    ...options,
    parseJson: (content: string) => content,
  });

  if (!result.success) {
    throw new Error(result.error ?? 'Failed to fetch chat content');
  }

  return result.data as string;
}

/**
 * Fetch and parse JSON response (non-streaming).
 */
export async function fetchNonStreamingJson<T = Record<string, unknown>>(
  payload: InputChatPayload,
  options: Omit<NonStreamingFetchOptions, 'parseJson'>
): Promise<T> {
  const result = await fetchNonStreamingSafe<T>(payload, {
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
// Exports
// ============================================================================

export { ValidationError };
export type { OpenRouterResponse };
export type { ProviderHealth };
export { isProviderHealthy, markProviderFailed, markProviderHealthy, getAllProviderHealth };
