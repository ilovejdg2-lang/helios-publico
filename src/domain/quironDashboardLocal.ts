import type { AppState } from '../../shared/types'
import { crewById } from './crew'
import { activeHealthAlerts, latestReliable, vitalTrends } from './selectors'

/** Local evidence remains role-bound; it does not require an open episode. */
export function dashboardIndicatorAnswer(state: AppState, question: string, en: boolean) {
  if (!/pulso|frecuencia|pulse|heart|sueño|sleep|alert/i.test(question)) return undefined
  if (state.role === 'ops') return en
    ? 'An alert flags something to review. This operations role cannot access personal health readings. I can explain how indicators work without opening those records.'
    : 'Una alerta señala algo que conviene revisar. El rol de operaciones no puede acceder a mediciones personales de salud. Sí puedo explicar cómo funcionan los indicadores sin abrir esos registros.'
  const crewId = state.role === 'astronaut' ? state.sessionCrewId : state.selectedCrewId
  const name = crewById(crewId).name
  if (/sueño|sleep/i.test(question)) {
    const m = latestReliable(state, crewId, 'sleep_hours')
    return m
      ? en ? `${name}: the latest reliable simulated sleep record is ${m.value} ${m.unit}. It does not measure how you feel now.`
        : `${name}: el último registro simulado confiable de sueño es ${m.value} ${m.unit}. No mide cómo te sientes ahora.`
      : en ? `There is no recent reliable sleep record for ${name}. Missing data does not establish adequate sleep.`
        : `No hay un registro reciente confiable de sueño de ${name}. La falta de datos no demuestra un descanso suficiente.`
  }
  if (/alert/i.test(question)) {
    const count = activeHealthAlerts(state, crewId).length
    return en ? `${name} has ${count} active health alert(s) in the simulation. These are review flags, not diagnoses. The associated readings and their quality help explain each finding.`
      : `${name} tiene ${count} alerta(s) de salud activas en la simulación. Piden revisión; no son diagnósticos. Las mediciones asociadas y su calidad ayudan a entender cada hallazgo.`
  }
  const t = vitalTrends(state, crewId)
  return t.currentHr === null
    ? en ? `There is no current reliable simulated pulse reading for ${name}. I cannot conclude that it is stable without that evidence.`
      : `No hay una lectura simulada actual confiable de pulso de ${name}. Sin esa evidencia no puedo concluir que esté estable.`
    : en ? `${name}: the latest reliable pulse in the simulated 30-minute window is ${t.currentHr} bpm; individual reference ${t.hrMin}–${t.hrMax} bpm. This comparison alone does not explain the cause of a change.`
      : `${name}: el último pulso confiable en la ventana simulada de 30 minutos es ${t.currentHr} lpm; referencia individual de ${t.hrMin}–${t.hrMax} lpm. La comparación por sí sola no explica la causa de un cambio.`
}
