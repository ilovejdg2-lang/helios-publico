import type { HealthIndicatorReading, IndicatorKind } from '../platform/api'
import { DEMO_REVIEW_PROTOCOL } from './demoReviewProtocol'

export type IndicatorVisualState =
  | 'no_data'
  | 'available'
  | 'change_observed'
  | 'needs_check'
  | 'professional_review'
  | 'stale'

export type IndicatorExplain = {
  what: { es: string; en: string }
  why: { es: string; en: string }
  factors: { es: string; en: string }
  howToRecord: { es: string; en: string }
  whenToReview: { es: string; en: string }
  limits: { es: string; en: string }
  sources: { title: string; url: string }[]
}

export type IndicatorCatalogEntry = {
  kind: IndicatorKind
  name: { es: string; en: string }
  unit: string
  needsSecondary: boolean
  secondaryLabel?: { es: string; en: string }
  bodyRegion: string | null
  moodScale?: { value: number; es: string; en: string }[]
  explain: IndicatorExplain
}

/** Challenge-aligned indicator catalog. Demo review rules are labeled as demonstration only. */
export const INDICATOR_CATALOG: IndicatorCatalogEntry[] = [
  {
    kind: 'heart_rate',
    name: { es: 'Frecuencia cardíaca', en: 'Heart rate' },
    unit: 'bpm',
    needsSecondary: false,
    bodyRegion: 'chest',
    explain: {
      what: {
        es: 'Pulsaciones por minuto registradas en un momento concreto.',
        en: 'Beats per minute recorded at a specific moment.',
      },
      why: {
        es: 'Ayuda a ver cambios de ritmo en reposo o tras actividad durante la misión.',
        en: 'Helps spot rhythm changes at rest or after activity during the mission.',
      },
      factors: {
        es: 'Ejercicio, cafeína, estrés, posturas y calidad del sensor afectan la lectura.',
        en: 'Exercise, caffeine, stress, posture and sensor quality affect the reading.',
      },
      howToRecord: {
        es: 'Si es manual, anotá valor, hora, contexto (reposo/actividad) y origen. No inventes un valor desde una cámara sin método validado.',
        en: 'For manual entry, record value, time, context (rest/activity) and origin. Do not invent a camera-based value without a validated method.',
      },
      whenToReview: {
        es: 'Regla de demostración HELIOS: variación ≥20 bpm respecto al registro previo → “cambio observado” (no es diagnóstico).',
        en: 'HELIOS demonstration rule: ≥20 bpm change vs previous reading → “change observed” (not a diagnosis).',
      },
      limits: {
        es: 'Un número aislado no describe toda la salud cardiovascular ni descarta riesgos espaciales.',
        en: 'A single number does not describe full cardiovascular health or rule out spaceflight risks.',
      },
      sources: [
        { title: 'NASA Human Research Program · Hazards', url: 'https://www.nasa.gov/hrp/hazards/' },
        { title: 'NASA HRP Risks', url: 'https://www.nasa.gov/hrp/risks/' },
      ],
    },
  },
  {
    kind: 'blood_pressure',
    name: { es: 'Presión arterial', en: 'Blood pressure' },
    unit: 'mmHg',
    needsSecondary: true,
    secondaryLabel: { es: 'Diastólica', en: 'Diastolic' },
    bodyRegion: 'arm',
    explain: {
      what: {
        es: 'Par sistólica / diastólica en mmHg. Nunca un solo número ambiguo.',
        en: 'Systolic / diastolic pair in mmHg. Never a single ambiguous number.',
      },
      why: {
        es: 'Permite seguir tendencias de presión bajo gravedad alterada y rutina a bordo.',
        en: 'Supports tracking pressure trends under altered gravity and onboard routine.',
      },
      factors: {
        es: 'Brazo, postura, actividad reciente y calibración del equipo cambian el resultado.',
        en: 'Arm, posture, recent activity and device calibration change the result.',
      },
      howToRecord: {
        es: 'Registrá sistólica y diastólica por separado, con el procedimiento del equipo disponible a bordo.',
        en: 'Record systolic and diastolic separately, following the procedure of the device available onboard.',
      },
      whenToReview: {
        es: 'Regla demo: si falta un componente del par, el sistema pide completar datos (no estima el valor).',
        en: 'Demo rule: if either component is missing, the system asks to complete data (it does not estimate the value).',
      },
      limits: {
        es: 'HELIOS no diagnostica hipertensión ni prescribe tratamiento.',
        en: 'HELIOS does not diagnose hypertension or prescribe treatment.',
      },
      sources: [{ title: 'NASA HRP Risks', url: 'https://www.nasa.gov/hrp/risks/' }],
    },
  },
  {
    kind: 'spo2',
    name: { es: 'SpO₂', en: 'SpO₂' },
    unit: '%',
    needsSecondary: false,
    bodyRegion: 'hand',
    explain: {
      what: { es: 'Saturación de oxígeno estimada por pulso.', en: 'Estimated pulse oxygen saturation.' },
      why: { es: 'Complementa el seguimiento respiratorio/cardíaco en el prototipo.', en: 'Complements respiratory/cardiac follow-up in the prototype.' },
      factors: { es: 'Movimiento, frío en dedos y mala colocación degradan la calidad.', en: 'Motion, cold fingers and poor placement degrade quality.' },
      howToRecord: { es: 'Anotá % , hora, origen y calidad percibida.', en: 'Note %, time, origin and perceived quality.' },
      whenToReview: { es: 'Si la calidad es pobre o el dato es antiguo, pedí una nueva medición.', en: 'If quality is poor or the reading is stale, request a new measurement.' },
      limits: { es: 'No sustituye gasometría ni evaluación clínica.', en: 'Does not replace blood gas analysis or clinical assessment.' },
      sources: [{ title: 'NASA HRP Hazards', url: 'https://www.nasa.gov/hrp/hazards/' }],
    },
  },
  {
    kind: 'glucose',
    name: { es: 'Glucosa', en: 'Glucose' },
    unit: 'mg/dL',
    needsSecondary: false,
    bodyRegion: null,
    explain: {
      what: { es: 'Concentración de glucosa reportada en mg/dL.', en: 'Reported glucose concentration in mg/dL.' },
      why: { es: 'Permite registrar valores manuales cuando hay equipo o protocolo a bordo.', en: 'Allows manual values when onboard equipment or protocol exists.' },
      factors: { es: 'Ayuno, comidas recientes y tipo de muestra cambian la lectura.', en: 'Fasting, recent meals and sample type change the reading.' },
      howToRecord: { es: 'Usá el procedimiento del dispositivo disponible; no copies pasos de otro equipo.', en: 'Follow the available device procedure; do not copy steps from another device.' },
      whenToReview: { es: 'Datos faltantes o antiguos → completar información, no asumir normalidad.', en: 'Missing or stale data → complete information; do not assume normality.' },
      limits: { es: 'No es diagnóstico de diabetes ni indica dosis.', en: 'Not a diabetes diagnosis and does not imply dosing.' },
      sources: [{ title: 'NASA OSDR', url: 'https://osdr.nasa.gov/bio/repo/' }],
    },
  },
  {
    kind: 'temperature',
    name: { es: 'Temperatura corporal', en: 'Body temperature' },
    unit: '°C',
    needsSecondary: false,
    bodyRegion: null,
    explain: {
      what: { es: 'Temperatura corporal en grados Celsius.', en: 'Body temperature in Celsius.' },
      why: { es: 'Útil para seguimiento de malestar o fiebre reportada.', en: 'Useful for follow-up of reported discomfort or fever.' },
      factors: { es: 'Sitio de medición, ambiente de cabina y actividad reciente.', en: 'Measurement site, cabin environment and recent activity.' },
      howToRecord: { es: 'Indicá método disponible a bordo y contexto.', en: 'State the onboard method available and context.' },
      whenToReview: { es: 'Regla demo: cambio ≥1.0 °C vs registro previo → “cambio observado”.', en: 'Demo rule: ≥1.0 °C change vs previous → “change observed”.' },
      limits: { es: 'No confirma infección por sí sola.', en: 'Does not confirm infection by itself.' },
      sources: [{ title: 'NASA HRP Hazards', url: 'https://www.nasa.gov/hrp/hazards/' }],
    },
  },
  {
    kind: 'respiratory_rate',
    name: { es: 'Frecuencia respiratoria', en: 'Respiratory rate' },
    unit: 'rpm',
    needsSecondary: false,
    bodyRegion: 'chest',
    explain: {
      what: { es: 'Respiraciones por minuto.', en: 'Breaths per minute.' },
      why: { es: 'Complementa SpO₂ y estado físico en el chequeo diario.', en: 'Complements SpO₂ and physical state in the daily check-in.' },
      factors: { es: 'Ejercicio, ansiedad y conteo manual imperfecto.', en: 'Exercise, anxiety and imperfect manual counting.' },
      howToRecord: { es: 'Contá durante el intervalo definido por el protocolo de demostración a bordo.', en: 'Count over the interval defined by the onboard demonstration protocol.' },
      whenToReview: { es: 'Si falta el dato, el estado es “sin datos”, no “normal”.', en: 'If missing, status is “no data”, not “normal”.' },
      limits: { es: 'Conteo manual puede ser impreciso; no es diagnóstico.', en: 'Manual counting can be imprecise; not a diagnosis.' },
      sources: [{ title: 'NASA HRP Risks', url: 'https://www.nasa.gov/hrp/risks/' }],
    },
  },
  {
    kind: 'sleep_hours',
    name: { es: 'Horas de sueño', en: 'Sleep hours' },
    unit: 'h',
    needsSecondary: false,
    bodyRegion: null,
    explain: {
      what: { es: 'Duración estimada de sueño en horas para un periodo.', en: 'Estimated sleep duration in hours for a period.' },
      why: { es: 'Relaciona descanso con fatiga y aislamiento en misiones largas.', en: 'Links rest with fatigue and isolation on long missions.' },
      factors: { es: 'Turnos, luces de cabina y siestas.', en: 'Shifts, cabin lighting and naps.' },
      howToRecord: { es: 'Preferí episodios de sueño con inicio/fin; este campo resume horas.', en: 'Prefer sleep episodes with start/end; this field summarizes hours.' },
      whenToReview: { es: 'Un recordatorio vencido de sueño es pendiente, no evidencia de enfermedad.', en: 'An overdue sleep reminder is pending work, not evidence of illness.' },
      limits: { es: 'Autorreporte; no mide arquitectura del sueño.', en: 'Self-report; does not measure sleep architecture.' },
      sources: [{ title: 'NASA HRP Hazards · Isolation', url: 'https://www.nasa.gov/hrp/hazards/' }],
    },
  },
  {
    kind: 'mood',
    name: { es: 'Estado de ánimo (autorreporte)', en: 'Mood (self-report)' },
    unit: 'mood_1_5',
    needsSecondary: false,
    bodyRegion: null,
    moodScale: [
      { value: 1, es: '1 · Muy bajo', en: '1 · Very low' },
      { value: 2, es: '2 · Bajo', en: '2 · Low' },
      { value: 3, es: '3 · Neutral', en: '3 · Neutral' },
      { value: 4, es: '4 · Bien', en: '4 · Good' },
      { value: 5, es: '5 · Muy bien', en: '5 · Very good' },
    ],
    explain: {
      what: {
        es: 'Autorreporte emocional en escala 1–5. No es un diagnóstico clínico.',
        en: 'Emotional self-report on a 1–5 scale. Not a clinical diagnosis.',
      },
      why: {
        es: 'Ayuda a notar cambios de bienestar en aislamiento y confinamiento.',
        en: 'Helps notice wellbeing changes under isolation and confinement.',
      },
      factors: {
        es: 'Sueño, carga de trabajo, noticias de Tierra y dinámica de tripulación.',
        en: 'Sleep, workload, Earth news and crew dynamics.',
      },
      howToRecord: {
        es: 'Elegí el número que mejor describe cómo te sentís ahora, sin “corregir” hacia lo esperado.',
        en: 'Pick the number that best describes how you feel now, without “correcting” toward expectations.',
      },
      whenToReview: {
        es: 'Regla demo: valor ≤2 → sugerir revisión con psicólogo / Quirón emocional (no diagnostica).',
        en: 'Demo rule: value ≤2 → suggest psychologist / emotional Quirón review (does not diagnose).',
      },
      limits: {
        es: 'No convierte el ánimo en trastorno ni oculta la opción de pedir ayuda.',
        en: 'Does not turn mood into a disorder and never hides the option to seek help.',
      },
      sources: [{ title: 'NASA HRP · Behavioral health risks', url: 'https://www.nasa.gov/hrp/risks/' }],
    },
  },
]

