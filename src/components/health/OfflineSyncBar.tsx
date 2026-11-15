import { useEffect, useState } from 'react'
import { useLocale } from '../../i18n'
import {
  flushOfflineQueue,
  isBrowserOnline,
  listOfflineOps,
  pendingOfflineCount,
  startOfflineQueueListener,
} from '../../platform/offlineQueue'

export function OfflineSyncBar() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [online, setOnline] = useState(isBrowserOnline())
  const [pending, setPending] = useState(pendingOfflineCount())
  const [msg, setMsg] = useState('')

  useEffect(() => {
    startOfflineQueueListener()
    const sync = () => {
      setOnline(isBrowserOnline())
      setPending(pendingOfflineCount())
    }
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    window.addEventListener('helios:offline-queue', sync)
    sync()
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
      window.removeEventListener('helios:offline-queue', sync)
    }
  }, [])

  if (online && pending === 0 && !msg) return null

  return (
    <div className="rd-card health-offline-bar" role="status" data-testid="offline-sync-bar">
      <p style={{ margin: 0 }}>
        {!online
          ? (en
            ? 'Earth link offline. New indicator/symptom/appointment/wake actions are queued locally.'
            : 'Enlace Tierra sin conexión. Indicadores/síntomas/citas/wake se encolan en local.')
          : (en
            ? `Online · ${pending} queued action(s) pending sync.`
            : `En línea · ${pending} acción(es) en cola pendientes de sync.`)}
      </p>
      {listOfflineOps().slice(0, 4).map((op) => (
        <p key={op.id} className="rd-muted" style={{ margin: '4px 0 0' }}>
          {op.type} · {new Date(op.createdAt).toLocaleString()}
          {op.status === 'failed' && op.lastError ? ` · ${op.lastError}` : ''}
        </p>
      ))}
      <div className="rd-actions" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="rd-btn"
          disabled={!online || pending === 0}
          onClick={() => void flushOfflineQueue().then((result) => {
            setPending(pendingOfflineCount())
            setMsg(en
              ? `Synced ${result.synced}, failed ${result.failed}.`
              : `Sincronizados ${result.synced}, fallidos ${result.failed}.`)
          })}
        >
          {en ? 'Sync now' : 'Sincronizar ahora'}
        </button>
      </div>
      {msg ? <p className="rd-ok">{msg}</p> : null}
    </div>
  )
}
