import { useEffect, useState } from 'react'
import {
  fetchOsdrStudy,
  OSDR_DEMO_STUDIES,
  type OsdrStudyResponse,
} from '../api/nasa'
import { useLocale } from '../i18n'
export function ScientificInsights() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [studies, setStudies] = useState<OsdrStudyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setStudies([])
    void Promise.all(
      OSDR_DEMO_STUDIES.map(async (id) => {
        try {
          return await fetchOsdrStudy(id, controller.signal)
        } catch {
          return {
            studyId: id,
            courtesy: 'NASA OSDR',
            repoUrl: `https://osdr.nasa.gov/bio/repo/data/studies/${id}`,
            message: 'unavailable',
          }
        }
      }),
    ).then((values) => {
      if (!controller.signal.aborted) {
        setStudies(values)
        setLoading(false)
      }
    })
    return () => controller.abort()
  }, [attempt])
  const liveCount = studies.filter((s) => s.fetchedAt && !s.message).length
  const cachedCount = studies.filter((s) => s.cached).length
  return (
    <section className="panel" data-testid="nasa-osdr-provenance">
      <h2>Scientific Health Insights · OSDR</h2>
      <p className="badge">
        {en
          ? `Provenance · Nest GET /api/nasa/osdr · live ${liveCount}/${OSDR_DEMO_STUDIES.length}${cachedCount ? ` · cached ${cachedCount}` : ''}`
          : `Procedencia · Nest GET /api/nasa/osdr · en vivo ${liveCount}/${OSDR_DEMO_STUDIES.length}${cachedCount ? ` · caché ${cachedCount}` : ''}`}
      </p>
      <p>
        {en
          ? 'Research metadata for educational context. Data are courtesy of the NASA Open Science Data Repository.'
          : 'Metadatos de investigación para contexto educativo. Datos cortesía de NASA Open Science Data Repository.'}
      </p>
      <p className="callout callout-amber">
        {en
          ? 'Animal results do not establish clinical conclusions for humans. Metadata alone cannot support causal claims or medical recommendations. This is not personal astronaut telemetry.'
          : 'Los resultados en animales no establecen conclusiones clínicas para humanos. Los metadatos por sí solos no fundamentan causalidad ni recomendaciones médicas. No es telemetría personal del astronauta.'}
      </p>
      <button
        className="chip"
        type="button"
        onClick={() => setAttempt((a) => a + 1)}
      >
        {en ? 'Refresh' : 'Actualizar'}
      </button>
      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <p>{en ? 'Loading OSDR…' : 'Consultando OSDR…'}</p>
        ) : (
          <div className="nasa-events">
            {studies.map((study) => (
              <article
                key={study.studyId}
                className="nasa-event"
                data-testid={`osdr-${study.studyId}`}
              >
                <p className="badge">NASA Research Metadata · OSDR</p>
                <h3>{study.metadata?.title ?? study.studyId}</h3>
                {study.message && (
                  <p role="alert">
                    {en
                      ? 'OSDR unavailable. No metadata generated.'
                      : 'OSDR no disponible. No se generaron metadatos.'}
                  </p>
                )}
                {study.metadata && !study.metadata.present && (
                  <p>
                    {en
                      ? 'No metadata supplied.'
                      : 'Sin metadatos suministrados.'}
                  </p>
                )}
                <p>{study.metadata?.description}</p>
                <dl>
                  {[
                    [
                      en ? 'Organism / population' : 'Organismo / población',
                      study.metadata?.organism,
                    ],
                    [
                      en ? 'Research type' : 'Tipo de investigación',
                      study.metadata?.researchType,
                    ],
                    [
                      en ? 'Experimental factors' : 'Factores experimentales',
                      study.metadata?.conditions,
                    ],
                    [en ? 'Mission' : 'Misión', study.metadata?.mission],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>
                        {value || (en ? 'Not supplied' : 'No suministrado')}
                      </dd>
                    </div>
                  ))}
                </dl>
                {study.fetchedAt && (
                  <p className="muted">
                    {study.cached
                      ? en
                        ? 'Cached metadata'
                        : 'Metadatos en caché'
                      : en
                        ? 'Retrieved from NASA'
                        : 'Consultado en NASA'}{' '}
                    · {study.fetchedAt}
                  </p>
                )}
                <a href={study.repoUrl} target="_blank" rel="noreferrer">
                  {en ? 'Open scientific study' : 'Abrir estudio científico'}
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