export function catalogEntry(kind: IndicatorKind) {
  return INDICATOR_CATALOG.find((item) => item.kind === kind)
}

export function formatIndicatorValue(reading: HealthIndicatorReading, en: boolean) {
  if (reading.kind === 'blood_pressure') {
    return `${reading.value}/${reading.valueSecondary ?? '—'} ${reading.unit}`
  }
  if (reading.kind === 'mood') {
    const label = catalogEntry('mood')?.moodScale?.find((s) => s.value === reading.value)
    return label ? (en ? label.en : label.es) : `${reading.value}/5`
  }
  return `${reading.value} ${reading.unit}`
}

export function isStale(reading: HealthIndicatorReading, now = Date.now()) {
  return now - reading.measuredAt > reading.staleAfterMs
}

export type IndicatorEvaluation = {
  state: IndicatorVisualState
  reason: { es: string; en: string }
  nextStep: { es: string; en: string }
  protocolId: string
  ruleId: string | null
}

/** Explicit HELIOS-DEMO-REVIEW-v1 rules — not clinical thresholds. */
export function evaluateIndicatorState(
  latest: HealthIndicatorReading | undefined,
  previous: HealthIndicatorReading | undefined,
): IndicatorEvaluation {
  const protocolId = DEMO_REVIEW_PROTOCOL.id
  if (!latest) {
    return {
      state: 'no_data',
      reason: { es: 'Sin registro disponible.', en: 'No reading available.' },
      nextStep: { es: 'Completá una medición manual.', en: 'Complete a manual measurement.' },
      protocolId,
      ruleId: null,
    }
  }
  if (isStale(latest)) {
    return {
      state: 'stale',
      reason: { es: 'Dato antiguo (ventana de frescura del protocolo demo).', en: 'Stale data (demo protocol freshness window).' },
      nextStep: { es: 'Registrá una medición actualizada.', en: 'Log an updated measurement.' },
      protocolId,
      ruleId: 'quality-poor',
    }
  }
  if (latest.quality === 'poor') {
    return {
      state: 'needs_check',
      reason: { es: 'Calidad marcada como pobre (protocolo demo).', en: 'Quality marked as poor (demo protocol).' },
      nextStep: { es: 'Repetí la medición y anotá el contexto.', en: 'Repeat the measurement and note context.' },
      protocolId,
      ruleId: 'quality-poor',
    }
  }
  if (latest.kind === 'mood' && latest.value <= 2) {
    return {
      state: 'professional_review',
      reason: {
        es: `Autorreporte bajo · regla ${protocolId}/mood-le-2. No es un diagnóstico.`,
        en: `Low self-report · rule ${protocolId}/mood-le-2. Not a diagnosis.`,
      },
      nextStep: {
        es: 'Abrí Quirón emocional o solicitá cita con psicología.',
        en: 'Open emotional Quirón or request a psychology appointment.',
      },
      protocolId,
      ruleId: 'mood-le-2',
    }
  }
  if (previous) {
    if (latest.kind === 'heart_rate' && Math.abs(latest.value - previous.value) >= 20) {
      return {
        state: 'change_observed',
        reason: {
          es: `Cambio ≥20 bpm · regla ${protocolId}/hr-delta-20 (demostración, no clínica).`,
          en: `≥20 bpm change · rule ${protocolId}/hr-delta-20 (demonstration, not clinical).`,
        },
        nextStep: { es: 'Revisá con médico de misión si el cambio persiste.', en: 'Review with mission medic if the change persists.' },
        protocolId,
        ruleId: 'hr-delta-20',
      }
    }
    if (latest.kind === 'temperature' && Math.abs(latest.value - previous.value) >= 1) {
      return {
        state: 'change_observed',
        reason: {
          es: `Cambio ≥1 °C · regla ${protocolId}/temp-delta-1 (demostración, no clínica).`,
          en: `≥1 °C change · rule ${protocolId}/temp-delta-1 (demonstration, not clinical).`,
        },
        nextStep: { es: 'Registrá síntomas y pedí revisión si hace falta.', en: 'Log symptoms and request review if needed.' },
        protocolId,
        ruleId: 'temp-delta-1',
      }
    }
  }
  return {
    state: 'available',
    reason: { es: 'Registro disponible. “Sin alertas” ≠ salud perfecta.', en: 'Reading available. “No alerts” ≠ perfect health.' },
    nextStep: { es: 'Podés ver el historial o registrar otro indicador.', en: 'You can view history or log another indicator.' },
    protocolId,
    ruleId: null,
  }
}

export function stateLabel(state: IndicatorVisualState, en: boolean) {
  const map: Record<IndicatorVisualState, { es: string; en: string }> = {
    no_data: { es: 'Sin datos', en: 'No data' },
    available: { es: 'Registro disponible', en: 'Reading available' },
    change_observed: { es: 'Cambio observado', en: 'Change observed' },
    needs_check: { es: 'Requiere comprobación', en: 'Needs check' },
    professional_review: { es: 'Revisión profesional pendiente', en: 'Professional review pending' },
    stale: { es: 'Dato antiguo', en: 'Stale data' },
  }
  return en ? map[state].en : map[state].es
}
