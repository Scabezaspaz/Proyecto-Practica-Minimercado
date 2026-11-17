// Convierte un error de la API (DRF) en un mensaje legible.
export function apiErrorMessage(err: unknown, fallback = 'Ocurrió un error.'): string {
  const anyErr = err as { response?: { data?: unknown } }
  const data = anyErr?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    const parts: string[] = []
    for (const value of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(value)) parts.push(...value.map(String))
      else if (value) parts.push(String(value))
    }
    if (parts.length) return parts.join(' ')
  }
  return fallback
}
