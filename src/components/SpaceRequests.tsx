import { ageLabel, shareLevelLabel } from '../domain/format'
import { visibleSpaceRequests } from '../domain/spaceRequests'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'

export function SpaceRequests() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state } = useApp()
  if (state.role === 'ops') return null
  const items = visibleSpaceRequests(state)
  return (
    <section className="panel" aria-labelledby="space-requests-title" data-testid="space-requests">
      <h2 id="space-requests-title">{en ? 'Requests' : 'Solicitudes'}</h2>
      <p className="muted">{en ? 'Only what was sent from My space, at the level each person chose. Simulation.' : 'Solo lo enviado desde Mi espacio, con el nivel que eligió cada persona. Simulación.'}</p>
      {items.length === 0 ? <p className="empty">{en ? 'Nobody has sent a request.' : 'Nadie ha enviado una solicitud.'}</p> : (
        <ul className="timeline">
          {items.map((item) => (
            <li key={item.id}>
              <span className="dot" aria-hidden="true" />
              <span>{item.line}</span>
              <span className="muted">{shareLevelLabel(item.level)} · {ageLabel(state.clock.simulatedAt, item.sentAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
