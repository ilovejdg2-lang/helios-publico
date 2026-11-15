/**
 * HELIOS demonstration review protocol.
 * Explicitly NOT clinical guidelines and NOT NASA-approved thresholds.
 */
export const DEMO_REVIEW_PROTOCOL = {
  id: 'HELIOS-DEMO-REVIEW-v1',
  version: '1.0.0',
  updatedAt: '2026-11-15',
  title: {
    es: 'Protocolo de revisión de demostración HELIOS',
    en: 'HELIOS demonstration review protocol',
  },
  disclaimer: {
    es: 'Estas reglas son del prototipo HELIOS para demostrar “cambio observado → siguiente paso”. No son umbrales clínicos, no diagnostican y no están aprobadas por NASA.',
    en: 'These rules belong to the HELIOS prototype to demonstrate “change observed → next step”. They are not clinical thresholds, do not diagnose, and are not NASA-approved.',
  },
  rules: [
    {
      id: 'hr-delta-20',
      kind: 'heart_rate',
      summary: {
        es: 'Δ ≥ 20 bpm vs lectura previa del mismo tripulante → estado “cambio observado”.',
        en: 'Δ ≥ 20 bpm vs previous reading for the same crewmember → “change observed”.',
      },
      nextStep: {
        es: 'Repetir medición en reposo; si persiste, pedir revisión profesional.',
        en: 'Repeat at rest; if it persists, request professional review.',
      },
    },
    {
      id: 'temp-delta-1',
      kind: 'temperature',
      summary: {
        es: 'Δ ≥ 1.0 °C vs lectura previa → “cambio observado”.',
        en: 'Δ ≥ 1.0 °C vs previous reading → “change observed”.',
      },
      nextStep: {
        es: 'Registrar síntomas asociados y solicitar revisión si hace falta.',
        en: 'Log related symptoms and request review if needed.',
      },
    },
    {
      id: 'mood-le-2',
      kind: 'mood',
      summary: {
        es: 'Autorreporte ≤ 2/5 → “revisión profesional pendiente” (no diagnóstico).',
        en: 'Self-report ≤ 2/5 → “professional review pending” (not a diagnosis).',
      },
      nextStep: {
        es: 'Abrir Quirón emocional o citar psicología.',
        en: 'Open emotional Quirón or book psychology.',
      },
    },
    {
      id: 'quality-poor',
      kind: '*',
      summary: {
        es: 'Calidad “pobre” o dato fuera de ventana de frescura → “requiere comprobación” / “dato antiguo”.',
        en: '“Poor” quality or outside freshness window → “needs check” / “stale”.',
      },
      nextStep: {
        es: 'Completar o repetir el registro; no asumir normalidad.',
        en: 'Complete or repeat the log; do not assume normality.',
      },
    },
    {
      id: 'bp-pair-required',
      kind: 'blood_pressure',
      summary: {
        es: 'La presión arterial exige sistólica y diastólica; no se estima el par faltante.',
        en: 'Blood pressure requires systolic and diastolic; missing values are not estimated.',
      },
      nextStep: {
        es: 'Completar ambos valores del equipo disponible a bordo.',
        en: 'Complete both values with the onboard device available.',
      },
    },
  ],
} as const

export function protocolBadge(en: boolean) {
  return en
    ? `${DEMO_REVIEW_PROTOCOL.id} · demonstration only`
    : `${DEMO_REVIEW_PROTOCOL.id} · solo demostración`
}
