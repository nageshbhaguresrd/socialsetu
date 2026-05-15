import { ZodError } from 'zod'

export type FieldErrors = Record<string, string>

function normalizePathKey(pathItem: unknown) {
  if (typeof pathItem === 'string') return pathItem
  if (typeof pathItem === 'number') return String(pathItem)
  return null
}

export function zodErrorToFieldErrors(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {}

  for (const issue of error.issues) {
    const key = normalizePathKey(issue.path?.[0])
    if (!key) continue

    // If multiple issues exist per field, keep the first one for stable UX.
    if (!fieldErrors[key]) fieldErrors[key] = issue.message
  }

  return fieldErrors
}

