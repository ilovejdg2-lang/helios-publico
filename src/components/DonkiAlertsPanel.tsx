import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Activity, ExternalLink, Sun, X, Zap } from 'lucide-react'
import {
  fetchEnvironmental,
  weatherSchema,
  type WeatherEvent,
  type WeatherResponse,
} from '../api/environment'
import { translateDonkiNote } from '../api/donkiTranslate'
import {
  DONKI_TYPE_LABEL,
  donkiCardTitle,
  flareClassHelp,
  formatDonkiWhen,
  structuredDonkiSummary,
  type DonkiType,
} from '../domain/donkiCopy'
import { useLocale } from '../i18n'

const TYPE_OPTIONS: { value: '' | DonkiType; es: string; en: string }[] = [
  { value: '', es: 'Todos', en: 'All' },
  {
    value: 'CME',
    es: 'Eyecciones de masa coronal — CME',
    en: 'Coronal mass ejections — CME',
  },
  {
    value: 'FLR',
    es: 'Llamaradas solares — FLR',
    en: 'Solar flares — FLR',
  },
  {
    value: 'SEP',
    es: 'Eventos de partículas energéticas solares — SEP',
    en: 'Solar energetic particle events — SEP',
  },
]

function IconFor({ type }: { type: DonkiType }) {
  const props = { size: 22, strokeWidth: 1.75, 'aria-hidden': true as const }
  if (type === 'FLR') return <Sun {...props} />
  if (type === 'SEP') return <Zap {...props} />
  return <Activity {...props} />
}

function formatQueryStamp(iso: string, en: boolean) {
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return iso
  const locale = en ? 'en-GB' : 'es'
  const day = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
    .format(ms)
    .replace(/\./g, '')
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(ms)
  return `${day}, ${time} UTC`
}

function queryStatusLabel(
  sources: WeatherResponse['sources'],
  failures: WeatherResponse['failures'] | undefined,
  en: boolean,
) {
  const anyCached = sources.some((s) => s.cached)
  const anyFresh = sources.some((s) => !s.cached)
  const partial = Boolean(failures?.length)
  if (partial) {
    return en ? 'Partial update' : 'Actualización parcial'
  }
  if (anyCached && anyFresh) {
    return en ? 'Partial cache' : 'Actualización parcial'
  }
  if (anyCached && !anyFresh) {
    return en ? 'From cache' : 'Desde caché'
  }
  return en ? 'Updated' : 'Actualizado'
}

function safeText(value: string) {
  return value.replace(/[<>]/g, '')
}

