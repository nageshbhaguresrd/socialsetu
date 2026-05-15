/**
 * Production-safe message sanitizer for LiteLLM + OpenRouter + VSCode AI extensions.
 * 
 * This module completely eliminates tool/function calling from the request pipeline:
 * - Removes role='tool' messages
 * - Removes tool_calls fields from assistant messages
 * - Removes tool_call_id fields
 * - Validates final payload contains only: system, user, assistant roles
 * - Provides debug logging for troubleshooting
 * 
 * Compatible with:
 * - Next.js server-side APIs
 * - OpenRouter
 * - LiteLLM
 * - Cursor, Blackbox, Cline, VSCode AI extensions
 */

// ============================================================================
// Types
// ============================================================================

/** Allowed message roles - only these are ever sent to APIs */
export type AllowedRole = 'system' | 'user' | 'assistant';

/** Input message type - may contain invalid fields from various sources */
export interface InputChatMessage {
  role: string;
  content?: string | null | object;
  // OpenAI tool calling fields (will be stripped)
  tool_calls?: unknown[];
  tool_call_id?: string;
  function_call?: { name?: string; arguments?: string };
  name?: string;
  // Any other fields that might be present
  [key: string]: unknown;
}

/** Sanitized message type - guaranteed safe for API calls */
export interface SanitizedChatMessage {
  role: AllowedRole;
  content: string;
}

/** Input payload type */
export interface InputChatPayload {
  model?: string;
  messages: InputChatMessage[];
  [key: string]: unknown;
}

/** Sanitized payload type - guaranteed safe for API calls */
export interface SanitizedChatPayload {
  model?: string;
  messages: SanitizedChatMessage[];
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
}

/** Validation result */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedPayload?: SanitizedChatPayload;
}

/** Debug log entry */
export interface DebugLogEntry {
  timestamp: string;
  action: 'sanitize' | 'validate' | 'remove' | 'coerce';
  details: string;
  before?: unknown;
  after?: unknown;
}

// ============================================================================
// Constants
// ============================================================================

/** Fields that indicate tool/function calling and must be removed */
const TOOL_CALLING_FIELDS = [
  'tool_calls',
  'tool_call_id',
  'function_call',
  'functions',
  'function_call',
  'tools',
  'tool_choice',
  'parallel_tool_calls',
] as const;

/** Top-level payload fields to remove */
const PAYLOAD_FIELDS_TO_REMOVE = [
  'functions',
  'function_call',
  'tools',
  'tool_choice',
  'tool_calls',
  'parallel_tool_calls',
  'response_format',
  'n',
] as const;

/** Allowed roles for messages */
const ALLOWED_ROLES: AllowedRole[] = ['system', 'user', 'assistant'];

// ============================================================================
// Debug Logger
// ============================================================================

const debugLogs: DebugLogEntry[] = [];

/** Enable/disable debug logging */
let DEBUG_ENABLED = process.env.NODE_ENV === 'development' ||
                    process.env.ENABLE_AI_DEBUG === 'true';

/** Set debug mode */
export function setDebugMode(enabled: boolean): void {
  DEBUG_ENABLED = enabled;
}

/** Log a debug entry */
function logDebug(entry: Omit<DebugLogEntry, 'timestamp'>): void {
  if (!DEBUG_ENABLED) return;
  debugLogs.push({
    ...entry,
    timestamp: new Date().toISOString(),
  });
}

/** Get all debug logs */
export function getDebugLogs(): DebugLogEntry[] {
  return [...debugLogs];
}

/** Clear debug logs */
export function clearDebugLogs(): void {
  debugLogs.length = 0;
}

// ============================================================================
// Core Sanitization Functions
// ============================================================================

/**
 * Convert content to a safe string format.
 * Handles null, undefined, objects, and arrays.
 */
function normalizeContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (content === null || content === undefined) return '';
  if (typeof content === 'object') {
    // For array content (like from some OpenAI responses), extract text
    if (Array.isArray(content)) {
      return content
        .map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'text' in item) {
            return String((item as { text?: string }).text ?? '');
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }
    // For object content, try to stringify
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }
  return String(content);
}

