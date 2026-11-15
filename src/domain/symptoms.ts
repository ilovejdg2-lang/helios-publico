import type { AppState, CrewId, Episode, SymptomReport } from '../../shared/types'
import { canRegisterSymptom } from './access'
import { addAudit, hasKey, rememberKey, withNotice } from './stateOps'
import { ensureAlert } from './messages'

const ALLOWED = new Set(['cansancio', 'mareo', 'cefalea', 'nausea', 'otro'])

export interface SymptomDraft {
  crewId: CrewId
  symptoms: string[]
  note: string
  idempotencyKey: string
  reportedAt?: number
  id?: string
  episodeId?: string
  episodeTitle?: string
  enforceRole?: boolean
}

export function registerSymptom(state: AppState, draft: SymptomDraft): AppState {
  if (draft.enforceRole !== false && !canRegisterSymptom(state.role)) {
    return withNotice(state, 'err', 'Este rol simulado no puede registrar síntomas.')
  }
  if (hasKey(state, draft.idempotencyKey)) {
    return withNotice(state, 'warn', 'Ese reporte ya estaba registrado.')
  }
  const symptoms = draft.symptoms.filter((item) => ALLOWED.has(item))
  const note = draft.note.trim().slice(0, 2000)
  if (symptoms.length === 0 && note.length === 0) {
    return withNotice(state, 'err', 'Indicá al menos un síntoma o una nota.')
  }
  if (symptoms.includes('otro') && note.length === 0) {
    return withNotice(state, 'err', 'Si elegís “Otro”, la nota es obligatoria.')
  }

  const seq = state.seq + 1
  const existing = state.episodes.find((episode) => episode.crewId === draft.crewId && episode.status !== 'closed')
  const episodeId = draft.episodeId ?? existing?.id ?? `ep-${seq}`
  const symptom: SymptomReport = {
    id: draft.id ?? `sym-${seq}`,
    crewId: draft.crewId,
    symptoms,
    note,
    reportedAt: draft.reportedAt ?? state.clock.simulatedAt,
    episodeId,
  }

  let episodes = state.episodes
  if (!existing && !state.episodes.some((episode) => episode.id === episodeId)) {
    const episode: Episode = {
      id: episodeId,
      crewId: draft.crewId,
      title: draft.episodeTitle ?? 'Síntomas reportados',
      status: 'open',
      openedAt: symptom.reportedAt,
      symptomIds: [symptom.id],
      alertIds: [],
      measurementIds: [],
    }
    episodes = [...episodes, episode]
  } else {
    episodes = episodes.map((episode) =>
      episode.id === episodeId ? { ...episode, symptomIds: [...episode.symptomIds, symptom.id] } : episode,
    )
  }

  let next: AppState = rememberKey(
    { ...state, seq, symptoms: [...state.symptoms, symptom], episodes, selectedEpisodeId: episodeId },
    draft.idempotencyKey,
  )
  const alertId = `alert-symptom-${draft.crewId}`
  const hadAlert = next.alerts.some((alert) => alert.id === alertId && alert.status !== 'closed')
  next = ensureAlert(next, {
    id: alertId,
    type: 'symptom',
    status: 'active',
    crewId: draft.crewId,
    sensorId: null,
    episodeId,
    title: 'Síntomas reportados',
    reason: 'Hay un autorreporte pendiente de revisión humana.',
    openedAt: symptom.reportedAt,
    updatedAt: symptom.reportedAt,
    astronautAck: false,
    source: draft.enforceRole === false ? 'simulation' : 'user',
  })
  if (!hadAlert) {
    next = {
      ...next,
      episodes: next.episodes.map((episode) =>
        episode.id === episodeId && !episode.alertIds.includes(alertId)
          ? { ...episode, alertIds: [...episode.alertIds, alertId] }
          : episode,
      ),
    }
  }
  const noted = draft.enforceRole === false ? next : withNotice(next, 'ok', 'Síntomas registrados. Quedan pendientes de revisión humana.')
  return addAudit(noted, {
    actor: state.role,
    action: 'register-symptom',
    entityId: symptom.id,
    detail: draft.enforceRole === false
      ? 'Autorreporte incluido en el escenario. No se generó un diagnóstico.'
      : 'Se guardó el autorreporte. No se generó un diagnóstico.',
  })
}
