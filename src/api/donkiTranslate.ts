import { apiUrl } from './baseUrl'

const CACHE_PREFIX = 'helios.donki.tr.v1:'

function hashText(text: string): string {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

function cacheKey(id: string, original: string, lang: string) {
  return `${CACHE_PREFIX}${lang}:${id}:${hashText(original)}`
}

export type DonkiTranslation =
  | { status: 'ready'; text: string; automatic: true }
  | { status: 'unavailable'; text: null }
  | { status: 'loading'; text: null }

export function readCachedTranslation(
  id: string,
  original: string,
  lang: string,
): string | null {
  try {
    return localStorage.getItem(cacheKey(id, original, lang))
  } catch {
    return null
  }
}

function writeCachedTranslation(
  id: string,
  original: string,
  lang: string,
  text: string,
) {
  try {
    localStorage.setItem(cacheKey(id, original, lang), text)
  } catch {
    /* quota */
  }
}

/** Traduce solo texto público DONKI. No envía datos personales. */
export async function translateDonkiNote(
  id: string,
  original: string,
  signal?: AbortSignal,
): Promise<DonkiTranslation> {
  const trimmed = original.trim()
  if (!trimmed) return { status: 'unavailable', text: null }
  const cached = readCachedTranslation(id, trimmed, 'es')
  if (cached) return { status: 'ready', text: cached, automatic: true }
  try {
    const response = await fetch(apiUrl('/api/ai/translate-donki'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        text: trimmed.slice(0, 4000),
        targetLang: 'es',
      }),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
    })
    if (!response.ok) return { status: 'unavailable', text: null }
    const body = (await response.json()) as {
      translation?: string
      unavailable?: boolean
    }
    const text = typeof body.translation === 'string' ? body.translation.trim() : ''
    if (!text || body.unavailable) return { status: 'unavailable', text: null }
    writeCachedTranslation(id, trimmed, 'es', text)
    return { status: 'ready', text, automatic: true }
  } catch {
    return { status: 'unavailable', text: null }
  }
}
