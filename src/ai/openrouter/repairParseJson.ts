export function repairAndParseJson<T>(raw: string, fallback: T): T {
  const cleaned = String(raw)
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim()

  // Try direct parse
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Try to slice out a JSON object
  }

  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = cleaned.slice(first, last + 1)
    try {
      return JSON.parse(candidate) as T
    } catch {
      // ignore
    }
    return fallback
  }

  return fallback
}

