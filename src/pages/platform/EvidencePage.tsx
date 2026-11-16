import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeliosLogo } from '../../components/HeliosLogo'
import { LocaleThemeSwitch } from '../../components/LocaleThemeSwitch'
import { useLocale } from '../../i18n'
import { CSA_RESOURCES } from '../../domain/csaResources'
import { DEMO_REVIEW_PROTOCOL } from '../../domain/demoReviewProtocol'
import { NASA_PROOF } from '../../content/judgeDefense'
import { platformApi, type Evidence } from '../../platform/api'
import '../../platform/platform.css'

export function EvidencePage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [items, setItems] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = en ? 'HELIOS · Evidence' : 'HELIOS · Evidencia'
    let alive = true
    setLoading(true)
    platformApi.evidence()
      .then((data) => {
        if (alive) setItems(data.items)
      })
      .catch(() => {
        if (alive) setItems([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [en])

  return (
    <div className="plat">
      {loading ? (
        <div className="plat-loader" role="status" aria-live="polite">
          <span className="plat-spinner" aria-hidden="true" />
          <p>{en ? 'Loading sources…' : 'Cargando fuentes…'}</p>
        </div>
      ) : null}
      <div className="plat-shell">
        <div className="plat-top">
          <HeliosLogo variant="wordmark" />
          <div className="plat-top-tools">
            <LocaleThemeSwitch />
            <div className="plat-actions">
              <Link className="plat-btn ghost" to="/entrar">{en ? 'Roles' : 'Roles'}</Link>
              <Link className="plat-btn ghost" to="/app">{en ? 'Open app' : 'Abrir app'}</Link>
              <Link className="plat-btn ghost" to="/misiones">Hub</Link>
            </div>
          </div>
        </div>
        <p className="plat-kicker">{en ? 'Space Apps · Sources' : 'Space Apps · Fuentes'}</p>
        <h1>{en ? 'Evidence & NASA sources' : 'Evidencia y fuentes NASA'}</h1>
        <p className="plat-lead">
          {en
            ? 'Open NASA endpoints and curated sources used in HELIOS. Context only — not personal dose or diagnosis.'
            : 'Endpoints NASA abiertos y fuentes usadas en HELIOS. Solo contexto: no es dosis personal ni diagnóstico.'}
        </p>

        <article className="plat-panel">
          <h2>{en ? 'Live NASA endpoints (Nest proxy)' : 'Endpoints NASA en vivo (proxy Nest)'}</h2>
          <p className="plat-muted">
            {en
              ? 'Each UI surface labels fetch time / cache. NASA context is never personal astronaut dose or diagnosis.'
              : 'Cada pantalla etiqueta fecha de consulta / caché. El contexto NASA nunca es dosis personal ni diagnóstico.'}
          </p>
          <ul className="plat-list" style={{ listStyle: 'none', padding: 0 }}>
            {NASA_PROOF.map((item) => (
              <li key={item.id} className="plat-panel" style={{ marginBottom: 10 }}>
                <strong>{item.label}</strong>
                <p><code>{item.nest}</code></p>
                <p className="plat-muted">{item.ui}</p>
                <div className="plat-actions">
                  <a className="plat-btn ghost" href={item.docs} target="_blank" rel="noreferrer">
                    {en ? 'Official docs' : 'Docs oficiales'}
                  </a>
                  <Link className="plat-btn ghost" to={item.ui.split(' · ')[0] || '/'}>
                    {en ? 'Open in HELIOS' : 'Abrir en HELIOS'}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </article>

        {!loading && items.length === 0 ? (
          <p>{en ? 'No curated library items from API (offline OK — NASA links above still apply).' : 'Sin ítems de biblioteca vía API (offline OK — los enlaces NASA de arriba siguen valiendo).'}</p>
        ) : null}
        <article className="plat-panel">
          <h2>{en ? DEMO_REVIEW_PROTOCOL.title.en : DEMO_REVIEW_PROTOCOL.title.es}</h2>
          <p>{DEMO_REVIEW_PROTOCOL.id} · v{DEMO_REVIEW_PROTOCOL.version}</p>
          <p>{en ? DEMO_REVIEW_PROTOCOL.disclaimer.en : DEMO_REVIEW_PROTOCOL.disclaimer.es}</p>
        </article>
        {CSA_RESOURCES.map((item) => (
          <article className="plat-panel" key={item.id}>
            <h2>{en ? item.title.en : item.title.es}</h2>
            <p>{item.institution} · CSA partner</p>
            <p>{en ? item.useInHelios.en : item.useInHelios.es}</p>
            <p className="plat-muted">{en ? item.limitations.en : item.limitations.es}</p>
            <a className="plat-btn ghost" href={item.url} target="_blank" rel="noreferrer">
              {en ? 'Open CSA source' : 'Abrir fuente CSA'}
            </a>
          </article>
        ))}
        <div className="plat-list">
          {items.map((item) => (
            <article className="plat-panel" key={item.id}>
              <h2>{item.title}</h2>
              <p>{item.institution} · {item.kind}</p>
              <p>{item.notes}</p>
              <a className="plat-btn ghost" href={item.url} target="_blank" rel="noreferrer">
                {en ? 'Open source' : 'Abrir fuente'}
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
