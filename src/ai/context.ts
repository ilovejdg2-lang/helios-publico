import { DEMO_PROTOCOLS } from '../../shared/protocols'
import { nasaSourceLines } from '../domain/scienceBrief'
import type { AnalysisContextInput } from '../../shared/aiSchema'
import type { AppState } from '../../shared/types'
import { crewById } from '../domain/crew'

export function buildAnalysisContext(state: AppState, episodeId: string, question?: string, locale?: 'es' | 'en'): AnalysisContextInput | null {
  const episode = state.episodes.find((item) => item.id === episodeId)
  if (!episode) return null
  const profile = crewById(episode.crewId)
  const measurements = state.measurements
    .filter((item) => item.crewId === episode.crewId)
    .slice()
    .sort((a, b) => b.measuredAt - a.measuredAt)
    .slice(0, 20)
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      value: item.value,
      unit: item.unit,
      measuredAt: item.measuredAt,
      receivedAt: item.receivedAt,
      signalQuality: item.signalQuality,
      integrity: item.integrity,
      macValid: item.macValid,
      origin: item.origin,
      sensorId: item.sensorId,
    }))
  return {
    episodeId,
    crewId: episode.crewId,
    crewName: profile.name,
    ...(question ? { question: question.slice(0, 1000) } : {}),
    ...(locale ? { locale } : {}),
    nasaBriefs: nasaSourceLines(state, episode.crewId).slice(0, 4),
    simulatedAt: state.clock.simulatedAt,
    link: state.link,
    missionStage: state.mission.stage,
    missionName: state.mission.name,
    baseline: {
      heartRateLpm: `${profile.baseline.hrMin}–${profile.baseline.hrMax} lpm`,
      sleepHours: `${profile.baseline.sleepMin}–${profile.baseline.sleepMax} h`,
    },
    measurements,
    symptoms: state.symptoms
      .filter((item) => item.episodeId === episodeId)
      .slice(0, 10)
      .map((item) => ({ id: item.id, symptoms: item.symptoms, note: item.note.slice(0, 2000), reportedAt: item.reportedAt })),
    alerts: state.alerts
      .filter((item) => item.crewId === episode.crewId && item.status !== 'closed')
      .slice(0, 12)
      .map((item) => ({ id: item.id, type: item.type, status: item.status, title: item.title, reason: item.reason })),
    resources: state.resources.slice(0, 20).map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      quantity: item.quantity,
      location: item.location,
      status: item.status,
    })),
    protocols: DEMO_PROTOCOLS.map((item) => ({ id: item.id, title: item.title })),
  }
}
