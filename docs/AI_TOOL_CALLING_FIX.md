# AI Tool Calling Fix - Complete Production-Safe Solution

## Problem Statement

The application was experiencing a fatal runtime error:

```
"Invalid parameter: messages with role 'tool' must be a response to a preceding message with 'tool_calls'"
```

This error occurred because tool-calling messages were being injected into the request pipeline from various sources:
- LiteLLM routing/fallbacks
- VSCode AI extensions (Cline, Cursor, Blackbox)
- MCP integrations
- Inherited conversation history
- Agent mode features

## Solution Overview

This fix provides a **complete, production-safe solution** that:

1. ✅ **Disables ALL tool/function calling globally**
2. ✅ **Disables MCP/agent/browser/file-system tools**
3. ✅ **Removes ALL role='tool' messages before requests**
4. ✅ **Removes ALL tool_calls fields from assistant messages**
5. ✅ **Ensures only allowed roles are sent: system, user, assistant**
6. ✅ **Provides sanitizeMessages() utility**
7. ✅ **Generates corrected LiteLLM config**
8. ✅ **Fixes fallback routing to prevent loops**
9. ✅ **Prevents recursive fallback loops**
10. ✅ **Prevents invalid inherited chat history**
11. ✅ **Ensures compatibility with all platforms**
12. ✅ **Adds request validation BEFORE every API call**
13. ✅ **Provides debug logging**

## File Structure

```
socialsetu/
├── src/
│   └── ai/
│       ├── litellm/
│       │   ├── sanitizeChatMessages.ts    # Main sanitizer + validation
│       │   └── validateRequest.ts         # Pre-flight validator
│       └── openrouter/
│           └── fetchChatWithFallbackNoTools.ts  # Safe fetch utility
├── litellm.blackboxai.no-tools.yml       # LiteLLM config
├── vscode.blackboxai.no-tools.modelconfig.json  # VSCode extension config
├── example.openai.chat.payload.no-tools.json    # Example payload
└── docs/
    └── AI_TOOL_CALLING_FIX.md           # This document
```

## Core Components

### 1. Message Sanitizer (`src/ai/litellm/sanitizeChatMessages.ts`)

The main sanitization function that cleans all payloads:

```typescript
import { sanitizeChatMessages, validateAndSanitize } from '@/src/ai/litellm/sanitizeChatMessages';

// Basic sanitization
const sanitized = sanitizeChatMessages(payload);

// Sanitize + validate (throws on error)
const { payload: clean, validation } = validateAndSanitize(payload);

// Safe API call wrapper
import { safeApiCall } from '@/src/ai/litellm/sanitizeChatMessages';
const response = await safeApiCall(url, payload, { apiKey });
```

**What it removes:**
- Messages with `role: 'tool'`
- `tool_calls` fields from assistant messages
- `tool_call_id` fields
- `function_call` fields
- Top-level `tools`, `tool_choice`, `functions`, `function_call`
- Any unknown roles (coerced to 'assistant')

### 2. Request Validator (`src/ai/litellm/validateRequest.ts`)

Pre-flight validation that rejects invalid payloads:

```typescript
import { validateRequest, ValidationError } from '@/src/ai/litellm/validateRequest';

try {
  validateRequest(payload); // Throws if invalid
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation errors:', error.errors);
  }
}

// Quick check
import { appearsClean } from '@/src/ai/litellm/validateRequest';
if (!appearsClean(payload)) {
  // Handle invalid payload
}
```

### 3. Safe Fetch Utility (`src/ai/openrouter/fetchChatWithFallbackNoTools.ts`)

Complete fetch wrapper with sanitization, validation, and fallbacks:

```typescript
import { fetchChatSafe, fetchChatContent, fetchChatJson } from '@/src/ai/openrouter/fetchChatWithFallbackNoTools';

// Get raw response
const result = await fetchChatSafe(payload, {
  apiKey: process.env.OPENROUTER_API_KEY!,
  primaryModel: 'openrouter/meta-llama/llama-3.1-8b-instruct:free',
  fallbackModels: [
    'openrouter/google/gemma-2-9b-it:free',
    'openrouter/mistralai/mistral-7b-instruct:free',
  ],
  debug: true,
});

// Get content string
const content = await fetchChatContent(payload, {
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Get parsed JSON
const data = await fetchChatJson<MyType>(payload, {
  apiKey: process.env.OPENROUTER_API_KEY!,
});
```

### 4. LiteLLM Configuration (`litellm.blackboxai.no-tools.yml`)

Server-side configuration that enforces no-tool-calling:

```yaml
# Drop all tool/function params globally
drop_params:
  - functions
  - function_call
  - tools
  - tool_choice
  - tool_calls
  - parallel_tool_calls

# Hard disable at adapter level
settings:
  supports_functions: false
  supports_tools: false
  agent_mode: false
  content_policy_fallback: false

# Safe fallback chain (no recursive loops)
fallbacks:
  - openrouter/meta-llama/llama-3.1-8b-instruct:free:
    - openrouter/google/gemma-2-9b-it:free:
      - openrouter/mistralai/mistral-7b-instruct:free
```

## Usage Examples

### Next.js API Route

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchChatSafe } from '@/src/ai/openrouter/fetchChatWithFallbackNoTools';
import { validateRequest } from '@/src/ai/litellm/validateRequest';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate BEFORE processing
    validateRequest(body, { throwOnError: true, debug: true });
    
    // Safe fetch with fallbacks
    const result = await fetchChatSafe(body, {
      apiKey: process.env.OPENROUTER_API_KEY!,
      debug: process.env.NODE_ENV === 'development',
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, debug: result.debug },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message, validation: error.errors },
      { status: 400 }
    );
  }
}
```

### React Component (Client-Side)

```typescript
// components/ChatComponent.tsx
'use client';

