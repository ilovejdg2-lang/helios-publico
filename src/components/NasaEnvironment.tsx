import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  fetchEnvironmental,
  radiationSchema,
  weatherSchema,
  type RadiationResponse,
  type WeatherResponse,
} from '../api/environment'
import { useLocale } from '../i18n'

function Dates({
  start,
  end,
  setStart,
  setEnd,
  en,
}: {
  start: string
  end: string
  setStart: (v: string) => void
  setEnd: (v: string) => void
  en: boolean
}) {
  return (
    <>
      <label className="field">
        {en ? 'From (UTC)' : 'Desde (UTC)'}
        <input
          type="date"
          required
          value={start}
          max={end}
          onChange={(e) => setStart(e.target.value)}
        />
      </label>
      <label className="field">
        {en ? 'Through (UTC)' : 'Hasta (UTC)'}
        <input
          type="date"
          required
          value={end}
          min={start}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setEnd(e.target.value)}
        />
      </label>
    </>
  )
}
function Source({
  source,
  cached,
  fetchedAt,
  en,
  example,
}: {
  source: string
  cached: boolean
  fetchedAt: string
  en: boolean
  example?: boolean
}) {
  return (
    <p className="muted">
      {source} ·{' '}
      {example
        ? en
          ? 'Verified local historical example (retrieval date)'
          : 'Ejemplo histórico local verificado (fecha de consulta)'
        : cached
          ? en
            ? 'Cached'
            : 'En caché'
          : en
            ? 'Retrieved from NASA'
            : 'Consultado en NASA'}{' '}
      · {en ? 'Retrieved' : 'Consulta'}: {fetchedAt} ·{' '}
      {en
        ? 'Real historical records · UTC'
        : 'Registros históricos reales · UTC'}
    </p>
  )
}
export function SpaceWeatherPanel({ notices = false }: { notices?: boolean }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [start, setStart] = useState(() =>
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
  )
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [type, setType] = useState('')
  const [query, setQuery] = useState<Record<string, string>>({})
  const [data, setData] = useState<WeatherResponse | null>(null)
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setStatus('loading')
    void fetchEnvironmental(
      'donki/events',
      query,
      weatherSchema,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) {
          setData(value)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error')
      })
    return () => controller.abort()
  }, [query])
  return (
    <section
      className="panel nasa-panel"
      aria-label={
        notices
          ? en
            ? 'Environmental information notices'
            : 'Avisos informativos ambientales'
          : 'Space Weather Monitoring'
      }
    >
      <p className="badge">NASA Real Data · DONKI</p>
      <h2>
        {notices
          ? en
            ? 'Environmental information notices'
            : 'Avisos informativos ambientales'
          : 'Space Weather Monitoring'}
      </h2>
      <p className="callout callout-amber">
        {en
          ? 'Preliminary DONKI research information. These events do not establish astronaut exposure or medical alerts and are not official operational instructions.'
          : 'Información preliminar de investigación DONKI. Estos eventos no demuestran exposición del astronauta ni son alertas médicas o instrucciones operativas oficiales.'}
      </p>
      <form
        className="nasa-filters"
        onSubmit={(e) => {
          e.preventDefault()
          setQuery({
            startDate: start,
            endDate: end,
            ...(type ? { type } : {}),
          })
        }}
      >
        <Dates
          start={start}
          end={end}
          setStart={setStart}
          setEnd={setEnd}
          en={en}
        />
        <label className="field">
          {en ? 'Event' : 'Evento'}
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{en ? 'All' : 'Todos'}</option>
            {['SEP', 'FLR', 'CME'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button className="chip" type="submit">
          {en ? 'Query (max. 30 days)' : 'Consultar (máx. 30 días)'}
        </button>
      </form>
      <div aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'loading' && (
          <p>{en ? 'Loading NASA events…' : 'Consultando eventos NASA…'}</p>
        )}
        {status === 'error' && (
          <p role="alert">
            {en
              ? 'NASA unavailable or invalid query. Check the date range and retry. No events generated.'
              : 'NASA no disponible o consulta inválida. Revisá las fechas y reintentá. No se generaron eventos.'}
          </p>
        )}
        {data && (
          <>
            {data.sources.map((s) => (
              <Source key={s.sourceUrl} {...s} en={en} />
            ))}
            {!data.events.length && (
              <p>
                {en
                  ? 'No events in this interval.'
                  : 'Sin eventos en este intervalo.'}
              </p>
            )}
            <div className="nasa-events">
              {data.events.map((event) => (
                <article
                  key={`${event.type}-${event.id}`}
                  className="nasa-event"
                >
                  <p className="badge">NASA Real Data · DONKI</p>
                  <h3>
                    {event.type} {event.classification}
                  </h3>
                  <p>
                    <time dateTime={event.timestamp}>{event.timestamp} UTC</time>
                  </p>
                  <p>
                    {event.description ||
                      (en
                        ? 'No description supplied by NASA.'
                        : 'NASA no proporcionó descripción.')}
                  </p>
                  {event.sourceUrl && (
                    <a href={event.sourceUrl} target="_blank" rel="noreferrer">
                      {en ? 'NASA record' : 'Registro NASA'}
                    </a>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
export function RadiationPanel() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [start, setStart] = useState('2023-05-16')
  const [end, setEnd] = useState('2023-05-16')
  const [instrument, setInstrument] = useState('REM-Lid')
  const [query, setQuery] = useState<Record<string, string>>({
    startDate: '2023-05-16',
    endDate: '2023-05-16',
    instrument: 'REM-Lid',
  })
  const [data, setData] = useState<RadiationResponse | null>(null)
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setStatus('loading')
    void fetchEnvironmental(
      query.example ? 'radlab/example' : 'radlab/measurements',
      query.example ? {} : query,
      radiationSchema,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) {
          setData(value)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error')
      })
    return () => controller.abort()
  }, [query])
  return (
    <section className="panel nasa-panel">
      <h2>Radiation Analysis</h2>
      <p className="callout callout-amber">
        {en
          ? 'Historical environmental measurements, not current personal astronaut doses. Absorbed dose rate (µGy/h) and dose equivalent rate (µSv/h) are separate quantities. No accumulated doses or medical safety limits are calculated.'
          : 'Mediciones ambientales históricas, no dosis personales actuales. La tasa absorbida (µGy/h) y la tasa equivalente (µSv/h) son magnitudes distintas. No se calculan dosis acumuladas ni límites médicos.'}
      </p>
      <form
        className="nasa-filters"
        onSubmit={(e) => {
          e.preventDefault()
          setQuery({ startDate: start, endDate: end, instrument })
        }}
      >
        <Dates
          start={start}
          end={end}
          setStart={setStart}
          setEnd={setEnd}
          en={en}
        />
        <label className="field">
          {en ? 'Instrument' : 'Instrumento'}
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          >
            {['REM-Lid', 'DosTel1', 'DosTel2'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button className="chip" type="submit">
          {en
            ? 'Query (max. 2 calendar days)'
            : 'Consultar (máx. 2 días calendario)'}
        </button>
      </form>
      <button
        type="button"
        className="chip"
        onClick={() => setQuery({ example: 'true' })}
      >
        {en
          ? 'Load verified local example: REM-Lid · 2023-05-16 00:00–01:00 UTC'
          : 'Cargar ejemplo local verificado: REM-Lid · 2023-05-16 00:00–01:00 UTC'}
      </button>
      <div aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'loading' && (
          <p>{en ? 'Loading RadLab…' : 'Consultando RadLab…'}</p>
        )}
        {status === 'error' && (
          <p role="alert">
            {en
              ? 'RadLab unavailable or invalid query. Retry. No substitute measurements.'
              : 'RadLab no disponible o consulta inválida. Reintentá. No se sustituyeron mediciones.'}
          </p>
        )}
      </div>
      {data && (
        <>
          <p className="badge" data-testid="radlab-provenance">
            NASA Historical Benchmark · RadLab · Nest GET /api/nasa/radlab
            {data.cached ? (en ? ' · cached' : ' · caché') : (en ? ' · live fetch' : ' · consulta en vivo')}
            {data.fetchedAt ? ` · ${data.fetchedAt}` : ''}
          </p>
          <p>{en ? 'Environmental historical measurements; they do not establish individual astronaut exposure or diagnoses. Units are supplied by NASA (µGy/h and µSv/h); values are not relabeled as daily rates. All record times are UTC.' : 'Mediciones ambientales históricas; no establecen exposición individual ni diagnósticos. Las unidades son las suministradas por NASA (µGy/h y µSv/h); no se presentan como tasas diarias. Todas las fechas del registro son UTC.'}</p>
          <Source {...data} en={en} />
          <a href={data.sourceUrl} target="_blank" rel="noreferrer">
            {en ? 'Original NASA data' : 'Datos originales NASA'}
          </a>
          <p>
            {en ? 'Detector / spacecraft: ' : 'Detector / nave: '}
            {[
              ...new Set(
                data.measurements.map(
                  (m) => `${m.instrument} · ${m.spacecraft ?? '—'}`,
                ),
              ),
            ].join('; ')}
          </p>
          {!data.measurements.length ? (
            <p>
              {en
                ? 'No measurements in this interval.'
                : 'Sin mediciones en este intervalo.'}
            </p>
          ) : (
            <>
              {(['absorbedDoseRate', 'doseEquivalentRate'] as const).map(
                (key) => (
                  <div key={key}>
                    <h3>
                      {key === 'absorbedDoseRate'
                        ? en
                          ? 'Absorbed dose rate'
                          : 'Tasa de dosis absorbida'
                        : en
                          ? 'Dose equivalent rate'
                          : 'Tasa de dosis equivalente'}{' '}
                      ({data.units[key]})
                    </h3>
                    {data.measurements.some((row) => row[key] !== null) ? (
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                          <LineChart data={data.measurements}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(v) => String(v).slice(11, 16)}
                            />
                            <YAxis width={65} />
                            <Tooltip />
                            <Legend />
                            <Line
                              dataKey={key}
                              name={data.units[key]}
                              stroke={
                                key === 'absorbedDoseRate'
                                  ? '#e4a44c'
                                  : '#56acbc'
                              }
                              dot={false}
                              connectNulls={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p>
                        {en
                          ? 'NASA did not supply this quantity.'
                          : 'NASA no suministró esta magnitud.'}
                      </p>
                    )}
                  </div>
                ),
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}
