import { useEffect, useMemo, useState } from 'react'
import { CREW } from '../domain/crew'
import { filterHistory, historyRows, type HistoryRow } from '../domain/exportData'
import { episodeStatusLabel, formatMission } from '../domain/format'
import { dailyTrends, exportDocument, exportRecords, pulseAxis, recordsToCsv, sleepAxis, type TrendPoint } from '../domain/historySeries'
import { useLocale } from '../i18n'
import { getActiveMissionId } from '../platform/session'
import { useApp } from '../state/store'
import { TrendChart } from '../components/Charts'
import { PlatformIndicatorCharts } from '../components/health/PlatformIndicatorCharts'
import { Empty } from '../components/ui'
import type { CrewId } from '../../shared/types'

export function HistoryPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, backendMode, listHistoryEvents } = useApp()
  const [crewId, setCrewId] = useState<CrewId | 'all'>('all')
  const [type, setType] = useState<HistoryRow['type'] | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(state.selectedEpisodeId)
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [nestEvents, setNestEvents] = useState<number | null>(null)
  const rows = useMemo(() => filterHistory(historyRows(state), { crewId, type }), [state, crewId, type])

  useEffect(() => {
    if (backendMode !== 'connected') {
      setNestEvents(null)
      return
    }
    let alive = true
    void listHistoryEvents({
      crewId: crewId === 'all' ? undefined : crewId,
      type: type === 'all' ? undefined : type,
    }).then((events) => {
      if (alive) setNestEvents(events?.length ?? null)
    })
    return () => { alive = false }
  }, [backendMode, listHistoryEvents, crewId, type])
  const chartsOn = type === 'all' || type === 'measurement'
  const trends = useMemo(
    () => (chartsOn ? dailyTrends(state.measurements, crewId) : { pulse: [] as TrendPoint[], sleep: [] as TrendPoint[] }),
    [chartsOn, state.measurements, crewId],
  )
  const episode = state.episodes.find((item) => item.id === selected) ?? state.episodes[0]
  const personLabel = crewId === 'all' ? (en ? 'Whole crew' : 'Toda la tripulación') : CREW.find((crew) => crew.id === crewId)?.name ?? crewId
  const typeLabel = type === 'all' ? (en ? 'All' : 'Todos') : label(type)
  const period = periodLabel(trends.pulse, trends.sleep, en)
  const pulseScale = pulseAxis(trends.pulse)
  const sleepScale = sleepAxis(trends.sleep)
  const aggregation = crewId === 'all'
    ? (en
      ? 'With the whole crew selected, each pulse point is the mean of the people who have a record that day. Sleep uses each person’s latest record that day and then the mean across people. Hours are not added together.'
      : 'Con toda la tripulación, cada punto de pulso es la media de las personas con registro ese día. El descanso usa el último registro de cada persona y después la media entre personas. No se suman las horas.')
    : (en ? `Series for ${personLabel}.` : `Serie de ${personLabel}.`)

  async function runExport(kind: 'json' | 'csv') {
    setExporting(kind)
    setExportError(null)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 120))
      if (kind === 'json') {
        download('helios-historial.json', exportDocument(state, { person: personLabel, type: typeLabel }, rows, trends.pulse, trends.sleep), 'application/json;charset=utf-8')
      } else {
        download('helios-historial.csv', recordsToCsv(exportRecords(state, rows)), 'text/csv;charset=utf-8', true)
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : (en ? 'The export could not be created.' : 'No se pudo crear la exportación.'))
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="hist-page">
      <p className="hist-print-meta">
        {en ? 'Period follow-up report' : 'Informe de seguimiento del periodo'}
        {' · '}
        {en ? 'Simulation' : 'Simulación'}
        {state.link === 'delayed' ? ` · ${en ? `Earth link delayed ${state.linkDelayMin} min` : `Enlace Tierra con demora ${state.linkDelayMin} min`}` : ''}
        {' · '}
        {personLabel}
        {' · '}
        {typeLabel}
        {' · '}
        {period}
      </p>
      <header className="hist-head">
        <div>
          <p className="kicker">{en ? 'History' : 'Historial'}</p>
          <h1>{en ? 'Period follow-up' : 'Seguimiento del periodo'}</h1>
          <p className="lede">
            {en
              ? 'Pulse and sleep use separate charts: they do not share an axis because the units are not comparable.'
              : 'El pulso y el descanso van en gráficos separados: no comparten eje porque las unidades no son comparables.'}
            {nestEvents != null
              ? (en
                ? ` Nest /api/history reports ${nestEvents} events for this filter.`
                : ` Nest /api/history reporta ${nestEvents} eventos para este filtro.`)
              : ''}
          </p>
        </div>
        <div className="hist-exports no-print">
          <button className="hist-export" type="button" disabled={exporting !== null} onClick={() => void runExport('json')}>
            {exporting === 'json' ? (en ? 'Exporting…' : 'Exportando…') : (en ? 'Export JSON' : 'Exportar JSON')}
          </button>
          <button className="hist-export" type="button" disabled={exporting !== null} onClick={() => void runExport('csv')}>
            {exporting === 'csv' ? (en ? 'Exporting…' : 'Exportando…') : (en ? 'Export CSV' : 'Exportar CSV')}
          </button>
          <button className="hist-export" type="button" onClick={() => window.print()}>{en ? 'Print view' : 'Vista imprimible'}</button>
        </div>
      </header>
      {exportError ? (
        <p className="hist-error no-print" role="alert">
          {exportError}
          <button type="button" onClick={() => setExportError(null)}>{en ? 'Dismiss' : 'Cerrar'}</button>
        </p>
      ) : null}
      <div className="hist-filters no-print">
        <label htmlFor="hist-person">{en ? 'Person' : 'Persona'}
          <select id="hist-person" value={crewId} onChange={(event) => setCrewId(event.target.value as CrewId | 'all')}>
            <option value="all">{en ? 'Whole crew' : 'Toda la tripulación'}</option>
            {CREW.map((crew) => <option key={crew.id} value={crew.id}>{crew.name}</option>)}
          </select>
        </label>
        <label htmlFor="hist-type">{en ? 'Type' : 'Tipo'}
          <select id="hist-type" value={type} onChange={(event) => setType(event.target.value as HistoryRow['type'] | 'all')}>
            <option value="all">{en ? 'All' : 'Todos'}</option>
            <option value="measurement">{en ? 'Measurements' : 'Mediciones'}</option>
            <option value="symptom">{en ? 'Symptoms' : 'Síntomas'}</option>
            <option value="alert">{en ? 'Alerts' : 'Alertas'}</option>
            <option value="inventory">{en ? 'Inventory' : 'Inventario'}</option>
            <option value="communication">{en ? 'Communications' : 'Comunicaciones'}</option>
            <option value="analysis">{en ? 'Analyses' : 'Análisis'}</option>
          </select>
        </label>
      </div>
      <p className="sr-only">{aggregation} {en ? 'Days without records are omitted, not drawn as zero.' : 'Los días sin registros no se dibujan como cero.'}</p>
      <div className="hist-charts">
        <section className="hist-chart">
          <div className="hist-card">
            <h2>{en ? 'Average pulse by day' : 'Pulso medio por día'}</h2>
            <TrendChart
              points={trends.pulse}
              unit={en ? 'bpm' : 'lpm'}
              domain={pulseScale.domain}
              ticks={pulseScale.ticks}
              empty={en ? 'No pulse records for this filter. Missing data is not drawn as zero.' : 'No hay registros de pulso para este filtro. La ausencia no se dibuja como cero.'}
            />
          </div>
          <p>{en ? 'Average of the heart rates recorded each day, in bpm.' : 'Promedio de las frecuencias cardíacas registradas cada día, en lpm.'}</p>
        </section>
        <section className="hist-chart">
          <div className="hist-card">
            <h2>{en ? 'Sleep by day' : 'Descanso por día'}</h2>
            <TrendChart
              points={trends.sleep}
              unit="h"
              domain={sleepScale.domain}
              ticks={sleepScale.ticks}
              empty={en ? 'No sleep records for this filter. Missing data is not drawn as zero.' : 'No hay registros de descanso para este filtro. La ausencia no se dibuja como cero.'}
            />
          </div>
          <p>
            {en ? 'Recorded sleep, in hours.' : 'Horas de descanso registradas, en horas.'}
            <br />
            {en ? 'It does not share an axis with pulse.' : 'No está en el mismo eje que el pulso.'}
          </p>
        </section>
      </div>
      <div className="no-print" style={{ margin: '18px 0 28px' }}>
        <PlatformIndicatorCharts missionId={getActiveMissionId()} />
      </div>
      <table className="hist-table">
        <caption>{en ? 'Daily values used in the charts' : 'Valores diarios usados en los gráficos'}. {aggregation}</caption>
        <thead>
          <tr>
            <th>{en ? 'Date' : 'Fecha'}</th>
            <th>{en ? 'Pulse (bpm)' : 'Pulso (lpm)'}</th>
            <th>{en ? 'Sleep (h)' : 'Descanso (h)'}</th>
          </tr>
        </thead>
        <tbody>
          {mergeDays(trends.pulse, trends.sleep).map((row) => (
            <tr key={row.day}>
              <td>{row.title}</td>
              <td>{row.pulse === null ? (en ? 'No record' : 'Sin registro') : row.pulse}</td>
              <td>{row.sleep === null ? (en ? 'No record' : 'Sin registro') : row.sleep}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="hist-log">
        <section className="panel">
          <h2>{en ? 'Timeline' : 'Cronología'}</h2>
          {rows.length === 0 ? <Empty title={en ? 'No events' : 'Sin eventos'} text={en ? 'That filter has no records.' : 'Ese filtro no tiene registros.'} /> : (
            <ol className="timeline">
              {rows.slice(0, 40).map((row) => (
                <li key={row.id}>
                  <span className="dot" aria-hidden="true" />
                  <button type="button" className="btn btn-ghost" onClick={() => row.type === 'symptom' || row.type === 'alert' ? setSelected(state.episodes.find((item) => item.crewId === row.crewId)?.id ?? selected) : undefined}>
                    <strong>{formatMission(row.at)} · {label(row.type)}</strong>
                    <span className="muted"> {row.detail}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
        <aside className="detail">
          <h2>{en ? 'Episode' : 'Episodio'}</h2>
          {episode ? (
            <>
              <p>{episode.title}</p>
              <p className="muted">{CREW.find((crew) => crew.id === episode.crewId)?.name} · {episodeStatusLabel(episode.status)} · {formatMission(episode.openedAt)}</p>
            </>
          ) : <p>{en ? 'No episode is selected.' : 'No hay un episodio seleccionado.'}</p>}
        </aside>
      </div>
    </div>
  )
}

function label(type: HistoryRow['type']): string {
  const names = { measurement: 'Medición', symptom: 'Síntoma', alert: 'Alerta', inventory: 'Inventario', communication: 'Comunicación', analysis: 'Análisis' }
  return names[type]
}

function periodLabel(pulse: TrendPoint[], sleep: TrendPoint[], en: boolean): string {
  const days = [...pulse, ...sleep].map((point) => point.day).filter(Boolean).sort()
  if (days.length === 0) return en ? 'No period' : 'Sin periodo'
  return `${days[0]} – ${days[days.length - 1]}`
}

function mergeDays(pulse: TrendPoint[], sleep: TrendPoint[]) {
  const days = new Map<string, { day: string; title: string; pulse: number | null; sleep: number | null }>()
  for (const point of pulse) days.set(point.day, { day: point.day, title: point.title, pulse: point.value, sleep: null })
  for (const point of sleep) {
    const current = days.get(point.day) ?? { day: point.day, title: point.title, pulse: null, sleep: null }
    current.sleep = point.value
    days.set(point.day, current)
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day))
}

function download(filename: string, content: string, type: string, bom = false) {
  const url = URL.createObjectURL(new Blob([bom ? `\uFEFF${content}` : content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