/**
 * Sanitize a single message, removing all tool-calling artifacts.
 */
function sanitizeMessage(
  message: InputChatMessage,
  index: number
): { sanitized: SanitizedChatMessage | null; removed: string[] } {
  const removed: string[] = [];

  // Check for tool role - these must be completely removed
  if (message.role === 'tool') {
    logDebug({
      action: 'remove',
      details: `Removed message at index ${index} with role 'tool'`,
      before: message,
    });
    removed.push(`message[${index}].role='tool'`);
    return { sanitized: null, removed };
  }

  // Coerce unknown roles to 'assistant' for safety
  let role: AllowedRole = message.role as AllowedRole;
  if (!ALLOWED_ROLES.includes(role)) {
    const originalRole = role;
    role = 'assistant';
    logDebug({
      action: 'coerce',
      details: `Coerced role '${originalRole}' to 'assistant' at index ${index}`,
      before: originalRole,
      after: role,
    });
    removed.push(`message[${index}].role='${originalRole}'`);
  }

  // Build sanitized message, copying only safe fields
  const sanitized: SanitizedChatMessage = {
    role,
    content: normalizeContent(message.content),
  };

  // Check for and remove tool-calling fields
  for (const field of TOOL_CALLING_FIELDS as unknown as string[]) {
    if (field in message) {
      removed.push(`message[${index}].${field}`);
      logDebug({
        action: 'remove',
        details: `Removed field '${field}' from message at index ${index}`,
        before: (message as Record<string, unknown>)[field],
      });
    }
  }

  // Remove any other unknown fields
  for (const key of Object.keys(message)) {
    if (!['role', 'content'].includes(key)) {
      removed.push(`message[${index}].${key}`);
    }
  }

  return { sanitized, removed };
}

/**
 * Sanitize an entire chat payload, removing all tool-calling artifacts.
 * This is the primary function to call before making API requests.
 */