export function DonkiAlertsPanel() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const titleId = useId()
  const [start, setStart] = useState(() =>
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
  )
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<'' | DonkiType>('')
  const [query, setQuery] = useState<Record<string, string>>({})
  const [data, setData] = useState<WeatherResponse | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'loading',
  )
  const [selected, setSelected] = useState<WeatherEvent | null>(null)
  const [translations, setTranslations] = useState<
    Record<string, { status: 'loading' | 'ready' | 'unavailable'; text: string | null }>
  >({})
  const requestGen = useRef(0)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const gen = ++requestGen.current
    setData(null)
    setSelected(null)
    setStatus('loading')
    void fetchEnvironmental(
      'donki/events',
      query,
      weatherSchema,
      controller.signal,
    )
      .then((value) => {
        if (controller.signal.aborted || gen !== requestGen.current) return
        setData(value)
        setStatus('ready')
      })
      .catch(() => {
        if (controller.signal.aborted || gen !== requestGen.current) return
        setStatus('error')
      })
    return () => controller.abort()
  }, [query])

  useEffect(() => {
    if (!data?.events.length || en) return
    const controller = new AbortController()
    setTranslations((prev) => {
      const next = { ...prev }
      let changed = false
      for (const event of data.events) {
        if (!event.description?.trim() || next[event.id]) continue
        next[event.id] = { status: 'loading', text: null }
        changed = true
      }
      return changed ? next : prev
    })
    for (const event of data.events) {
      const original = event.description?.trim()
      if (!original) continue
      void translateDonkiNote(event.id, original, controller.signal).then(
        (result) => {
          if (controller.signal.aborted) return
          setTranslations((prev) => {
            if (prev[event.id]?.status === 'ready') return prev
            return {
              ...prev,
              [event.id]:
                result.status === 'ready'
                  ? { status: 'ready', text: result.text }
                  : { status: 'unavailable', text: null },
            }
          })
        },
      )
    }
    return () => controller.abort()
  }, [data, en])

  useEffect(() => {
    const node = dialogRef.current
    if (!node) return
    if (selected) {
      if (!node.open) node.showModal()
      window.setTimeout(() => {
        node.querySelector<HTMLElement>('[data-donki-close]')?.focus()
      }, 0)
    } else if (node.open) {
      node.close()
    }
  }, [selected])

  const rangeDays = useMemo(() => {
    const a = Date.parse(start)
    const b = Date.parse(end)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null
    return Math.round((b - a) / 86400000)
  }, [start, end])

  const latestFetch = data?.sources.reduce(
    (max, s) => (s.fetchedAt > max ? s.fetchedAt : max),
    data.sources[0]?.fetchedAt ?? '',
  )

  function openSubmit(e: FormEvent) {
    e.preventDefault()
    if (rangeDays !== null && (rangeDays < 0 || rangeDays > 30)) return
    setQuery({
      startDate: start,
      endDate: end,
      ...(type ? { type } : {}),
    })
  }

  return (
    <section
      className="donki-alerts"
      aria-labelledby={titleId}
      data-testid="donki-alerts"
    >
      <header className="donki-alerts-head">
        <p className="donki-kicker">
          {en ? 'Space environment · NASA DONKI' : 'Entorno espacial · NASA DONKI'}
        </p>
        <h2 id={titleId}>
          {en
            ? 'Space activity recorded by NASA'
            : 'Actividad espacial registrada por NASA'}
        </h2>
        <p className="donki-lede">
          {en
            ? 'Browse solar and space-weather events for the selected period, with explanations in English.'
            : 'Consultá eventos solares y de clima espacial del período seleccionado, con explicaciones en español.'}
        </p>
        <p className="donki-notice">
          {en
            ? 'Space-context information. These records do not prove personal exposure and do not replace guidance from the mission team.'
            : 'Información de contexto espacial. Estos registros no demuestran exposición personal ni sustituyen las indicaciones del equipo responsable de la misión.'}
        </p>
      </header>

      <form className="donki-filters" onSubmit={openSubmit}>
        <label className="donki-field">
          {en ? 'From' : 'Desde'}
          <input
            type="date"
            required
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="donki-field">
          {en ? 'To' : 'Hasta'}
          <input
            type="date"
            required
            value={end}
            min={start}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <label className="donki-field">
          {en ? 'Event type' : 'Tipo de evento'}
          <select
            value={type}
            onChange={(e) => setType(e.target.value as '' | DonkiType)}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {en ? opt.en : opt.es}
              </option>
            ))}
          </select>
        </label>
        <button className="donki-submit" type="submit">
          {en ? 'Query events' : 'Consultar eventos'}
        </button>
        <p className="donki-filter-hint">
          {en
            ? 'Query dates are UTC. HELIOS limits each request to 30 calendar days.'
            : 'Las fechas de consulta corresponden a UTC. HELIOS limita cada consulta a 30 días calendario.'}
        </p>
        {rangeDays !== null && rangeDays > 30 ? (
          <p className="donki-filter-error" role="alert">
            {en
              ? 'Choose a range of 30 days or less (HELIOS limit).'
              : 'Elegí un rango de 30 días o menos (límite de HELIOS).'}
          </p>
        ) : null}
      </form>

      <div aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'loading' && (
          <p className="donki-status-msg">
            {en ? 'Querying NASA DONKI…' : 'Consultando NASA DONKI…'}
          </p>
        )}
        {status === 'error' && (
          <p className="donki-status-msg" role="alert">
            {en
              ? 'Could not query DONKI. Check the date range and try again. No substitute events were invented.'
              : 'No se pudo consultar DONKI. Revisá el rango de fechas e intentá de nuevo. No se inventaron eventos de reemplazo.'}
          </p>
        )}
        {data && status === 'ready' && (
          <>
            <div className="donki-summary">
              <p>
                <strong>
                  {data.events.length}{' '}
                  {en
                    ? data.events.length === 1
                      ? 'event'
                      : 'events'
                    : data.events.length === 1
                      ? 'evento'
                      : 'eventos'}
                </strong>
                {' · '}
                {en ? 'Period' : 'Período'}: {start} → {end} UTC
                {' · '}
                {en ? 'Source' : 'Procedencia'}: NASA DONKI
                {' · '}
                {en ? 'Status' : 'Estado'}:{' '}
                {queryStatusLabel(data.sources, data.failures, en)}
              </p>
              {latestFetch ? (
                <p>
                  {en ? 'Last query' : 'Última consulta'}:{' '}
                  {formatQueryStamp(latestFetch, en)}.
                </p>
              ) : null}
              <details className="donki-sources">
                <summary>
                  {en ? 'Source status' : 'Estado de las fuentes'}
                </summary>
                <ul>
                  {data.sources.map((s) => (
                    <li key={s.sourceUrl}>
                      {s.source}
                      {' · '}
                      {s.cached
                        ? en
                          ? 'cached'
                          : 'en caché'
                        : en
                          ? 'live'
                          : 'actualizado'}
                      {' · '}
                      {formatQueryStamp(s.fetchedAt, en)}
                    </li>
                  ))}
                  {(data.failures ?? []).map((f) => (
                    <li key={f.type}>
                      {f.type}:{' '}
                      {en ? 'unavailable' : 'no disponible'} ({f.message})
                    </li>
                  ))}
                </ul>
              </details>
            </div>

            {!data.events.length ? (
              <p className="donki-empty">
                {en
                  ? 'No events found for these filters.'
                  : 'No se encontraron eventos para estos filtros.'}
              </p>
            ) : (
              <div className="donki-grid">
                {data.events.map((event) => {
                  const summary = structuredDonkiSummary(event, en)
                  const tr = translations[event.id]
                  const brief =
                    !en && tr?.status === 'ready' && tr.text
                      ? tr.text
                      : summary
                  return (
                    <article
                      key={`${event.type}-${event.id}`}
                      className="donki-card"
                    >
                      <div className="donki-card-icon">
                        <IconFor type={event.type} />
                      </div>
                      <h3>{donkiCardTitle(event.type, en)}</h3>
                      <p className="donki-card-when">
                        <time dateTime={event.beginTime ?? event.timestamp}>
                          {formatDonkiWhen(
                            event.beginTime ?? event.timestamp,
                            en ? 'en' : 'es',
                          )}
                        </time>
                      </p>
                      {event.classification ? (
                        <p className="donki-card-class">
                          {en
                            ? 'Reported classification'
                            : 'Clasificación informada'}
                          : <strong>{event.classification}</strong>
                        </p>
                      ) : null}
                      <p className="donki-card-summary">{safeText(brief)}</p>
                      {!en && event.description ? (
                        <p className="donki-card-tr-meta">
                          {tr?.status === 'ready'
                            ? 'Traducción automática al español. Consultar original.'
                            : tr?.status === 'loading'
                              ? 'Traduciendo descripción…'
                              : 'Resumen estructurado · Traducción no disponible'}
                        </p>
                      ) : (
                        <p className="donki-card-tr-meta">
                          {en
                            ? 'Structured summary from the DONKI record.'
                            : 'Resumen estructurado a partir del registro DONKI.'}
                        </p>
                      )}
                      <div className="donki-card-actions">
                        <button
                          type="button"
                          className="donki-btn is-fill"
                          onClick={() => setSelected(event)}
                        >
                          {en ? 'View details' : 'Ver detalles'}
                        </button>
                        {event.sourceUrl ? (
                          <a
                            className="donki-btn is-line"
                            href={event.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {en
                              ? 'Original NASA record'
                              : 'Registro original en NASA'}{' '}
                            <ExternalLink size={14} aria-hidden />
                          </a>
                        ) : null}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="donki-dialog"
        onClose={() => setSelected(null)}
        onCancel={(e) => {
          e.preventDefault()
          setSelected(null)
        }}
        aria-labelledby={selected ? 'donki-detail-title' : undefined}
      >
        {selected ? (
          <DonkiDetail
            event={selected}
            en={en}
            translation={translations[selected.id]}
            onClose={() => setSelected(null)}
            queryFetchedAt={latestFetch}
            sourceCached={
              data?.sources.find((s) => s.type === selected.type)?.cached ??
              data?.sources.some((s) => s.cached) ??
              false
            }
          />
        ) : null}
      </dialog>
    </section>
  )
}

function DonkiDetail({
  event,
  en,
  translation,
  onClose,
  queryFetchedAt,
  sourceCached,
}: {
  event: WeatherEvent
  en: boolean
  translation?: { status: string; text: string | null }
  onClose: () => void
  queryFetchedAt?: string
  sourceCached: boolean
}) {
  const [descTab, setDescTab] = useState<'es' | 'en'>('es')
  const label = DONKI_TYPE_LABEL[event.type]
  const classHelp = flareClassHelp(event.classification, en)
  const summary = structuredDonkiSummary(event, en)
  const esBody =
    translation?.status === 'ready' && translation.text
      ? translation.text
      : null

  useEffect(() => {
    setDescTab(en ? 'en' : 'es')
  }, [event.id, en])

  return (
    <div className="donki-detail">
      <div className="donki-detail-bar">
        <h2 id="donki-detail-title">{donkiCardTitle(event.type, en)}</h2>
        <button
          type="button"
          className="donki-close"
          data-donki-close
          onClick={onClose}
          aria-label={en ? 'Close' : 'Cerrar'}
        >
          <X size={20} />
        </button>
      </div>

      <section>
        <h3>{en ? 'Summary' : 'Resumen en español'}</h3>
        <p>{safeText(summary)}</p>
        {classHelp ? <p className="donki-help">{classHelp}</p> : null}
      </section>

      <section>
        <h3>
          {en
            ? 'What does this event type mean?'
            : '¿Qué significa este tipo de evento?'}
        </h3>
        <p>{en ? label.hintEn : label.hintEs}</p>
      </section>

      <section>
        <h3>{en ? 'Record data' : 'Datos del registro'}</h3>
        <dl className="donki-dl">
          <div>
            <dt>{en ? 'Type' : 'Tipo'}</dt>
            <dd>
              {en ? label.en : label.es} ({event.type})
            </dd>
          </div>
          <div>
            <dt>{en ? 'Identifier' : 'Identificador'}</dt>
            <dd>
              <code>{event.id}</code>
            </dd>
          </div>
          <div>
            <dt>{en ? 'Start' : 'Inicio'}</dt>
            <dd>
              {formatDonkiWhen(
                event.beginTime ?? event.timestamp,
                en ? 'en' : 'es',
              )}
            </dd>
          </div>
          {event.peakTime ? (
            <div>
              <dt>{en ? 'Peak' : 'Máximo'}</dt>
              <dd>{formatDonkiWhen(event.peakTime, en ? 'en' : 'es')}</dd>
            </div>
          ) : null}
          {event.endTime ? (
            <div>
              <dt>{en ? 'End' : 'Final'}</dt>
              <dd>{formatDonkiWhen(event.endTime, en ? 'en' : 'es')}</dd>
            </div>
          ) : null}
          {event.classification ? (
            <div>
              <dt>{en ? 'Classification' : 'Clasificación'}</dt>
              <dd>{event.classification}</dd>
            </div>
          ) : null}
          {event.instruments?.length ? (
            <div>
              <dt>{en ? 'Instruments' : 'Instrumentos'}</dt>
              <dd>{event.instruments.join(', ')}</dd>
            </div>
          ) : null}
          {event.activeRegion ? (
            <div>
              <dt>{en ? 'Active region' : 'Región activa'}</dt>
              <dd>{event.activeRegion}</dd>
            </div>
          ) : null}
          {event.sourceLocation ? (
            <div>
              <dt>{en ? 'Source location' : 'Ubicación de origen'}</dt>
              <dd>{event.sourceLocation}</dd>
            </div>
          ) : null}
          {event.linkedEvents?.length ? (
            <div>
              <dt>{en ? 'Related events' : 'Eventos relacionados'}</dt>
              <dd>{event.linkedEvents.join(', ')}</dd>
            </div>
          ) : null}
          {event.catalog ? (
            <div>
              <dt>{en ? 'Catalog' : 'Catálogo'}</dt>
              <dd>{event.catalog}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section>
        <h3>{en ? 'Full description' : 'Descripción completa'}</h3>
        <div className="donki-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={descTab === 'es'}
            onClick={() => setDescTab('es')}
          >
            Español
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={descTab === 'en'}
            onClick={() => setDescTab('en')}
          >
            {en ? 'Original English' : 'Original en inglés'}
          </button>
        </div>
        <div className="donki-desc" role="tabpanel">
          {descTab === 'en' ? (
            <p>
              {event.description
                ? safeText(event.description)
                : en
                  ? 'NASA did not supply a note for this record.'
                  : 'NASA no suministró una nota para este registro.'}
            </p>
          ) : esBody ? (
            <>
              <p className="donki-card-tr-meta">
                Traducción automática al español. Consultar original.
              </p>
              <p>{safeText(esBody)}</p>
            </>
          ) : (
            <>
              <p className="donki-card-tr-meta">
                {translation?.status === 'loading'
                  ? 'Traduciendo…'
                  : 'Traducción no disponible'}
              </p>
              <p>
                {event.description
                  ? safeText(summary)
                  : en
                    ? 'No free-text note on this record.'
                    : 'Este registro no incluye nota en texto libre.'}
              </p>
              {event.description ? (
                <p>
                  <button
                    type="button"
                    className="donki-linkish"
                    onClick={() => setDescTab('en')}
                  >
                    {en ? 'Read original' : 'Leer original'}
                  </button>
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section>
        <h3>{en ? 'Source and update' : 'Fuente y actualización'}</h3>
        <ul className="donki-source-list">
          {event.sourceUrl ? (
            <li>
              <a href={event.sourceUrl} target="_blank" rel="noreferrer">
                {en ? 'Original NASA record' : 'Registro original en NASA'}{' '}
                <ExternalLink size={14} aria-hidden />
              </a>
            </li>
          ) : null}
          <li>
            {en ? 'Query time' : 'Fecha de consulta'}:{' '}
            {queryFetchedAt
              ? formatQueryStamp(queryFetchedAt, en)
              : '—'}
          </li>
          <li>
            {en ? 'Cache' : 'Estado de caché'}:{' '}
            {sourceCached
              ? en
                ? 'served from cache'
                : 'servido desde caché'
              : en
                ? 'fresh retrieval'
                : 'consulta reciente'}
          </li>
          <li>
            {en ? 'Record id' : 'Identificador del registro'}:{' '}
            <code>{event.id}</code>
          </li>
        </ul>
      </section>

      <details className="donki-tech">
        <summary>
          {en ? 'Additional technical fields' : 'Datos técnicos adicionales'}
        </summary>
        <pre>{JSON.stringify(event, null, 2)}</pre>
      </details>
    </div>
  )
}
