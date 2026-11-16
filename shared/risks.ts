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
    title: 'Insufficient sleep, circadian disruption and overload',
    summary: 'Fatigue, disrupted sleep and workload can affect performance and wellbeing.',
    category: 'planificacion',
    sourceTitle: 'NASA Human Research Roadmap · Sleep Risk',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=100',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Provides context for rest monitoring, fatigue symptoms and preparation.',
    limitation: 'Does not authorize treatment or set a clinical threshold in this prototype.',
  },
  {
    id: 'risk-bmed',
    title: 'Behavioral health and team adaptation',
    summary: 'Isolation and team dynamics may require emotional support and specialist follow-up.',
    category: 'entrenamiento',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Supports the private Quirón Bot space and requests for psychological support.',
    limitation: 'Private conversation is not validated clinical therapy.',
  },
  {
    id: 'risk-nutrition',
    title: 'Nutrition',
    summary: 'Adequate nutrition requires supply planning, storage and individual follow-up.',
    category: 'suministro',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Informs preparation categories and the simulated supplement inventory.',
    limitation: 'Does not propose a menu or personalized doses.',
  },
  {
    id: 'risk-msk-cv',
    title: 'Musculoskeletal and cardiovascular changes',
    summary: 'Microgravity affects muscles, bones and the cardiovascular system; exercise and evaluation matter.',
    category: 'entrenamiento',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Highlights evaluation reviews and reusable onboard equipment.',
    limitation: 'Does not prescribe an exercise protocol.',
  },
  {
    id: 'risk-immune',
    title: 'Immune function and interaction with microorganisms',
    summary: 'The enclosed environment and mission stress can influence immunity and hygiene.',
    category: 'suministro',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Includes hygiene and common contingency supplies in the preparation list.',
    limitation: 'Does not recommend antibiotics or treatments.',
  },
  {
    id: 'risk-sensorimotor',
    title: 'Sensorimotor changes',
    summary: 'Orientation and sensorimotor adaptation changes may occur during transit and landing.',
    category: 'planificacion',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Supports follow-up of symptoms such as dizziness and Mission Review items.',
    limitation: 'Does not diagnose vertigo or prescribe medication.',
  },
  {
    id: 'risk-renal',
    title: 'Kidney stones',
    summary: 'Renal risk is documented in the HRP; it requires medical review and resource planning.',
    category: 'equipo',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Identifies evaluation categories for the medical team, not a self-medication kit.',
    limitation: 'Only flags the need for review; does not approve a specific product.',
  },
  {
    id: 'risk-sans',
    title: 'Neuro-ocular changes',
    summary: 'Vision-related changes in space require specialist follow-up.',
    category: 'equipo',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Includes pending preparation and Mission Review items.',
    limitation: 'Does not interpret eye measurements that are absent from this simulator.',
  },
  {
    id: 'risk-eva',
    title: 'EVA, hypoxia and decompression',
    summary: 'Extravehicular activities involve documented atmospheric and decompression risks.',
    category: 'proteccion',
    sourceTitle: 'NASA OCHMO · Medical Operations',
    sourceUrl: 'https://www.nasa.gov/reference/6-0-medical-operations/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Highlights planning and protection; does not replace an EVA procedure.',
    limitation: 'Does not improvise emergency steps.',
  },
  {
    id: 'risk-eva-metabolic',
    title: 'Metabolic exertion and monitoring during EVA',
    summary:
      'NASA literature documents heart rate and metabolic rate (BTU/hr) during EVA. xEMU reference ranges: low ≤700, medium 700–1000, high ≥1000, with a historical design limit of ~1600 BTU/hr. Heart rate alone is insufficient: psychogenic factors, age, sex and environment affect it.',
    category: 'equipo',
    sourceTitle: 'NTRS 20120003917 / NTRS 20220009964 · EVA metabolic monitoring',
    sourceUrl: 'https://ntrs.nasa.gov/citations/20220009964',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Provides context for exertion alerts and EVA preparation. The prototype does not receive live EMU/xEMU telemetry (it is not public).',
    limitation: 'Does not calibrate clinical thresholds or simulate a real PLSS; only documents published ranges.',
  },
  {
    id: 'risk-dust',
    title: 'Celestial dust exposure',
    summary: 'Lunar or planetary dust can affect airways and habitat hygiene.',
    category: 'habitat',
    sourceTitle: 'NASA OCHMO Technical Briefs',
    sourceUrl: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Supports hygiene and habitat categories in preparation.',
    limitation: 'Does not calibrate real environmental sensors in this MVP.',
  },
  {
    id: 'risk-radiation',
    title: 'Radiation',
    summary: 'Space radiation exposure is a long-duration mission risk.',
    category: 'proteccion',
    sourceTitle: 'NASA OSDR / Biological & Physical Sciences data',
    sourceUrl: 'https://science.nasa.gov/biological-physical/data/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Scientific reference for mission review; the prototype does not calculate dose.',
    limitation: 'This simulator does not ingest OSDR datasets or calculate exposure.',
  },
  {
    id: 'risk-med-stability',
    title: 'Medication efficacy and storage on extended missions',
    summary: 'Medication and supply stability requires appropriate storage conditions and authorized review.',
    category: 'suministro',
    sourceTitle: 'NASA Human Research Roadmap · Evidence',
    sourceUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    sourceDate: 'consultado 2026-11-14',
    useInSystem: 'Distinguishes proposed supplies from approved and verified inventory.',
    limitation: 'HELIOS does not list medications for crew members to choose on their own.',
  },
] as const

export function riskById(id: string): NasaRisk | undefined {
  return NASA_RISKS.find((item) => item.id === id)
}

export const RISK_CATEGORY_LABEL: Record<RiskCategory, string> = {
  entrenamiento: 'Training',
  planificacion: 'Planning',
  equipo: 'Equipment / evaluation',
  suministro: 'Supplies',
  habitat: 'Habitat',
  proteccion: 'Spacecraft protection',
}
