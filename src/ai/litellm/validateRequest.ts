/**
 * Request validator utility for AI API calls.
 * 
 * This module provides pre-flight validation for all API requests,
 * ensuring no tool-calling artifacts are present before they reach
 * the API endpoint.
 * 
 * Use this BEFORE every API call to catch and reject invalid payloads.
 */

import type {
  InputChatPayload,
  SanitizedChatPayload,
  ValidationResult,
} from './sanitizeChatMessages';

// ============================================================================
// Error Types
// ============================================================================

/** Error thrown when validation fails */
export class ValidationError extends Error {
  public readonly errors: string[];
  public readonly warnings: string[];
  public readonly payload: unknown;

  constructor(
    message: string,
    options: {
      errors: string[];
      warnings: string[];
      payload?: unknown;
    }
  ) {
    super(message);
    this.name = 'ValidationError';
    this.errors = options.errors;
    this.warnings = options.warnings;
    this.payload = options.payload;
  }
}

// ============================================================================
// Validation Rules
// ============================================================================

/** Strict validation rules - rejects ANY tool-calling artifacts */
const STRICT_FORBIDDEN_FIELDS = [
  'tool_calls',
  'tool_call_id',
  'function_call',
  'functions',
  'tools',
  'tool_choice',
  'parallel_tool_calls',
] as const;

const STRICT_FORBIDDEN_ROLES = ['tool'] as const;

// ============================================================================
// Validators
// ============================================================================

/**
 * Check if a value contains any forbidden fields recursively.
 */
function containsForbiddenFields(
  obj: unknown,
  forbiddenFields: readonly string[],
  path: string = ''
): string[] {
  const errors: string[] = [];

  if (obj === null || obj === undefined) return errors;
  if (typeof obj !== 'object') return errors;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      errors.push(...containsForbiddenFields(obj[i], forbiddenFields, `${path}[${i}]`));
    }
    return errors;
  }

  const record = obj as Record<string, unknown>;
  for (const field of forbiddenFields) {
    if (field in record) {
      errors.push(`${path ? path + '.' : ''}${field}`);
    }
  }

  // Recursively check nested objects
  for (const [key, value] of Object.entries(record)) {
    if (key === 'messages') continue; // Handled separately
    if (typeof value === 'object' && value !== null) {
      errors.push(...containsForbiddenFields(value, forbiddenFields, `${path ? path + '.' : ''}${key}`));
    }
  }

  return errors;
}

/**
 * Validate message roles in a payload.
 */
function validateMessageRoles(
  messages: unknown,
  forbiddenRoles: readonly string[]
): string[] {
  const errors: string[] = [];

  if (!Array.isArray(messages)) {
    errors.push('messages must be an array');
    return errors;
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      errors.push(`messages[${i}] is not an object`);
      continue;
    }

    const record = msg as Record<string, unknown>;
    const role = record.role;

    if (typeof role !== 'string') {
      errors.push(`messages[${i}].role must be a string`);
    } else if (forbiddenRoles.includes(role as string)) {
      errors.push(`messages[${i}].role '${role}' is forbidden`);
    }
  }

  return errors;
}

/**
 * Validate that content is a string (not object/array format).
 */
function validateContentFormat(messages: unknown): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(messages)) return { errors, warnings };

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') continue;

    const record = msg as Record<string, unknown>;
    const content = record.content;

    if (content === undefined || content === null) {
      warnings.push(`messages[${i}].content is null/undefined`);
    } else if (typeof content !== 'string') {
      // Object/array content may cause issues with some providers
      warnings.push(`messages[${i}].content is not a string (type: ${typeof content})`);
    }
  }

  return { errors, warnings };
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Strictly validate a chat payload before API call.
 * 
 * This validation is STRICT - it will reject any payload containing:
 * - role='tool' messages
 * - tool_calls fields
 * - tool_call_id fields
 * - function_call fields
 * - tools/functions parameters
 * 
 * @throws {ValidationError} if payload contains forbidden fields
 */
