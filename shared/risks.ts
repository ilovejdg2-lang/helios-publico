export type RiskCategory =
  | 'entrenamiento'
  | 'planificacion'
  | 'equipo'
  | 'suministro'
  | 'habitat'
  | 'proteccion'

export interface NasaRisk {
  id: string
  title: string
  summary: string
  category: RiskCategory
  sourceTitle: string
  sourceUrl: string
  sourceDate: string
  useInSystem: string
  limitation: string
}

/** Biblioteca seleccionada. Las URLs son públicas de NASA; las reglas del simulador no se calibran con estos textos. */
export const NASA_RISKS: readonly NasaRisk[] = [
  {
    id: 'risk-sleep',
    title: 'Sueño insuficiente, desajustes circadianos y sobrecarga',
    summary: 'Fatiga, desincronización del sueño y carga de trabajo pueden afectar el rendimiento y el bienestar.',
    category: 'planificacion',
    sourceTitle: 'NASA Human Research Roadmap · Sleep Risk',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=100',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Contextualiza el monitoreo de descanso, síntomas de cansancio y la preparación previa.',
    limitation: 'No autoriza un tratamiento ni fija un umbral clínico en este prototipo.',
  },
  {
    id: 'risk-bmed',
    title: 'Salud conductual y adaptación del equipo',
    summary: 'El aislamiento y la dinámica del equipo pueden requerir apoyo emocional y seguimiento especializado.',
    category: 'entrenamiento',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Apoya el espacio privado de Quirón Bot y las solicitudes a psicología.',
    limitation: 'La conversación privada no es terapia clínica validada.',
  },
  {
    id: 'risk-nutrition',
    title: 'Nutrición',
    summary: 'La nutrición adecuada requiere planificación de suministros, conservación y seguimiento individual.',
    category: 'suministro',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Orienta categorías de preparación y el inventario de suplementos simulados.',
    limitation: 'No propone un menú ni dosis personalizadas.',
  },
  {
    id: 'risk-msk-cv',
    title: 'Cambios musculoesqueléticos y cardiovasculares',
    summary: 'La microgravedad afecta músculo, hueso y sistema cardiovascular; el ejercicio y la evaluación importan.',
    category: 'entrenamiento',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Señala revisiones de evaluación y equipos reutilizables a bordo.',
    limitation: 'No prescribe un protocolo de ejercicio.',
  },
  {
    id: 'risk-immune',
    title: 'Función inmunitaria e interacción con microorganismos',
    summary: 'El entorno cerrado y el estrés de la misión pueden influir en la inmunidad y en la higiene.',
    category: 'suministro',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Incluye material de higiene y contingencias comunes en la lista de preparación.',
    limitation: 'No indica antibióticos ni tratamientos.',
  },
  {
    id: 'risk-sensorimotor',
    title: 'Alteraciones sensoriomotoras',
    summary: 'Cambios de orientación y adaptación sensoriomotora pueden acompañar el tránsito y el aterrizaje.',
    category: 'planificacion',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Apoya el seguimiento de síntomas como mareo y las revisiones de posmisión.',
    limitation: 'No diagnostica vértigo ni prescribe medicación.',
  },
  {
    id: 'risk-renal',
    title: 'Cálculos renales',
    summary: 'El riesgo renal se documenta en el HRP; requiere revisión médica y planificación de recursos.',
    category: 'equipo',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Marca categorías de evaluación para el equipo médico, no un kit de automedicación.',
    limitation: 'Solo señala que debe revisarse; no aprueba un producto concreto.',
  },
  {
    id: 'risk-sans',
    title: 'Cambios neurooculares',
    summary: 'Los cambios asociados a la visión en el espacio requieren seguimiento especializado.',
    category: 'equipo',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Incluye revisiones pendientes en preparación y posmisión.',
    limitation: 'No interpreta una medición ocular inexistente en este simulador.',
  },
  {
    id: 'risk-eva',
    title: 'EVA, hipoxia y descompresión',
    summary: 'Las actividades extravehiculares implican riesgos de atmósfera y descompresión documentados.',
    category: 'proteccion',
    sourceTitle: 'NASA OCHMO · Medical Operations',
    sourceUrl: 'https://www.nasa.gov/reference/6-0-medical-operations/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Señala planificación y protección; no sustituye un procedimiento EVA.',
    limitation: 'No improvisa pasos de emergencia.',
  },
  {
    id: 'risk-eva-metabolic',
    title: 'Esfuerzo metabólico y monitoreo durante EVA',
    summary:
      'La literatura NASA documenta frecuencia cardíaca y tasa metabólica (BTU/hr) durante EVA. Rangos de referencia xEMU: baja ≤700, media 700–1000, alta ≥1000, con diseño histórico hasta ~1600 BTU/hr. La FC sola no basta: la afectan factores psicogénicos, edad, sexo y ambiente.',
    category: 'equipo',
    sourceTitle: 'NTRS 20120003917 / NTRS 20220009964 · EVA metabolic monitoring',
    sourceUrl: 'https://ntrs.nasa.gov/citations/20220009964',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Contextualiza alertas de esfuerzo y preparación EVA. El prototipo no recibe telemetría EMU/xEMU en vivo (no es pública).',
    limitation: 'No calibra umbrales clínicos ni simula un PLSS real; solo documenta rangos publicados.',
  },
  {
    id: 'risk-dust',
    title: 'Exposición al polvo celeste',
    summary: 'El polvo lunar o planetario puede afectar vías respiratorias e higiene del hábitat.',
    category: 'habitat',
    sourceTitle: 'NASA OCHMO Technical Briefs',
    sourceUrl: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Apoya categorías de higiene y hábitat en la preparación.',
    limitation: 'No calibra sensores ambientales reales en este MVP.',
  },
  {
    id: 'risk-radiation',
    title: 'Radiación',
    summary: 'La exposición a radiación espacial es un riesgo de misión de larga duración.',
    category: 'proteccion',
    sourceTitle: 'NASA OSDR / Biological & Physical Sciences data',
    sourceUrl: 'https://science.nasa.gov/biological-physical/data/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Referencia científica para revisión de misión; no calcula dosis en el prototipo.',
    limitation: 'Este simulador no ingiere datasets OSDR ni calcula exposición.',
  },
  {
    id: 'risk-med-stability',
    title: 'Eficacia y conservación de medicamentos en misiones prolongadas',
    summary: 'La estabilidad de medicamentos y suministros requiere condiciones de conservación y revisión autorizada.',
    category: 'suministro',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Distingue propuestas de suministro de lo aprobado y verificado en inventario.',
    limitation: 'HELIOS no lista medicamentos para que un tripulante decida por su cuenta.',
  },
] as const

export function riskById(id: string): NasaRisk | undefined {
  return NASA_RISKS.find((item) => item.id === id)
}

export const RISK_CATEGORY_LABEL: Record<RiskCategory, string> = {
  entrenamiento: 'Entrenamiento',
  planificacion: 'Planificación',
  equipo: 'Equipo / evaluación',
  suministro: 'Suministro',
  habitat: 'Hábitat',
  proteccion: 'Protección de la nave',
}
