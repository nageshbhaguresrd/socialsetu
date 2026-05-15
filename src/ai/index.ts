/**
 * AI Utilities - Central Export
 * 
 * This module provides a single entry point for all AI-related utilities,
 * making it easy to import the safe AI functions throughout your application.
 * 
 * @example
 * ```typescript
 * import {
 *   sanitizeChatMessages,
 *   validateRequest,
 *   fetchChatSafe,
 *   DEFAULT_FALLBACK_CONFIG,
 * } from '@/src/ai';
 * ```
 */

// ============================================================================
// Sanitization & Validation
// ============================================================================

export {
  sanitizeChatMessages,
  validateAndSanitize,
  validatePayload,
  safeApiCall,
  setDebugMode as setSanitizerDebugMode,
  getDebugLogs,
  clearDebugLogs,
  // Legacy exports
  sanitizeOpenAIChatPayload,
  // Types
  type AllowedRole,
  type InputChatMessage,
  type SanitizedChatMessage,
  type InputChatPayload,
  type SanitizedChatPayload,
  type ValidationResult,
  type DebugLogEntry,
} from './litellm/sanitizeChatMessages';

export {
  validateRequest,
  validateSanitizedPayload,
  appearsClean,
  createValidationInterceptor,
  // Error class
  ValidationError,
} from './litellm/validateRequest';

// ============================================================================
// Safe Fetch Utilities (With Streaming - Legacy)
// ============================================================================

export {
  fetchChatSafe,
  fetchChatContent,
  fetchChatJson,
  // Legacy export
  fetchChatWithFallbackNoTools,
  // Configuration
  DEFAULT_FALLBACK_CONFIG,
  setDebugMode as setFetchDebugMode,
  // Types
  type FallbackConfig,
  type SafeFetchOptions,
  type FetchResult,
  type OpenRouterResponse,
} from './openrouter/fetchChatWithFallbackNoTools';

// ============================================================================
// Non-Streaming Safe Fetch Utilities (Recommended)
// ============================================================================

export {
  fetchNonStreamingSafe,
  fetchNonStreamingContent,
  fetchNonStreamingJson,
  // Configuration
  DEFAULT_NON_STREAMING_CONFIG,
  setDebugMode as setNonStreamingDebugMode,
  // Provider health
  isProviderHealthy,
  markProviderFailed,
  markProviderHealthy,
  getAllProviderHealth,
  // Types
  type NonStreamingFallbackConfig,
  type NonStreamingFetchOptions,
  type NonStreamingFetchResult,
  type ProviderHealth,
} from './openrouter/fetchNonStreamingSafe';

// ============================================================================
// JSON Repair Utilities
// ============================================================================

export {
  repairAndParseJson,
} from './openrouter/repairParseJson';

// ============================================================================
// Convenience Re-exports
// ============================================================================

/**
 * Complete safe AI chat flow:
 * 1. Sanitize the payload
 * 2. Validate it
 * 3. Send with fallbacks
 * 
 * @example
 * ```typescript
 * const result = await fetchChatSafe(payload, {
 *   apiKey: process.env.OPENROUTER_API_KEY!,
 * });
 * 
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default fallback configuration for OpenRouter.
 * Uses free tier models to minimize costs.
 */
export const AI_DEFAULT_CONFIG = {
  primaryModel: 'openrouter/meta-llama/llama-3.1-8b-instruct:free',
  fallbackModels: [
    'openrouter/google/gemma-2-9b-it:free',
    'openrouter/mistralai/mistral-7b-instruct:free',
  ],
  baseUrl: 'https://openrouter.ai/api/v1',
  timeoutMs: 35000,
  maxRetriesPerModel: 1,
} as const;

/**
 * Allowed message roles - only these will be sent to APIs.
 */
export const AI_ALLOWED_ROLES = ['system', 'user', 'assistant'] as const;

/**
 * Forbidden fields that will be stripped from payloads.
 */
export const AI_FORBIDDEN_FIELDS = [
  'tool_calls',
  'tool_call_id',
  'function_call',
  'functions',
  'tools',
  'tool_choice',
  'parallel_tool_calls',
  'response_format',
  'n',
] as const;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a role is allowed.
 */
export function isAllowedRole(role: string): role is 'system' | 'user' | 'assistant' {
  return AI_ALLOWED_ROLES.includes(role as typeof AI_ALLOWED_ROLES[number]);
}

/**
 * Check if a field is forbidden.
 */
export function isForbiddenField(field: string): boolean {
  return AI_FORBIDDEN_FIELDS.includes(field as typeof AI_FORBIDDEN_FIELDS[number]);
}