import { useState } from 'react';
import { sanitizeChatMessages } from '@/src/ai/litellm/sanitizeChatMessages';

export function ChatComponent() {
  const [messages, setMessages] = useState([]);

  const sendMessage = async (content: string) => {
    const payload = {
      model: 'openrouter/meta-llama/llama-3.1-8b-instruct:free',
      messages: [...messages, { role: 'user', content }],
    };

    // Sanitize before sending
    const sanitized = sanitizeChatMessages(payload);
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
    });

    const data = await response.json();
    setMessages([...sanitized.messages, { role: 'assistant', content: data.content }]);
  };

  // ...
}
```

### VSCode Extension (Cline/Cursor/Blackbox)

Use the provided model configuration:

```json
{
  "modelProvider": "litellm",
  "model": "openrouter/meta-llama/llama-3.1-8b-instruct:free",
  "supportsFunctions": false,
  "supportsTools": false,
  "agentMode": false,
  "toolCalling": false,
  "fallbackModels": [
    "openrouter/google/gemma-2-9b-it:free",
    "openrouter/mistralai/mistral-7b-instruct:free"
  ]
}
```

## Debug Logging

Enable debug logging to see what's being sanitized:

```bash
# Environment variable
export ENABLE_AI_DEBUG=true

# Or in code
import { setDebugMode } from '@/src/ai/litellm/sanitizeChatMessages';
setDebugMode(true);
```

Debug output shows:
- Original vs sanitized message counts
- Removed fields and messages
- Validation errors and warnings
- Fallback attempts
- Selected model

## Troubleshooting

### Error: "messages with role 'tool' must be a response to a preceding message with 'tool_calls'"

**Cause:** Tool messages are being sent to an API that doesn't support tool calling.

**Solution:** The sanitizer automatically removes these. Ensure you're using `sanitizeChatMessages()` before every API call.

### Error: "Invalid request with tools and tool_choice"

**Cause:** Tool-related parameters are being sent.

**Solution:** The sanitizer removes `tools`, `tool_choice`, `functions`, `function_call` from the payload.

### Fallback loops

**Cause:** Recursive fallback configuration.

**Solution:** The LiteLLM config uses a linear fallback chain, not recursive. Each model is tried once before moving to the next.

### Validation errors

**Cause:** Payload contains forbidden fields after sanitization.

**Solution:** Check debug logs to see what was removed. If tool messages persist, they may be coming from conversation history - ensure history is also sanitized.

## Environment Variables

Required:
- `OPENROUTER_API_KEY`: Your OpenRouter API key

Optional:
- `ENABLE_AI_DEBUG`: Set to `true` to enable debug logging
- `NODE_ENV`: Set to `development` for automatic debug logging

## API Reference

### sanitizeChatMessages(payload, options?)

Sanitizes a chat payload, removing all tool-calling artifacts.

**Parameters:**
- `payload`: InputChatPayload - The payload to sanitize
- `options.debug?`: boolean - Enable debug logging

**Returns:** SanitizedChatPayload

### validateRequest(payload, options?)

Validates a payload, throwing on errors.

**Parameters:**
- `payload`: unknown - The payload to validate
- `options.throwOnError?`: boolean - Throw on validation errors (default: true)
- `options.debug?`: boolean - Enable debug logging

**Returns:** ValidationResult

**Throws:** ValidationError if validation fails

### fetchChatSafe(payload, options)

Safe fetch with sanitization, validation, and fallbacks.

**Parameters:**
- `payload`: InputChatPayload - The chat payload
- `options.apiKey`: string - OpenRouter API key
- `options.primaryModel?`: string - Primary model to try
- `options.fallbackModels?`: string[] - Fallback models
- `options.baseUrl?`: string - API base URL
- `options.timeoutMs?`: number - Request timeout
- `options.debug?`: boolean - Enable debug logging

**Returns:** Promise<FetchResult<T>>

### fetchChatContent(payload, options)

Fetch and return just the content string.

**Returns:** Promise<string>

### fetchChatJson<T>(payload, options)

Fetch and parse JSON response.

**Returns:** Promise<T>

## Migration Guide

### From Old Implementation

1. Replace all direct `fetch()` calls to AI APIs with `fetchChatSafe()`
2. Add `sanitizeChatMessages()` before any API call
3. Update LiteLLM config to use `litellm.blackboxai.no-tools.yml`
4. Update VSCode extension config to use `vscode.blackboxai.no-tools.modelconfig.json`
5. Enable debug logging temporarily to verify sanitization

### Breaking Changes

- `sanitizeOpenAIChatPayload` is deprecated, use `sanitizeChatMessages`
- `fetchChatWithFallbackNoTools` is deprecated, use `fetchChatSafe`
- Validation now throws by default (use `throwOnError: false` to disable)

## Best Practices

1. **Always sanitize before sending** - Even if you think the payload is clean
2. **Validate before API calls** - Catch issues early
3. **Use the safe fetch wrapper** - It handles everything automatically
4. **Enable debug in development** - See what's being removed
5. **Sanitize conversation history** - Old messages may contain tool artifacts
6. **Don't use tool-calling APIs** - Avoid `tools`, `tool_choice`, `functions` entirely

## Support

For issues or questions:
1. Check debug logs first
2. Verify environment variables are set
3. Ensure you're using the safe fetch wrapper
4. Check that LiteLLM config is loaded

## License

MIT License - See LICENSE file for details.