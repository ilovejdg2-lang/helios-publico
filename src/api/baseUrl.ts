/** Base del API Nest. Vacío en local → Vite proxy `/api` → 127.0.0.1:3000 */
export function apiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? ''
  return raw.replace(/\/$/, '')
}

/** Une la base con un path que empieza en `/api/...`. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const base = apiBase()
  return base ? `${base}${normalized}` : normalized
}
