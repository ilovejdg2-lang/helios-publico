import { useEffect, useState } from 'react'
import { platformApi } from '../../platform/api'
import { getActiveMissionId } from '../../platform/session'
import { useLocale } from '../../i18n'

export function SharedCareSummaries() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const missionId = getActiveMissionId()
  const [items, setItems] = useState<Awaited<ReturnType<typeof platformApi.quironSummaries>>['items']>([])
  const [error, setError] = useState('')
  useEffect(() => {
    if (!missionId) return
    let active = true
    platformApi.quironSummaries(missionId).then(result => { if (active) setItems(result.items) })
      .catch(() => { if (active) setError(en ? 'Could not load approved summaries.' : 'No se pudieron cargar los resúmenes aprobados.') })
    return () => { active = false }
  }, [missionId, en])
  return <section className="rd-card" aria-label={en ? 'Approved Quirón summaries' : 'Resúmenes aprobados de Quirón'}>
    <h2>{en ? 'Summaries approved for you' : 'Resúmenes aprobados para ti'}</h2>
    {error ? <p role="alert">{error}</p> : null}
    {!items.length && !error ? <p>{en ? 'No summaries have been shared with you. Private conversations remain hidden.' : 'No se han compartido resúmenes contigo. Las conversaciones privadas permanecen ocultas.'}</p> : null}
    {items.map(item => <article key={item.id}><p>{item.profileId} · {item.mode === 'physical' ? (en ? 'Physical health' : 'Salud física') : (en ? 'Wellbeing' : 'Bienestar')}</p><p style={{ whiteSpace: 'pre-wrap' }}>{item.body}</p></article>)}
  </section>
}
