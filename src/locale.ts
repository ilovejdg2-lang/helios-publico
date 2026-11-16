export type Lang = 'es' | 'en'

const KEY = 'helios-locale'

type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function storage(): StorageLike | null {
  const box = globalThis as { localStorage?: StorageLike }
  return box.localStorage ?? null
}

export function readStored(): Lang {
  try {
    const stored = storage()?.getItem(KEY)
    if (stored === 'en' || stored === 'es') return stored
  } catch {
    /* sin almacenamiento */
  }
  return 'en'
}

export function writeStored(lang: Lang) {
  try {
    storage()?.setItem(KEY, lang)
  } catch {
    /* preferencia solo en esta visita */
  }
}

const DESCRIPTION: Record<Lang, string> = {
  en: 'HELIOS — Health Evaluation & Life Indicators Observation System. A prototype for health support on simulated space missions. It is not a clinical tool.',
  es: 'HELIOS — Sistema de observación de indicadores de salud y de vida. Prototipo de acompañamiento para misiones espaciales simuladas. No es una herramienta clínica.',
}

export function applyDocumentLocale(lang: Lang) {
  const root = (globalThis as { document?: Document }).document
  if (!root) return
  root.documentElement.lang = lang
  root.querySelector('meta[name="description"]')?.setAttribute('content', DESCRIPTION[lang])
}

/**
 * Browser: follows document.documentElement.lang (default en via index.html / LocaleProvider).
 * No document (unit tests): keep Spanish so domain fixtures stay stable.
 */
export function uiLang(): Lang {
  const root = (globalThis as { document?: { documentElement?: { lang?: string } } }).document
  if (!root) return 'es'
  return root.documentElement?.lang === 'es' ? 'es' : 'en'
}
