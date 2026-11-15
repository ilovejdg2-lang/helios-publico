/** Catálogo documental NASA usado por HELIOS. No calibra reglas clínicas. */
export interface NasaSource {
  id: string
  title: string
  url: string
  kind: 'hrr' | 'ochmo' | 'osdr' | 'ntrs' | 'env' | 'ops'
  useInSystem: string
  courtesy?: string
}

export const NASA_SOURCES: readonly NasaSource[] = [
  {
    id: 'src-hrr-evidence',
    title: 'Human Research Roadmap · Evidence',
    url: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    kind: 'hrr',
    useInSystem: 'Biblioteca de riesgos de salud humana en el espacio.',
  },
  {
    id: 'src-medical-ops',
    title: 'NASA Medical Operations (6.0)',
    url: 'https://www.nasa.gov/reference/6-0-medical-operations/',
    kind: 'ops',
    useInSystem: 'Referencia de operaciones médicas y diseño para tripulaciones.',
  },
  {
    id: 'src-ochmo-briefs',
    title: 'OCHMO Technical Briefs',
    url: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
    kind: 'ochmo',
    useInSystem: 'Documentación técnica de salud y atención médica espacial.',
  },
  {
    id: 'src-bps-data',
    title: 'Biological & Physical Sciences data',
    url: 'https://science.nasa.gov/biological-physical/data/',
    kind: 'osdr',
    useInSystem: 'Portal a datos abiertos de biología espacial / OSDR.',
  },
  {
    id: 'src-osd-288',
    title: 'OSDR study OSD-288',
    url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-288',
    kind: 'osdr',
    useInSystem: 'Estudio de referencia; el prototipo consulta metadatos, no interpreta clínica.',
    courtesy: 'Data are courtesy of the NASA Open Science Data Repository',
  },
  {
    id: 'src-osd-575',
    title: 'OSDR study OSD-575 (Inspiration4 serum metabolic panel)',
    url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-575',
    kind: 'osdr',
    useInSystem: 'Ejemplo de datos humanos abiertos citados en el reto; HELIOS no diagnostica con ellos.',
    courtesy: 'Data are courtesy of the NASA Open Science Data Repository',
  },
  {
    id: 'src-iss-env',
    title: 'OSDR Tutorials · telemetría ambiental ISS',
    url: 'https://github.com/nasa/OSDR_Tutorials/blob/main/source/pages/guides/environmental_data_application.md',
    kind: 'env',
    useInSystem: 'Guía de temperatura, humedad y CO₂ históricos de la ISS (documental en este MVP).',
  },
  {
    id: 'src-osdr-api',
    title: 'OSDR Biological Data API',
    url: 'https://visualization.osdr.nasa.gov/biodata/api',
    kind: 'osdr',
    useInSystem: 'API pública sin llave para metadatos de estudios.',
  },
  {
    id: 'src-ntrs-mr-eva',
    title: 'NTRS 20120003917 · monitoreo de tasa metabólica en EVA',
    url: 'https://ntrs.nasa.gov/api/citations/20120003917/downloads/20120003917.pdf',
    kind: 'ntrs',
    useInSystem: 'Justifica por qué la FC sola no basta y por qué HELIOS explica alertas con límites.',
  },
  {
    id: 'src-ntrs-xemu-mr',
    title: 'NTRS 20220009964 · tasa metabólica xEMU',
    url: 'https://ntrs.nasa.gov/citations/20220009964',
    kind: 'ntrs',
    useInSystem: 'Rangos de referencia de esfuerzo metabólico EVA (baja/media/alta) para contexto de simulación.',
  },
  {
    id: 'src-hs3',
    title: 'ICES 2023 · HS3 EVA simulator',
    url: 'https://ntrs.nasa.gov/api/citations/20230002324/downloads/ICES_HS3_2023_v5_noTrackChange.pdf',
    kind: 'ntrs',
    useInSystem: 'Variables de referencia EVA (LCG, piel, movimiento, MR) como documentación, no como sensores vivos.',
  },
] as const

export const OSDR_DEMO_STUDIES = ['OSD-288', 'OSD-575'] as const

export const EVA_METABOLIC_BANDS = {
  /** BTU/hr — documentados en literatura xEMU; solo contexto de simulación. */
  lowMax: 700,
  mediumMax: 1000,
  highDesignLimit: 1600,
  sourceId: 'src-ntrs-xemu-mr',
} as const
