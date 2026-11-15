import { RadiationPanel } from '../components/NasaEnvironment'
import { BookOpen, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SPACE_HAZARDS } from '../domain/spaceHazards'
import { EVA_METABOLIC_BANDS, NASA_SOURCES } from '../../shared/nasaSources'
import { NASA_RISKS, RISK_CATEGORY_LABEL, type RiskCategory } from '../../shared/risks'
import { ScientificInsights } from '../components/ScientificInsights'
import { Empty } from '../components/ui'
import { useLocale } from '../i18n'

const CATEGORIES = Object.keys(RISK_CATEGORY_LABEL) as RiskCategory[]

export function RisksPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [category, setCategory] = useState<RiskCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    return NASA_RISKS.filter((item) => {
      if (category !== 'all' && item.category !== category) return false
      if (!query.trim()) return true
      const hay = `${item.title} ${item.summary} ${item.sourceTitle}`.toLowerCase()
      return hay.includes(query.trim().toLowerCase())
    })
  }, [category, query])

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker"><BookOpen aria-hidden="true" size={16} strokeWidth={1.75} /> {en ? 'Evidence' : 'Evidencia'}</p>
          <h1>{en ? 'NASA risks · demonstration library' : 'Riesgos NASA · biblioteca de demostración'}</h1>
          <p className="lede">
            {en
              ? 'A selection from the Human Research Roadmap, OCHMO, NTRS (EVA), and OSDR. They ground the preparation. They do not become treatment instructions on their own.'
              : 'Selección del Human Research Roadmap, OCHMO, NTRS (EVA) y OSDR. Sirven de fundamento científico para la preparación. No se convierten automáticamente en instrucciones de tratamiento.'}
          </p>
          <p className="muted">
            <Link to="/misiones/evidencia">{en ? 'NASA evidence & live endpoints →' : 'Evidencia NASA y endpoints en vivo →'}</Link>
          </p>
        </div>
      </header>

      <section className="panel" style={{ marginBottom: 20 }}>
        <h2>{en ? 'Five hazards of human spaceflight' : 'Cinco peligros del vuelo espacial humano'}</h2>
        <p className="muted">
          {en
            ? 'Educational framing from NASA HRP. HELIOS links each hazard to records it can consult — without inventing direct clinical causation.'
            : 'Marco educativo de NASA HRP. HELIOS vincula cada peligro con registros que puede consultar — sin inventar causalidad clínica directa.'}
        </p>
        <p>
          <a href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" size={16} strokeWidth={1.75} /> nasa.gov/hrp/hazards
          </a>
          {' · '}
          <Link to="/app/mi-salud">{en ? 'Open my health' : 'Abrir mi salud'}</Link>
        </p>
        <div className="stack" style={{ marginTop: 12 }}>
          {SPACE_HAZARDS.map((hazard) => (
            <article key={hazard.id} className="panel" data-testid={`hazard-${hazard.id}`}>
              <h3>{en ? hazard.title.en : hazard.title.es}</h3>
              <p>{en ? hazard.summary.en : hazard.summary.es}</p>
              <p className="muted"><strong>{en ? 'Related risks' : 'Riesgos relacionados'}:</strong> {en ? hazard.relatedRisks.en : hazard.relatedRisks.es}</p>
              <p className="muted"><strong>{en ? 'HELIOS context' : 'Contexto HELIOS'}:</strong> {en ? hazard.heliosContext.en : hazard.heliosContext.es}</p>
              <p className="callout callout-amber">{en ? hazard.limits.en : hazard.limits.es}</p>
              <p className="muted">{en ? hazard.prepFollowUp.en : hazard.prepFollowUp.es}</p>
              <ul>
                {hazard.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                    <span className="muted"> · {source.institution}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <div className="spread">
        <div className="chips" role="group" aria-label={en ? 'Risk category' : 'Categoría de riesgo'}>
          <button type="button" className="chip" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>{en ? 'All' : 'Todas'}</button>
          {CATEGORIES.map((id) => (
            <button key={id} type="button" className="chip" aria-pressed={category === id} onClick={() => setCategory(id)}>
              {RISK_CATEGORY_LABEL[id]}
            </button>
          ))}
        </div>
        <label className="field" style={{ marginBottom: 0, minWidth: 220 }}>
          {en ? 'Search' : 'Buscar'}
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={en ? 'Sleep, radiation, EVA…' : 'Sueño, radiación, EVA…'} />
        </label>
      </div>

      {rows.length === 0 ? (
        <Empty title={en ? 'No matches' : 'Sin coincidencias'} text={en ? 'Try another category or word.' : 'Probá otra categoría o palabra.'} />
      ) : (
        <div className="stack">
          {rows.map((risk) => (
            <article key={risk.id} className="panel" data-testid={`risk-${risk.id}`}>
              <div className="spread">
                <h2>{risk.title}</h2>
                <span className="badge">{RISK_CATEGORY_LABEL[risk.category]}</span>
              </div>
              <p>{risk.summary}</p>
              <p className="muted">{en ? 'Use in HELIOS' : 'Uso en HELIOS'}: {risk.useInSystem}</p>
              <p className="callout callout-amber">{risk.limitation}</p>
              <p>
                <a href={risk.sourceUrl} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden="true" size={16} strokeWidth={1.75} /> {risk.sourceTitle}
                </a>
                <span className="muted"> · {risk.sourceDate}</span>
              </p>
            </article>
          ))}
        </div>
      )}

      <RadiationPanel />

      <ScientificInsights />

      <section className="panel">
        <h2>{en ? 'Documented EVA ranges (xEMU)' : 'Rangos EVA documentados (xEMU)'}</h2>
        <p className="lede">
          {en
            ? `Reference metabolic rate in BTU/hr: low ≤${EVA_METABOLIC_BANDS.lowMax}, medium up to ${EVA_METABOLIC_BANDS.mediumMax}, historical design up to ~${EVA_METABOLIC_BANDS.highDesignLimit}. There is no live public EMU/xEMU telemetry; these values only frame the simulation.`
            : `Tasa metabólica de referencia en BTU/hr: baja ≤${EVA_METABOLIC_BANDS.lowMax}, media hasta ${EVA_METABOLIC_BANDS.mediumMax}, diseño histórico hasta ~${EVA_METABOLIC_BANDS.highDesignLimit}. No hay telemetría EMU/xEMU pública en vivo; estos valores solo contextualizan la simulación.`}
        </p>
      </section>

      <section className="panel">
        <h2>{en ? 'Sources consulted' : 'Fuentes consultadas'}</h2>
        <ul>
          {NASA_SOURCES.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
              <span className="muted"> — {source.useInSystem}</span>
            </li>
          ))}
        </ul>
        <p className="muted">
          Declará estas fuentes en la entrega del reto. Quirón Bot las cita; no recalibra umbrales clínicos con ellas.
        </p>
      </section>
    </div>
  )
}