export function sanitizeChatMessages(
  payload: InputChatPayload,
  options?: { debug?: boolean }
): SanitizedChatPayload {
  const debug = options?.debug ?? DEBUG_ENABLED;
  const allRemoved: string[] = [];
  const startTime = Date.now();

  // Clone the payload to avoid mutations
  const cloned: InputChatPayload = {
    ...payload,
    messages: Array.isArray(payload.messages) ? [...payload.messages] : [],
  };

  // Remove top-level tool/function params
  for (const field of PAYLOAD_FIELDS_TO_REMOVE) {
    if (field in cloned) {
      delete (cloned as Record<string, unknown>)[field];
      allRemoved.push(`payload.${field}`);
      logDebug({
        action: 'remove',
        details: `Removed top-level field '${field}'`,
        before: (cloned as Record<string, unknown>)[field],
      });
    }
  }

  // Sanitize each message
  const sanitizedMessages: SanitizedChatMessage[] = [];
  for (let i = 0; i < cloned.messages.length; i++) {
    const message = cloned.messages[i];
    const { sanitized, removed } = sanitizeMessage(message, i);
    allRemoved.push(...removed);
    if (sanitized) {
      sanitizedMessages.push(sanitized);
    }
  }

  // Build final sanitized payload
  const result: SanitizedChatPayload = {
    model: cloned.model,
    messages: sanitizedMessages,
  };

  // Preserve safe parameters
  if (typeof payload.temperature === 'number') {
    result.temperature = payload.temperature;
  }
  if (typeof payload.max_tokens === 'number') {
    result.max_tokens = payload.max_tokens;
  }

  if (debug || DEBUG_ENABLED) {
    logDebug({
      action: 'sanitize',
      details: `Sanitization complete. Removed ${allRemoved.length} items. ` +
               `Messages: ${cloned.messages.length} -> ${sanitizedMessages.length}`,
      before: { messageCount: cloned.messages.length },
      after: { messageCount: sanitizedMessages.length, removed: allRemoved },
    });

    if (DEBUG_ENABLED) {
      console.log('[AI-Sanitizer]', {
        duration: `${Date.now() - startTime}ms`,
        originalMessages: cloned.messages.length,
        sanitizedMessages: sanitizedMessages.length,
        removedFields: allRemoved,
        model: payload.model,
      });
    }
  }

  return result;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a payload BEFORE sending to API.
 * Rejects any payload containing tool-calling artifacts.
 */
export function validatePayload(payload: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Payload is not an object');
    return { isValid: false, errors, warnings };
  }

  const p = payload as Record<string, unknown>;

  // Check top-level fields
  for (const field of ['functions', 'tools', 'tool_choice', 'tool_calls', 'parallel_tool_calls']) {
    if (field in p) {
      errors.push(`Invalid top-level field: '${field}'`);
    }
  }

  // Check messages array
  if (!Array.isArray(p.messages)) {
    errors.push('Messages must be an array');
    return { isValid: errors.length === 0, errors, warnings };
  }

  for (let i = 0; i < p.messages.length; i++) {
    const msg = p.messages[i] as Record<string, unknown>;

    // Check role
    if (typeof msg.role !== 'string') {
      errors.push(`Message[${i}]: role must be a string`);
    } else if (msg.role === 'tool') {
      errors.push(`Message[${i}]: role 'tool' is not allowed`);
    } else if (!ALLOWED_ROLES.includes(msg.role as AllowedRole)) {
      warnings.push(`Message[${i}]: unexpected role '${msg.role}'`);
    }

    // Check for tool-calling fields
    for (const field of ['tool_calls', 'tool_call_id', 'function_call']) {
      if (field in msg) {
        errors.push(`Message[${i}]: contains invalid field '${field}'`);
      }
    }

    // Check content
    if (msg.content === undefined || msg.content === null) {
      warnings.push(`Message[${i}]: content is empty`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate and sanitize in one call.
 * Returns the sanitized payload if valid, throws if invalid.
 */
export function validateAndSanitize(
  payload: InputChatPayload,
  options?: { debug?: boolean; throwOnError?: boolean }
): { payload: SanitizedChatPayload; validation: ValidationResult } {
  const sanitized = sanitizeChatMessages(payload, options);
  const validation = validatePayload(sanitized);

  if (!validation.isValid && (options?.throwOnError ?? true)) {
    const error = new Error(
      `Invalid payload after sanitization: ${validation.errors.join('; ')}`
    );
    (error as any).validationErrors = validation.errors;
    (error as any).sanitizedPayload = sanitized;
    throw error;
  }

  return { payload: sanitized, validation };
}

// ============================================================================
// Safe API Call Wrapper
// ============================================================================

/**
 * Execute an API call with guaranteed sanitized payload.
 * Validates before sending and throws on invalid payloads.
 */
export async function safeApiCall<T>(
  url: string,
  payload: InputChatPayload,
  options?: {
    apiKey: string;
    timeoutMs?: number;
    debug?: boolean;
    signal?: AbortSignal;
  }
): Promise<T> {
  const { payload: sanitized, validation } = validateAndSanitize(payload, {
    debug: options?.debug,
    throwOnError: true,
  });

  if (options?.debug || DEBUG_ENABLED) {
    console.log('[AI-API]', {
      url,
      model: sanitized.model,
      messageCount: sanitized.messages.length,
      validationWarnings: validation.warnings,
    });
  }

  const controller = options?.signal
    ? undefined
    : new AbortController();
  const timeout = options?.timeoutMs ?? 30000;

  const timeoutId = !options?.signal
    ? setTimeout(() => controller?.abort(), timeout)
    : undefined;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options?.apiKey ?? ''}`,
      },
      body: JSON.stringify(sanitized),
      signal: options?.signal ?? controller?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ?? `API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// ============================================================================
// Export for compatibility
// ============================================================================

/**
 * Legacy export for backward compatibility.
 * @deprecated Use sanitizeChatMessages instead
 */
export function sanitizeOpenAIChatPayload(payload: InputChatPayload): SanitizedChatPayload {
  return sanitizeChatMessages(payload);
}

/** Legacy type exports */
export type ChatMessage = InputChatMessage;
export type ChatPayload = InputChatPayload;