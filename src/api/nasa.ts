import { EVA_METABOLIC_BANDS, NASA_SOURCES, OSDR_DEMO_STUDIES, type NasaSource } from '../../shared/nasaSources'
import { apiUrl } from './baseUrl'

export type OsdrStudyResponse = {
  courtesy: string
  studyId: string
  cached?: boolean
  fetchedAt?: string
  sourceUrl?: string
  repoUrl: string
  metadata?: {
    present: boolean
    title: string | null
    description: string | null
    organism: string | null
    researchType?: string | null
    conditions?: string | null
    mission?: string | null
    factor: string | null
  }
  limitation?: string
  message?: string
  url?: string
}

export async function fetchNasaSources(signal?: AbortSignal): Promise<{
  sources: readonly NasaSource[]
  evaMetabolicBandsBtuHr: typeof EVA_METABOLIC_BANDS
  courtesy: string
  fromApi: boolean
}> {
  try {
    const response = await fetch(apiUrl('/api/nasa/sources'), { signal })
    if (!response.ok) throw new Error('sources unavailable')
    const data = (await response.json()) as {
      sources: NasaSource[]
      evaMetabolicBandsBtuHr: typeof EVA_METABOLIC_BANDS
      courtesy: string
    }
    return { ...data, fromApi: true }
  } catch {
    return {
      sources: NASA_SOURCES,
      evaMetabolicBandsBtuHr: EVA_METABOLIC_BANDS,
      courtesy: 'Data are courtesy of the NASA Open Science Data Repository',
      fromApi: false,
    }
  }
}

export async function fetchOsdrStudy(studyId: string, signal?: AbortSignal): Promise<OsdrStudyResponse> {
  const response = await fetch(apiUrl(`/api/nasa/osdr/studies/${encodeURIComponent(studyId)}`), { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000) })
  const data = (await response.json().catch(() => ({}))) as OsdrStudyResponse & {
    message?: string
    url?: string
  }
  if (!response.ok) {
    return {
      courtesy: 'Data are courtesy of the NASA Open Science Data Repository',
      studyId,
      repoUrl: data.url ?? `https://osdr.nasa.gov/bio/repo/data/studies/${studyId}`,
      message: data.message ?? 'OSDR no disponible ahora.',
      limitation: 'Se conserva el enlace documental. HELIOS no inventa datos clínicos.',
    }
  }
  return data
}

export { OSDR_DEMO_STUDIES }
