import { defaultMission, defaultPrepItems } from '../../shared/mission'
import { STATE_VERSION, type AppState, type Resource, type ScenarioId } from '../../shared/types'
import { DEFAULT_SEED, MISSION_EPOCH } from './constants'

export function defaultResources(at: number): Resource[] {
  const reviewed = at - 2 * 60 * 60 * 1000
  return [
    resource('oximeter', 'Oxímetro', 'reusable', 'equipment', 2, 'Módulo médico', 'ready', reviewed),
    resource('bp-cuff', 'Tensiómetro', 'reusable', 'equipment', 1, 'Gabinete A', 'ready', reviewed),
    resource('thermometer', 'Termómetro', 'reusable', 'equipment', 2, 'Gabinete B', 'ready', reviewed),
    resource('eval-kit', 'Kit de evaluación', 'reusable', 'equipment', 1, 'Módulo médico', 'review', at - 26 * 60 * 60 * 1000),
    resource('supplement', 'Suplemento nutricional (simulado)', 'consumable', 'supply', 6, 'Módulo médico', 'ready', reviewed),
  ]
}

function resource(
  id: string,
  name: string,
  kind: Resource['kind'],
  category: Resource['category'],
  quantity: number,
  location: string,
  status: Resource['status'],
  lastReviewAt: number,
): Resource {
  return { id, name, kind, category, quantity, unitLabel: 'unidades', location, status, lastReviewAt, useCount: 0 }
}

export function blankState(scenarioId: ScenarioId, seed = DEFAULT_SEED): AppState {
  return {
    stateVersion: STATE_VERSION,
    scenarioId,
    seed,
    clock: { running: true, speed: 10, originAt: MISSION_EPOCH, simulatedAt: MISSION_EPOCH },
    link: 'up',
    linkDelayMin: 0,
    role: 'medical',
    sessionCrewId: 'elena-torres',
    selectedCrewId: 'elena-torres',
    selectedEpisodeId: null,
    mission: defaultMission(),
    prepItems: defaultPrepItems(MISSION_EPOCH),
    measurements: [],
    symptoms: [],
    alerts: [],
    episodes: [],
    resources: defaultResources(MISSION_EPOCH),
    movements: [],
    communications: [],
    spaceRequests: [],
    analyses: [],
    chats: [],
    audit: [],
    rejected: [],
    seenMessageIds: [],
    lastInboundSequence: 0,
    idempotencyKeys: [],
    seq: 0,
    notice: null,
    soundEnabled: false,
  }
}
