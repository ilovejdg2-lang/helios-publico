import { useMemo, useState } from 'react'
import { useLocale } from '../../i18n'
import type { HealthIndicatorReading } from '../../platform/api'
import { catalogEntry, formatIndicatorValue } from '../../domain/healthIndicators'

export type BodyRegionId = 'head' | 'chest' | 'abdomen' | 'arm' | 'hand' | 'leg'

const REGIONS: { id: BodyRegionId; es: string; en: string }[] = [
  { id: 'head', es: 'Cabeza', en: 'Head' },
  { id: 'chest', es: 'Tórax', en: 'Chest' },
  { id: 'abdomen', es: 'Abdomen', en: 'Abdomen' },
  { id: 'arm', es: 'Brazo', en: 'Arm' },
  { id: 'hand', es: 'Mano', en: 'Hand' },
  { id: 'leg', es: 'Pierna', en: 'Leg' },
]

type SymptomLike = { description?: string; bodyRegion?: string | null; createdAt?: number }

/** Accessible SVG body map — educational navigation, not a medical scan. */
export function BodyMap({
  indicators,
  symptoms,
}: {
  indicators: HealthIndicatorReading[]
  symptoms: SymptomLike[]
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [selected, setSelected] = useState<BodyRegionId | null>(null)

  const related = useMemo(() => {
    if (!selected) return { indicators: [] as HealthIndicatorReading[], symptoms: [] as SymptomLike[], education: '' }
    const inds = indicators.filter((item) => item.bodyRegion === selected)
    const syms = symptoms.filter((item) => item.bodyRegion === selected)
    const education = en
      ? 'This view only lists related logs and educational links. It does not paint organs as diseased from a single reading.'
      : 'Esta vista solo lista registros relacionados y contexto educativo. No pinta órganos como enfermos por una sola medición.'
    return { indicators: inds, symptoms: syms, education }
  }, [selected, indicators, symptoms, en])

  return (
    <section className="rd-card health-body-map">
      <h2>{en ? 'Body map' : 'Mapa corporal'}</h2>
      <p className="rd-muted">
        {en
          ? 'Interactive silhouette for navigation. Complements evaluation; it is not a medical exam.'
          : 'Silueta interactiva para navegar. Complementa la evaluación; no es una exploración médica.'}
      </p>

      <div className="health-body-layout">
        <svg
          className="health-body-svg"
          viewBox="0 0 200 420"
          role="img"
          aria-label={en ? 'Selectable body regions' : 'Regiones corporales seleccionables'}
        >
          <title>{en ? 'Body regions' : 'Regiones del cuerpo'}</title>
          {/* Head */}
          <circle
            cx="100" cy="42" r="28"
            className={`health-body-region${selected === 'head' ? ' is-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={en ? 'Head' : 'Cabeza'}
            aria-pressed={selected === 'head'}
            onClick={() => setSelected('head')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('head') } }}
          />
          {/* Chest */}
          <rect
            x="62" y="78" width="76" height="70" rx="18"
            className={`health-body-region${selected === 'chest' ? ' is-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={en ? 'Chest' : 'Tórax'}
            aria-pressed={selected === 'chest'}
            onClick={() => setSelected('chest')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('chest') } }}
          />
          {/* Abdomen */}
          <rect
            x="68" y="152" width="64" height="56" rx="14"
            className={`health-body-region${selected === 'abdomen' ? ' is-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={en ? 'Abdomen' : 'Abdomen'}
            aria-pressed={selected === 'abdomen'}
            onClick={() => setSelected('abdomen')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('abdomen') } }}
          />
          {/* Arms */}
          <rect
            x="18" y="88" width="36" height="100" rx="14"
            className={`health-body-region${selected === 'arm' ? ' is-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={en ? 'Arm' : 'Brazo'}
            aria-pressed={selected === 'arm'}
            onClick={() => setSelected('arm')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('arm') } }}
          />
          <rect
            x="146" y="88" width="36" height="100" rx="14"
            className={`health-body-region${selected === 'arm' ? ' is-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={en ? 'Arm (right)' : 'Brazo (derecho)'}
            aria-pressed={selected === 'arm'}
            onClick={() => setSelected('arm')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('arm') } }}
          />
          {/* Hands */}
          <circle
            cx="36" cy="204" r="16"
            className={`health-body-region${selected === 'hand' ? ' is-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={en ? 'Hand' : 'Mano'}
            aria-pressed={selected === 'hand'}
            onClick={() => setSelected('hand')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('hand') } }}
          />
          <circle
            cx="164" cy="204" r="16"
            className={`health-body-region${selected === 'hand' ? ' is-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={en ? 'Hand (right)' : 'Mano (derecha)'}
            aria-pressed={selected === 'hand'}
            onClick={() => setSelected('hand')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('hand') } }}
          />
          {/* Legs */}
          <rect
            x="68" y="216" width="28" height="140" rx="12"
            className={`health-body-region${selected === 'leg' ? ' is-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={en ? 'Leg' : 'Pierna'}
            aria-pressed={selected === 'leg'}
            onClick={() => setSelected('leg')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('leg') } }}
          />
          <rect
            x="104" y="216" width="28" height="140" rx="12"
            className={`health-body-region${selected === 'leg' ? ' is-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={en ? 'Leg (right)' : 'Pierna (derecha)'}
            aria-pressed={selected === 'leg'}
            onClick={() => setSelected('leg')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('leg') } }}
          />
        </svg>

        <div className="health-body-side">
          <label className="rd-field" htmlFor="body-region-list">
            {en ? 'Region list (keyboard alternative)' : 'Lista de regiones (alternativa teclado)'}
          </label>
          <select
            id="body-region-list"
            value={selected || ''}
            onChange={(e) => setSelected((e.target.value || null) as BodyRegionId | null)}
          >
            <option value="">{en ? 'Select a region' : 'Elegí una región'}</option>
            {REGIONS.map((region) => (
              <option key={region.id} value={region.id}>{en ? region.en : region.es}</option>
            ))}
          </select>

          {!selected ? (
            <p className="rd-muted">{en ? 'No region selected.' : 'Ninguna región seleccionada.'}</p>
          ) : (
            <div className="rd-stack">
              <p className="rd-muted">{related.education}</p>
              <h3>{en ? 'Related indicators' : 'Indicadores relacionados'}</h3>
              {related.indicators.length === 0 ? (
                <p className="rd-muted">{en ? 'No information available.' : 'Sin información disponible.'}</p>
              ) : (
                <ul className="health-mini-list">
                  {related.indicators.slice(0, 6).map((item) => (
                    <li key={item.id}>
                      <strong>{en ? catalogEntry(item.kind)?.name.en : catalogEntry(item.kind)?.name.es}</strong>
                      {' · '}
                      {formatIndicatorValue(item, en)}
                    </li>
                  ))}
                </ul>
              )}
              <h3>{en ? 'Reported symptoms' : 'Síntomas reportados'}</h3>
              {related.symptoms.length === 0 ? (
                <p className="rd-muted">{en ? 'No information available.' : 'Sin información disponible.'}</p>
              ) : (
                <ul className="health-mini-list">
                  {related.symptoms.slice(0, 6).map((item, index) => (
                    <li key={`${item.description}-${index}`}>{item.description || '—'}</li>
                  ))}
                </ul>
              )}
              <p className="rd-muted">
                <a href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noreferrer">
                  {en ? 'Educational source: NASA HRP Hazards' : 'Fuente educativa: NASA HRP Hazards'}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
