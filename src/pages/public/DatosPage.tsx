import { ExternalLink } from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { TiltCard } from '../../components/public/TiltCard'
import { publicSources, sourceStatus } from '../../content/publicCopy'
import { useLocale } from '../../i18n'

const DataNetwork = lazy(() =>
  import('../../components/public/scenes/DataNetwork').then((m) => ({ default: m.DataNetwork })),
)

type Ctx = { reduced: boolean }

export function DatosPage() {
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const sources = publicSources(lang)
  useEffect(() => {
    document.title = en ? 'Data and sources · HELIOS' : 'Datos y fuentes · HELIOS'
  }, [en])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">{en ? 'Data and sources' : 'Datos y fuentes'}</p>
        <h1>{en ? 'Sources used in the dashboard' : 'Fuentes que usa el dashboard'}</h1>
        <p className="pub-lead">
          {en
            ? 'Only public NASA and CSA sources the dashboard actually consults: risks, evidence, and live DONKI, OSDR, and RadLab lookups. They are context, not a diagnosis or personal dose.'
            : 'Solo fuentes públicas de NASA y de la CSA que el dashboard consulta de verdad: riesgos, evidencia y consultas en vivo de DONKI, OSDR y RadLab. Son contexto, no un diagnóstico ni una dosis personal.'}
        </p>
      </header>

      <Suspense fallback={<figure className="data-network"><div className="data-network-static" aria-hidden="true" /><figcaption>{en ? 'Conceptual decoration · not real medical centers or data links' : 'Decoración conceptual · no representa centros médicos ni enlaces de datos reales'}</figcaption></figure>}>
        <DataNetwork
          reduced={reduced}
          label={
            en
              ? 'Conceptual decoration · not real medical centers or data links'
              : 'Decoración conceptual · no representa centros médicos ni enlaces de datos reales'
          }
        />
      </Suspense>

      <Reveal className="editorial-block space">
        <h2>{en ? 'Scientific note' : 'Nota científica'}</h2>
        <p>
          {en
            ? 'Decorative figures on the public site and the hero are marked as simulated telemetry. The dashboard uses fictional scenarios for demonstration.'
            : 'Las cifras decorativas del sitio público y del hero se marcan como telemetría simulada. El dashboard usa escenarios ficticios para demostración.'}
        </p>
        <p>
          {en
            ? 'Challenge alignment matrix (what is API vs document vs user measurement): see repository docs/CHALLENGE-ALIGNMENT-MATRIX-2026.md. Live indicators in My Health always show origin (manual / sensor / import / simulation).'
            : 'Matriz de alineación del reto (API vs documento vs medición de usuario): docs/CHALLENGE-ALIGNMENT-MATRIX-2026.md. Los indicadores en Mi salud muestran siempre el origen (manual / sensor / importación / simulación).'}
        </p>
      </Reveal>

      <div className="data-grid">
        {sources.map((source, index) => (
          <TiltCard key={source.id} as="article" className="data-card" reduced={reduced} style={{ animationDelay: `${index * 40}ms` }}>
            <div className="data-meta">
              <span className="pill">{sourceStatus(lang, source.status)}</span>
              <span className="pill lilac">{source.type}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{source.name}</h2>
            <p className="pub-muted" style={{ margin: 0 }}><strong>{source.institution}</strong> · {source.versionNote}</p>
            <p style={{ margin: 0 }}>{source.description}</p>
            <p style={{ margin: 0 }}><strong>{en ? 'Use in HELIOS:' : 'Uso en HELIOS:'}</strong> {source.useInHelios}</p>
            <p className="pub-muted" style={{ margin: 0 }}><strong>{en ? 'Terms:' : 'Términos:'}</strong> {source.terms}</p>
            <p className="pub-muted" style={{ margin: 0 }}><strong>{en ? 'Limitations:' : 'Limitaciones:'}</strong> {source.limitations}</p>
            <p style={{ margin: 0 }}><strong>APA 7:</strong> {source.citation}</p>
            <a className="pub-btn-ghost" href={source.href} target="_blank" rel="noreferrer">
              {en ? 'Open source' : 'Abrir fuente'} <ExternalLink size={16} aria-hidden="true" />
            </a>
          </TiltCard>
        ))}
      </div>
    </>
  )
}