export function validateRequest(
  payload: unknown,
  options?: {
    /** Include warnings in validation result (default: true) */
    includeWarnings?: boolean;
    /** Throw on validation errors (default: true) */
    throwOnError?: boolean;
    /** Log validation details (default: false) */
    debug?: boolean;
  }
): ValidationResult {
  const {
    includeWarnings = true,
    throwOnError = true,
    debug = false,
  } = options ?? {};

  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic type check
  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be an object');
    if (throwOnError) {
      throw new ValidationError('Payload must be an object', { errors, warnings, payload });
    }
    return { isValid: false, errors, warnings };
  }

  const record = payload as Record<string, unknown>;

  // Check top-level forbidden fields
  const topLevelErrors = containsForbiddenFields(
    record,
    STRICT_FORBIDDEN_FIELDS,
    ''
  );
  errors.push(...topLevelErrors);

  // Validate messages array
  if (!Array.isArray(record.messages)) {
    errors.push('messages must be an array');
  } else {
    // Check for forbidden roles
    const roleErrors = validateMessageRoles(record.messages, STRICT_FORBIDDEN_ROLES);
    errors.push(...roleErrors);

    // Check content format
    if (includeWarnings) {
      const contentValidation = validateContentFormat(record.messages);
      errors.push(...contentValidation.errors);
      warnings.push(...contentValidation.warnings);
    }

    // Check for forbidden fields in each message
    for (let i = 0; i < record.messages.length; i++) {
      const msgErrors = containsForbiddenFields(
        record.messages[i],
        STRICT_FORBIDDEN_FIELDS,
        `messages[${i}]`
      );
      errors.push(...msgErrors);
    }
  }

  if (debug) {
    console.log('[AI-Validator]', {
      isValid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors: errors.length > 0 ? errors : undefined,
      warnings: (includeWarnings && warnings.length > 0) ? warnings : undefined,
    });
  }

  if (errors.length > 0 && throwOnError) {
    throw new ValidationError(
      `Request validation failed: ${errors.join('; ')}`,
      { errors, warnings, payload }
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a sanitized payload (post-sanitization check).
 * Use this after sanitizeChatMessages to ensure sanitization was successful.
 */
export function validateSanitizedPayload(
  payload: SanitizedChatPayload
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check messages have only allowed roles
  for (let i = 0; i < payload.messages.length; i++) {
    const msg = payload.messages[i];
    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      errors.push(`messages[${i}].role '${msg.role}' is not allowed`);
    }
    if (typeof msg.content !== 'string') {
      errors.push(`messages[${i}].content must be a string`);
    }
  }

  // Check no forbidden fields exist
  const payloadObj = payload as unknown as Record<string, unknown>;
  for (const field of STRICT_FORBIDDEN_FIELDS) {
    if (field in payloadObj) {
      errors.push(`Forbidden field '${field}' found in sanitized payload`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Quick check if payload might contain tool-calling artifacts.
 * Returns true if payload appears clean (no obvious tool fields).
 */
export function appearsClean(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  
  const record = payload as Record<string, unknown>;
  
  // Quick top-level check
  for (const field of STRICT_FORBIDDEN_FIELDS) {
    if (field in record) return false;
  }
  
  // Quick messages check
  if (!Array.isArray(record.messages)) return false;
  
  for (const msg of record.messages) {
    if (!msg || typeof msg !== 'object') continue;
    const msgRecord = msg as Record<string, unknown>;
    
    if (msgRecord.role === 'tool') return false;
    
    for (const field of STRICT_FORBIDDEN_FIELDS) {
      if (field in msgRecord) return false;
    }
  }
  
  return true;
}

// ============================================================================
// Middleware/Interceptor Helpers
// ============================================================================

/**
 * Create a validation interceptor for fetch/API calls.
 * Returns a function that validates and optionally transforms the payload.
 */
export function createValidationInterceptor(options?: {
  throwOnError?: boolean;
  debug?: boolean;
  onValidationError?: (errors: string[], warnings: string[]) => void;
}) {
  return function intercept(
    payload: InputChatPayload
  ): { payload: InputChatPayload; valid: boolean; errors: string[]; warnings: string[] } {
    const result = validateRequest(payload, {
      throwOnError: options?.throwOnError ?? false,
      debug: options?.debug ?? false,
      includeWarnings: true,
    });

    if (!result.isValid && options?.onValidationError) {
      options.onValidationError(result.errors, result.warnings);
    }

    return {
      payload,
      valid: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
    };
  };
}

// ============================================================================
// Exports
// ============================================================================

export default validateRequest;
