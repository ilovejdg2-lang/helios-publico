import { DonkiAlertsPanel } from '../components/DonkiAlertsPanel'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Alert, AlertStatus } from '../../shared/types'
import { SciencePanel } from '../components/SciencePanel'
import { Empty } from '../components/ui'
import { isSensorAlert } from '../domain/access'
import { CREW } from '../domain/crew'
import { alertKindLabel, alertReasonLabel } from '../domain/alertCopy'
import { alertTypeLabel, auditActionLabel, formatMission, integrityLabel, rejectLabel, roleLabel } from '../domain/format'
import { briefForCrew } from '../domain/scienceBrief'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'

const FILTERS: { status: AlertStatus; es: string; en: string }[] = [
  { status: 'active', es: 'Activas', en: 'Active' },
  { status: 'following', es: 'En seguimiento', en: 'Following' },
  { status: 'closed', es: 'Cerradas', en: 'Closed' },
]

function reasonLines(reason: string) {
  const clean = reason.replace(/por encima de su encima de su/g, 'por encima de su')
  return clean.split(/(?<=\.)\s+/).map((line) => line.trim()).filter(Boolean)
}

function stamp(ms: number, en = true) {
  const locale = en ? 'en-GB' : 'es'
  const day = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', day: '2-digit', month: 'short' })
    .format(ms)
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  const time = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ms)
  return { day, time }
}

function pickInitial(alerts: Alert[]) {
  const active = alerts.filter((alert) => alert.status === 'active')
  return active.find((alert) => alert.type === 'change')?.id ?? active[0]?.id ?? alerts[0]?.id ?? ''
}

