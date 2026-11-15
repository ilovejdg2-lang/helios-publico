import type { WeatherEvent } from '../api/environment'

export const DONKI_TYPES = ['CME', 'FLR', 'SEP'] as const
export type DonkiType = (typeof DONKI_TYPES)[number]

export const DONKI_TYPE_LABEL: Record<
  DonkiType,
  { es: string; en: string; short: string; hintEs: string; hintEn: string }
> = {
  CME: {
    es: 'Eyección de masa coronal',
    en: 'Coronal mass ejection',
    short: 'CME',
    hintEs:
      'Una CME es una expulsión de plasma y campo magnético desde la corona solar. En HELIOS aparece como contexto espacial, no como dosis personal.',
    hintEn:
      'A CME is an expulsion of plasma and magnetic field from the solar corona. In HELIOS it is mission context, not personal dose.',
  },
  FLR: {
    es: 'Llamarada solar',
    en: 'Solar flare',
    short: 'FLR',
    hintEs:
      'Una llamarada solar es un aumento brusco de radiación electromagnética. Las clases A/B/C/M/X describen intensidad de rayos X; no equivalen a un diagnóstico médico.',
    hintEn:
      'A solar flare is a sudden electromagnetic radiation burst. Classes A/B/C/M/X describe X-ray intensity; they are not a medical diagnosis.',
  },
  SEP: {
    es: 'Partículas energéticas solares',
    en: 'Solar energetic particles',
    short: 'SEP',
    hintEs:
      'Un evento SEP registra partículas energéticas asociadas a actividad solar. El registro DONKI no mide la exposición de un tripulante concreto.',
    hintEn:
      'An SEP event records energetic particles linked to solar activity. The DONKI record does not measure a specific crewmember’s exposure.',
  },
}

export function flareClassHelp(classification: string | null, en: boolean): string | null {
  if (!classification) return null
  const letter = classification.trim().charAt(0).toUpperCase()
  const map: Record<string, { es: string; en: string }> = {
    A: {
      es: 'Clase A: la más débil en la escala de rayos X GOES.',
      en: 'Class A: the weakest on the GOES X-ray scale.',
    },
    B: {
      es: 'Clase B: intensa baja en la escala de rayos X GOES.',
      en: 'Class B: low intensity on the GOES X-ray scale.',
    },
    C: {
      es: 'Clase C: intensidad media-baja en la escala de rayos X GOES.',
      en: 'Class C: low-to-moderate intensity on the GOES X-ray scale.',
    },
    M: {
      es: 'Clase M: intensidad moderada en la escala de rayos X GOES.',
      en: 'Class M: moderate intensity on the GOES X-ray scale.',
    },
    X: {
      es: 'Clase X: la más intensa en la escala de rayos X GOES.',
      en: 'Class X: the strongest on the GOES X-ray scale.',
    },
  }
  const row = map[letter]
  if (!row) return null
  return `${en ? row.en : row.es} ${en ? 'Shown as reported by NASA; not a crew risk score.' : 'Se muestra como lo informó NASA; no es una puntuación de riesgo para la tripulación.'}`
}

export function formatDonkiWhen(iso: string | null | undefined, lang: 'es' | 'en'): string {
  if (!iso) return '—'
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return iso
  const locale = lang === 'en' ? 'en-GB' : 'es'
  const day = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
    .format(ms)
    .replace(/\./g, '')
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(ms)
  return `${day} · ${time} UTC`
}

/** Resumen estructurado en español/inglés a partir de campos, sin inventar exposición. */
export function structuredDonkiSummary(event: WeatherEvent, en: boolean): string {
  const label = DONKI_TYPE_LABEL[event.type]
  const name = en ? label.en : label.es
  const classPart = event.classification
    ? en
      ? ` Reported classification: ${event.classification}.`
      : ` Clasificación informada: ${event.classification}.`
    : ''
  const when = formatDonkiWhen(event.beginTime ?? event.timestamp, en ? 'en' : 'es')
  const instruments =
    event.instruments && event.instruments.length
      ? en
        ? ` Instruments noted: ${event.instruments.slice(0, 3).join(', ')}.`
        : ` Instrumentos anotados: ${event.instruments.slice(0, 3).join(', ')}.`
      : ''
  const base = en
    ? `${name} recorded by NASA DONKI. Event time: ${when}.${classPart}${instruments} This is environmental context, not a personal exposure measurement.`
    : `${name} registrada por NASA DONKI. Momento del evento: ${when}.${classPart}${instruments} Es contexto ambiental, no una medición de exposición personal.`
  return base
}

export function donkiCardTitle(type: DonkiType, en: boolean): string {
  const row = DONKI_TYPE_LABEL[type]
  return en ? `${row.en} — ${row.short}` : `${row.es} — ${row.short}`
}
