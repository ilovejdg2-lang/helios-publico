import { CarouselStrip } from '../CarouselStrip'
import { CrewHelmet } from '../CrewHelmet'
import { CREW } from '../../domain/crew'
import { useLocale } from '../../i18n'
import { useApp } from '../../state/store'
import type { CrewId } from '../../../shared/types'
import { activeAlerts, crewPosture } from '../../domain/selectors'

/** Selector visual de astronautas (cascos) — carrusel cuando la fila se llena. */
export function CrewPickerStrip({
  label,
  onSelect,
}: {
  label?: string
  onSelect?: (crewId: CrewId) => void
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch } = useApp()
  const selected = state.selectedCrewId
  const title = label || (en ? 'Choose an astronaut' : 'Elegí un astronauta')

  return (
    <div className="rd-crew-picker-wrap">
      <p className="rd-crew-picker-label">{title}</p>
      <CarouselStrip className="crew-carousel" trackClassName="crew-picker rd-crew-picker" label={en ? 'Crew' : 'Tripulación'}>
        {CREW.map((item) => {
          const posture = crewPosture(state, item.id)
          const alertCount = activeAlerts(state, 'active').filter((alert) => alert.crewId === item.id).length
          const critical = posture.observed === 'change' || alertCount > 0
          return (
            <button
              key={item.id}
              type="button"
              className={`crew-pick${critical ? ' is-critical' : ''}`}
              data-testid={`crew-${item.id}`}
              aria-pressed={item.id === selected}
              aria-label={
                item.id === selected
                  ? en
                    ? `${item.name}, selected`
                    : `${item.name}, seleccionada`
                  : item.name
              }
              onClick={() => {
                dispatch({ type: 'selectCrew', crewId: item.id })
                onSelect?.(item.id)
              }}
            >
              <CrewHelmet id={item.id} name={item.name} selected={item.id === selected} />
              <span aria-hidden="true">{item.name.split(' ')[0]}</span>
              {critical ? (
                <span className="rd-crew-flag">
                  {alertCount > 0
                    ? (en ? 'Alert' : 'Alerta')
                    : (en ? 'Change' : 'Cambio')}
                </span>
              ) : null}
            </button>
          )
        })}
      </CarouselStrip>
    </div>
  )
}