export function AlertsPage() {
  const { state, dispatch, backendMode } = useApp()
  const { lang } = useLocale()
  const en = lang === 'en'
  const navigate = useNavigate()
  const [tab, setTab] = useState<AlertStatus>('active')
  const [selectedId, setSelectedId] = useState(() => pickInitial(state.alerts))
  const [busy, setBusy] = useState<string | null>(null)
  const nestAlerts = backendMode === 'connected'
  const counts = { active: 0, following: 0, closed: 0 }
  for (const alert of state.alerts) counts[alert.status] += 1
  const rows = state.alerts
    .filter((alert) => alert.status === tab)
    .slice()
    .sort((a, b) => b.openedAt - a.openedAt)

  useEffect(() => {
    if (selectedId === '') return
    if (rows.some((alert) => alert.id === selectedId)) return
    setSelectedId(rows[0]?.id ?? '')
  }, [rows, selectedId])

  const selected = rows.find((alert) => alert.id === selectedId) ?? null
  const crewName = (id: string | null) => (id ? CREW.find((crew) => crew.id === id)?.name : null) ?? 'Sistema'

  function run(key: string, action: () => void) {
    if (busy) return
    setBusy(key)
    action()
    window.setTimeout(() => setBusy(null), 320)
  }

  function openAnalysis(alert: Alert) {
    if (busy) return
    if (alert.crewId) dispatch({ type: 'selectCrew', crewId: alert.crewId })
    dispatch({ type: 'selectEpisode', episodeId: alert.episodeId })
    navigate('/app/analisis', { state: { alertId: alert.id } })
  }

  return (
    <div className="alerts-page">
      <header className="alerts-head">
        <p className="alerts-kicker">{en ? 'Alerts' : 'Alertas'}</p>
        <h1>{en ? 'Alert center' : 'Centro de Alertas'}</h1>
        <p className="alerts-lede">
          {en ? 'A sensor notice does not close a health episode.' : 'Un aviso de sensor no cierra un episodio de salud.'}
          <br />
          {en ? 'Two equal readings are not presented as an attack.' : 'Dos lecturas iguales no se presentan como ataque'}
        </p>
      </header>

      <section className="alerts-health" aria-labelledby="alerts-health-title">
        <div className="alerts-section-label">
          <p className="donki-kicker">{en ? 'Health and follow-up' : 'Salud y seguimiento'}</p>
          <h2 id="alerts-health-title" className="alerts-section-title">
            {en ? 'Clinical notices' : 'Avisos clínicos'}
          </h2>
          <p className="alerts-section-lede">
            {en
              ? 'Active, follow-up, and closed health alerts. Space-weather events are listed separately and do not change these counts.'
              : 'Alertas de salud activas, en seguimiento y cerradas. Los eventos de clima espacial se listan aparte y no modifican estos contadores.'}
            {nestAlerts
              ? (en
                ? ' Confirm / follow / close use Nest /api/alerts.'
                : ' Confirmar / seguimiento / cerrar usan Nest /api/alerts.')
              : ''}
          </p>
        </div>
        <div className="alerts-filters" role="group" aria-label={en ? 'Alert status' : 'Estado de las alertas'}>
          {FILTERS.map((filter) => (
            <button
              key={filter.status}
              type="button"
              aria-pressed={tab === filter.status}
              data-testid={`filter-${filter.status}`}
              onClick={() => setTab(filter.status)}
            >
              {(en ? filter.en : filter.es)} ({counts[filter.status]})
            </button>
          ))}
        </div>
        <div className={`alerts-layout${selected ? ' has-selection' : ''}`}>
          <div className="alerts-list" id="alerts-list">
            {rows.length === 0 ? (
              <Empty title={en ? 'No alerts in this state' : 'No hay alertas en este estado'} text={en ? 'When an action or the scenario leaves a notice here, it will show up in this list.' : 'Cuando una acción o el escenario deje un aviso aquí, va a aparecer en esta lista.'} />
            ) : (
              rows.map((alert) => {
                const when = stamp(alert.openedAt, en)
                return (
                  <button
                    key={alert.id}
                    type="button"
                    className={`alert-card${alert.type === 'symptom' ? ' is-muted' : ''}`}
                    data-testid={`alert-${alert.id}`}
                    aria-pressed={alert.id === selected?.id}
                    onClick={() => setSelectedId(alert.id)}
                  >
                    <span className="alert-card-copy">
                      <span className="alert-card-name">{crewName(alert.crewId)}</span>
                      <span className="alert-card-kind">{alertKindLabel(alert.type, alert.title, en)}</span>
                      <span className="sr-only">{alert.title}</span>
                      <span className={`alert-badge is-${alert.type}`}>{alertTypeLabel(alert.type)}</span>
                    </span>
                    <span className="alert-card-when">
                      <b>{when.day}</b>
                      <span>{when.time}</span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
          <article className="alerts-detail" aria-live="polite">
            {selected ? (
              <AlertDetail
                alert={selected}
                name={crewName(selected.crewId)}
                busy={busy}
                audit={state.audit.filter((item) => item.entityId === selected.id)}
                onAck={() => run('ack', () => dispatch({ type: 'ackAlert', alertId: selected.id }))}
                onFollow={() => run('follow', () => dispatch({ type: 'setAlertStatus', alertId: selected.id, status: 'following' }))}
                onClose={() => run('close', () => dispatch(isSensorAlert(selected.type)
                  ? { type: 'resolveSensorAlert', alertId: selected.id }
                  : { type: 'setAlertStatus', alertId: selected.id, status: 'closed' }))}
                onAnalysis={() => openAnalysis(selected)}
                onBack={() => setSelectedId('')}
                english={en}
              />
            ) : (
              <div className="alerts-detail-empty">
                <h2>{en ? 'No alert selected' : 'Sin alerta seleccionada'}</h2>
                <p>{en ? 'Choose a notice from the list to see the detail, the actions, and the timeline.' : 'Elegí un aviso de la lista para ver el detalle, las acciones y la línea de tiempo.'}</p>
              </div>
            )}
          </article>
        </div>
      </section>

      <DonkiAlertsPanel />
      {selected ? <SciencePanel brief={briefForCrew(state, selected.crewId, lang, selected)} /> : null}
      <section className="panel alerts-integrity">
        <h2>{en ? 'Recent integrity' : 'Integridad reciente'}</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{en ? 'Time' : 'Hora'}</th><th>{en ? 'Source' : 'Origen'}</th><th>{en ? 'Data' : 'Dato'}</th><th>{en ? 'Integrity' : 'Integridad'}</th><th>{en ? 'Detail' : 'Detalle'}</th></tr></thead>
            <tbody>
              {state.measurements.slice(-6).reverse().map((item) => (
                <tr key={item.id}><td>{formatMission(item.measuredAt)}</td><td>{item.sensorId}</td><td>{item.value} {item.unit}</td><td>{integrityLabel(item.integrity)}</td><td>{item.origin === 'local' ? (en ? 'Local record' : 'Registro local') : item.macValid ? (en ? 'Valid demonstration MAC' : 'MAC de demostración válido') : (en ? 'No MAC' : 'Sin MAC')}</td></tr>
              ))}
              {state.rejected.slice(-4).reverse().map((item) => (
                <tr key={item.id}><td>{formatMission(item.at)}</td><td>{item.sensorId}</td><td>{item.claimedValue ?? '—'}</td><td>{rejectLabel(item.reason)}</td><td>{item.detail}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AlertDetail({
  alert,
  name,
  busy,
  audit,
  onAck,
  onFollow,
  onClose,
  onAnalysis,
  onBack,
  english,
}: {
  alert: Alert
  name: string
  busy: string | null
  audit: { id: string; action: string; at: number; actor: string; detail: string }[]
  onAck: () => void
  onFollow: () => void
  onClose: () => void
  onAnalysis: () => void
  onBack: () => void
  english: boolean
}) {
  const opened = stamp(alert.openedAt, english)
  const updated = stamp(alert.updatedAt, english)
  return (
    <>
      <button className="alerts-back" type="button" onClick={onBack}>
        {english ? 'Back to the list' : 'Volver a la lista'}
      </button>
      <p className="alerts-detail-kind">{alertKindLabel(alert.type, alert.title, english)}</p>
      <h2>{name}</h2>
      {reasonLines(alertReasonLabel(alert, name, english)).map((line) => <p key={line} className="alerts-detail-reason">{line}</p>)}
      <p className="alerts-meta">
        {english ? 'Opened' : 'Abierta'} {opened.day}, {opened.time} - {english ? 'Updated' : 'Actualizada'} {updated.day}, {updated.time} - {alert.astronautAck ? (english ? 'Notice confirmed' : 'Aviso confirmado') : (english ? 'Notice not confirmed' : 'Aviso sin confirmar')}
      </p>
      <div className="alerts-actions">
        <button type="button" className="alerts-btn is-line" disabled={alert.astronautAck || busy !== null} aria-busy={busy === 'ack'} onClick={onAck}>
          {busy === 'ack' ? (english ? 'Confirming…' : 'Confirmando…') : (english ? 'Confirm notice' : 'Confirmar aviso')}
        </button>
        <button type="button" className="alerts-btn is-line" disabled={alert.status !== 'active' || busy !== null} aria-busy={busy === 'follow'} onClick={onFollow}>
          {busy === 'follow' ? (english ? 'Updating…' : 'Actualizando…') : (english ? 'Move to follow-up' : 'Pasar a seguimiento')}
        </button>
        <Link className="alerts-btn is-fill" to="/app/analisis" onClick={(event) => { event.preventDefault(); onAnalysis() }}>
          {english ? 'Open analysis' : 'Abrir análisis'}
        </Link>
        <button type="button" className="alerts-btn is-close" disabled={alert.status === 'closed' || busy !== null} aria-busy={busy === 'close'} onClick={onClose}>
          {busy === 'close' ? (english ? 'Closing…' : 'Cerrando…') : (english ? 'Close alert' : 'Cerrar alerta')}
        </button>
      </div>
      <div className="alerts-timeline">
        <h3>{english ? 'Timeline' : 'Línea de tiempo'}</h3>
        {audit.length === 0 ? (
          <p>• {english ? 'Created by the scenario, with no later actions.' : 'Generada por el escenario, sin acciones posteriores.'}</p>
        ) : (
          <ul>
            {audit.map((item) => (
              <li key={item.id}>
                • {auditActionLabel(item.action)} · {stamp(item.at, english).day}, {stamp(item.at, english).time} · {roleLabel(item.actor)} · {item.detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
