import type { SpaceContextInput } from '../../shared/spaceSchema'
import type { AppState, CrewId } from '../../shared/types'
import { crewById } from '../domain/crew'
import { crewPosture, latestReliable } from '../domain/selectors'
import type { SpaceDataUse } from '../persistence/space'

export function buildSpaceContext(
  state: AppState,
  crewId: CrewId,
  dataUse: SpaceDataUse,
  text: string,
): SpaceContextInput {
  const profile = crewById(crewId)
  const posture = crewPosture(state, crewId)
  const freshness =
    !dataUse.pulse && !dataUse.sleep && !dataUse.symptoms
      ? 'sin_datos_recientes'
      : posture.observed === 'change'
        ? 'cambio'
        : posture.observed === 'stable'
          ? 'linea_base'
          : 'sin_datos_recientes'
  const measurements = []
  if (dataUse.pulse) {
    const pulse = latestReliable(state, crewId, 'heart_rate')
    if (pulse)
      measurements.push({
        id: pulse.id,
        kind: pulse.kind,
        value: pulse.value,
        unit: pulse.unit,
      })
  }
  if (dataUse.sleep) {
    const sleep = latestReliable(state, crewId, 'sleep_hours')
    if (sleep)
      measurements.push({
        id: sleep.id,
        kind: sleep.kind,
        value: sleep.value,
        unit: sleep.unit,
      })
  }
  const symptoms = dataUse.symptoms
    ? state.symptoms
        .filter((item) => item.crewId === crewId)
        .slice(0, 8)
        .map((item) => ({ id: item.id, symptoms: item.symptoms }))
    : []
  return {
    crewId,
    crewName: profile.name,
    simulatedAt: state.clock.simulatedAt,
    freshness,
    datosPersona: { measurements, symptoms },
    textoPersona: text.slice(0, 2000),
  }
}
