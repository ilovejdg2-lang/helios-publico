import type { AppState, CrewId, LinkPacket, MeasurementKind, ScenarioId } from '../../shared/types'
import { HOUR_MS, MINUTE_MS } from './constants'
import { CREW, type CrewProfile } from './crew'
import { mulberry32 } from './hash'
import { ensureAlert, ingestLinkPacket, signedPacket } from './messages'
import { blankState } from './shell'
import { registerSymptom } from './symptoms'

const NOW = blankState('baseline').clock.simulatedAt

export function createInitialState(scenarioId: ScenarioId, seed = 20260201): AppState {
  let state = blankState(scenarioId, seed)
  state = addDailyHistory(state)
  state = addStableCrew(state, 'mateo-ruiz', { hr: 68, spo2: 98, temp: 36.5, sleep: 7.4, resp: 13 }, NOW)
  state = addStableCrew(state, 'alex-morgan', { hr: 62, spo2: 98, temp: 36.5, sleep: 8.2, resp: 13 }, NOW)

  switch (scenarioId) {
    case 'baseline':
      state = addStableCrew(state, 'elena-torres', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.6, resp: 13 }, NOW)
      state = addStableCrew(state, 'sofia-chen', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.5, resp: 14 }, NOW)
      return state
    case 'gradual-fatigue':
      return buildGradual(state)
    case 'frozen-sensor':
      return buildFrozen(state)
    case 'missing-data':
      return buildMissing(state)
    case 'repeated-message':
      return buildRepeated(state)
    case 'altered-message':
      return buildAltered(state)
    case 'link-down':
      return buildLinkDown(state)
    case 'stale-normal':
      return buildStale(state)
    case 'unwell-normal':
      return buildUnwellNormal(state)
    case 'pulse-escalation':
      return buildPulseEscalation(state)
    default:
      return state
  }
}

function addDailyHistory(state: AppState): AppState {
  let next = state
  for (const crew of CREW) {
    for (let day = 7; day >= 1; day -= 1) {
      const at = NOW - day * 24 * HOUR_MS
      const hr = crew.baseline.hrMin + ((day + crew.name.length) % (crew.baseline.hrMax - crew.baseline.hrMin))
      const sleep = Number((crew.baseline.sleepMin + (day % 3) * 0.3).toFixed(1))
      next = send(next, reading(crew, 'heart_rate', hr, at, `hist-${crew.id}-hr-${day}`))
      next = send(next, reading(crew, 'sleep_hours', sleep, at, `hist-${crew.id}-sleep-${day}`))
    }
  }
  return next
}

function buildGradual(state: AppState): AppState {
  let next: AppState = { ...state, link: 'delayed', linkDelayMin: 8 }
  for (let minute = -30; minute <= 0; minute += 1) {
    const value = minute === 0 ? 104 : Math.round(76 + ((104 - 76) * (minute + 30)) / 30)
    next = send(next, reading(crewOf('elena-torres'), 'heart_rate', value, NOW + minute * MINUTE_MS, `elena-hr-${minute}`))
  }
  next = send(next, reading(crewOf('elena-torres'), 'spo2', 97, NOW, 'elena-spo2-now', 96))
  next = send(next, reading(crewOf('elena-torres'), 'temperature', 37.2, NOW, 'elena-temp-now', 96))
  next = send(next, reading(crewOf('elena-torres'), 'sleep_hours', 4.5, NOW - 10 * HOUR_MS, 'elena-sleep-now', 96))
  next = send(next, reading(crewOf('elena-torres'), 'respiratory_rate', 12, NOW - 30 * MINUTE_MS, 'elena-rr-early', 96))
  next = send(next, reading(crewOf('elena-torres'), 'respiratory_rate', 16, NOW, 'elena-rr-now', 96))
  next = send(next, reading(crewOf('sofia-chen'), 'heart_rate', 71, NOW - 20 * HOUR_MS, 'sofia-hr-old'))
  next = send(next, reading(crewOf('sofia-chen'), 'sleep_hours', 7.2, NOW - 20 * HOUR_MS, 'sofia-sleep-old'))
  next = ensureAlert(next, {
    id: 'alert-missing-sofia-chen',
    type: 'missing',
    status: 'active',
    crewId: 'sofia-chen',
    sensorId: 'sensor-fc-sofia-chen',
    episodeId: null,
    title: 'Data not received',
    reason: 'Sofía Chen has no recent reliable measurement. That does not read as a stable state.',
    openedAt: NOW,
    updatedAt: NOW,
    astronautAck: false,
    source: 'simulation',
  })
  const episodeId = 'ep-elena-fatigue'
  next = {
    ...next,
    episodes: [
      ...next.episodes,
      {
        id: episodeId,
        crewId: 'elena-torres',
        title: 'Cambio de signos y fatiga',
        status: 'open',
        openedAt: NOW - 20 * MINUTE_MS,
        symptomIds: [],
        alertIds: ['alert-change-elena-torres'],
        measurementIds: [],
      },
    ],
    selectedEpisodeId: episodeId,
  }
  next = ensureAlert(next, {
    id: 'alert-change-elena-torres',
    type: 'change',
    status: 'active',
    crewId: 'elena-torres',
    sensorId: 'sensor-fc-elena-torres',
    episodeId,
    title: 'Change in signs — Elena Torres',
    reason: 'Heart rate is above baseline. A resting control measurement is still missing.',
    openedAt: NOW,
    updatedAt: NOW,
    astronautAck: false,
    source: 'simulation',
  })
  next = registerSymptom(next, {
    crewId: 'elena-torres',
    symptoms: ['cansancio', 'mareo'],
    note: 'Fatiga mayor a la habitual hoy, especialmente en la mañana.',
    idempotencyKey: 'seed-elena-symptom',
    id: 'sym-elena-seed',
    episodeId,
    episodeTitle: 'Cambio de signos y fatiga',
    reportedAt: NOW - 8 * MINUTE_MS,
    enforceRole: false,
  })
  return next
}

function buildFrozen(state: AppState): AppState {
  let next = addStableCrew(state, 'sofia-chen', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.5, resp: 14 }, NOW)
  for (let index = 0; index < 3; index += 1) {
    next = send(
      next,
      reading(crewOf('elena-torres'), 'heart_rate', 81, NOW - (2 - index) * MINUTE_MS, `frozen-${index}`, 90, 'sensor-03'),
    )
  }
  return next
}

function buildMissing(state: AppState): AppState {
  let next = addStableCrew(state, 'sofia-chen', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.5, resp: 14 }, NOW)
  next = ensureAlert(next, {
    id: 'alert-missing-elena-torres',
    type: 'missing',
    status: 'active',
    crewId: 'elena-torres',
    sensorId: 'sensor-fc-elena-torres',
    episodeId: null,
    title: 'Mediciones ausentes',
    reason: 'No hay lecturas recientes de Elena Torres. La ausencia no se interpreta como normalidad.',
    openedAt: NOW,
    updatedAt: NOW,
    astronautAck: false,
    source: 'simulation',
  })
  return next
}

function buildRepeated(state: AppState): AppState {
  let next = addStableCrew(state, 'sofia-chen', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.5, resp: 14 }, NOW)
  const packet = signedPacket({
    ...reading(crewOf('elena-torres'), 'heart_rate', 72, NOW, 'repeat-elena-hr'),
    sequence: next.lastInboundSequence + 1,
  })
  next = ingestLinkPacket(next, packet)
  next = ingestLinkPacket(next, packet)
  return next
}

function buildAltered(state: AppState): AppState {
  let next = addStableCrew(state, 'elena-torres', { hr: 72, spo2: 98, temp: 36.6, sleep: 7.4, resp: 13 }, NOW - 10 * MINUTE_MS)
  next = addStableCrew(next, 'sofia-chen', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.5, resp: 14 }, NOW)
  const sequence = next.lastInboundSequence + 1
  const drafted = signedPacket({
    ...reading(crewOf('elena-torres'), 'heart_rate', 70, NOW, 'altered-elena'),
    sequence,
  })
  const tampered: LinkPacket = { ...drafted, value: 88 }
  return ingestLinkPacket(next, tampered)
}

function buildLinkDown(state: AppState): AppState {
  let next = addStableCrew(state, 'elena-torres', { hr: 71, spo2: 98, temp: 36.6, sleep: 7.5, resp: 13 }, NOW)
  next = addStableCrew(next, 'sofia-chen', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.5, resp: 14 }, NOW)
  next = {
    ...next,
    link: 'down',
    linkDelayMin: 0,
    communications: [
      {
        id: 'comm-linkdown-1',
        crewId: 'elena-torres',
        episodeId: null,
        status: 'queued',
        subject: 'Resumen pendiente de envío',
        body: 'Mensaje preparado antes del corte. Sigue en cola y todavía no fue enviado.',
        sequence: 1,
        createdAt: NOW - 5 * MINUTE_MS,
        queuedAt: NOW - 4 * MINUTE_MS,
        sentAt: null,
        receivedAt: null,
        idempotencyKey: 'seed-queued',
        actor: 'medical',
      },
    ],
  }
  return ensureAlert(next, {
    id: 'alert-comms-link',
    type: 'comms',
    status: 'active',
    crewId: null,
    sensorId: null,
    episodeId: null,
    title: 'Enlace con Tierra interrumpido',
    reason: 'El núcleo local sigue disponible. Los mensajes en cola no se han entregado.',
    openedAt: NOW,
    updatedAt: NOW,
    astronautAck: false,
    source: 'simulation',
  })
}

function buildUnwellNormal(state: AppState): AppState {
  let next = addStableCrew(state, 'elena-torres', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.6, resp: 13 }, NOW)
  next = addStableCrew(next, 'sofia-chen', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.5, resp: 14 }, NOW)
  return next
}

function buildPulseEscalation(state: AppState): AppState {
  let next = addStableCrew(state, 'elena-torres', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.6, resp: 13 }, NOW)
  next = addStableCrew(next, 'sofia-chen', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.5, resp: 14 }, NOW)
  return send(next, reading(crewOf('elena-torres'), 'heart_rate', 160, NOW, 'elena-hr-escalation'))
}

function buildStale(state: AppState): AppState {
  let next = addStableCrew(state, 'sofia-chen', { hr: 70, spo2: 98, temp: 36.6, sleep: 7.5, resp: 14 }, NOW)
  const measuredAt = NOW - 6 * HOUR_MS
  next = send(next, {
    ...reading(crewOf('elena-torres'), 'heart_rate', 70, measuredAt, 'stale-elena-hr'),
    receivedAt: NOW,
  })
  next = send(next, {
    ...reading(crewOf('elena-torres'), 'spo2', 98, measuredAt, 'stale-elena-spo2'),
    receivedAt: NOW,
  })
  const episodeId = 'ep-elena-stale'
  next = {
    ...next,
    episodes: [
      ...next.episodes,
      {
        id: episodeId,
        crewId: 'elena-torres',
        title: 'Síntomas con datos antiguos',
        status: 'open',
        openedAt: NOW,
        symptomIds: [],
        alertIds: [],
        measurementIds: [],
      },
    ],
    selectedEpisodeId: episodeId,
  }
  return registerSymptom(next, {
    crewId: 'elena-torres',
    symptoms: ['cansancio'],
    note: 'Sigo cansada. Los números que aparecen parecen de antes.',
    idempotencyKey: 'seed-stale-symptom',
    id: 'sym-elena-stale',
    episodeId,
    reportedAt: NOW,
    enforceRole: false,
  })
}

function addStableCrew(
  state: AppState,
  crewId: CrewId,
  values: { hr: number; spo2: number; temp: number; sleep: number; resp: number },
  at: number,
): AppState {
  const crew = crewOf(crewId)
  let next = state
  next = send(next, reading(crew, 'heart_rate', values.hr, at, `${crewId}-hr-${at}`))
  next = send(next, reading(crew, 'spo2', values.spo2, at, `${crewId}-spo2-${at}`))
  next = send(next, reading(crew, 'temperature', values.temp, at, `${crewId}-temp-${at}`))
  next = send(next, reading(crew, 'sleep_hours', values.sleep, at - 8 * HOUR_MS, `${crewId}-sleep-${at}`))
  next = send(next, reading(crew, 'respiratory_rate', values.resp, at, `${crewId}-rr-${at}`))
  return next
}

function reading(
  crew: CrewProfile,
  kind: MeasurementKind,
  value: number,
  measuredAt: number,
  messageId: string,
  signalQuality = 98,
  sensorId?: string,
): Omit<LinkPacket, 'mac' | 'unit' | 'sequence'> {
  return {
    messageId,
    crewId: crew.id,
    sensorId: sensorId ?? sensorFor(crew.id, kind),
    kind,
    value,
    measuredAt,
    receivedAt: measuredAt,
    signalQuality,
    context: 'routine',
  }
}

export function appendLiveSample(
  state: AppState,
  crewId: CrewId,
  kind: MeasurementKind,
  value: number,
  messageId: string,
  signalQuality = 96,
  sensorId?: string,
): AppState {
  const crew = crewOf(crewId)
  const sample = reading(crew, kind, value, state.clock.simulatedAt, messageId, signalQuality, sensorId)
  return send(state, sample)
}

export function latentHeartRate(scenarioId: ScenarioId, crewId: CrewId, minute: number, seed: number): number | null {
  const crew = crewOf(crewId)
  if (scenarioId === 'missing-data' && crewId === 'elena-torres') return null
  if (scenarioId === 'frozen-sensor' && crewId === 'elena-torres') return 81
  if (scenarioId === 'gradual-fatigue' && crewId === 'elena-torres') return Math.round(Math.min(112, 104 + Math.max(0, minute) * 0.2))
  if (scenarioId === 'stale-normal' && crewId === 'elena-torres') return 98
  // Micro-variación para no disparar la detección de sensor congelado en ticks rápidos.
  if (scenarioId === 'pulse-escalation' && crewId === 'elena-torres') return 159 + (Math.abs(minute) % 3)
  const random = mulberry32(seed + minute + crew.name.length)()
  const mid = (crew.baseline.hrMin + crew.baseline.hrMax) / 2
  return clamp(Math.round(mid + (random - 0.5) * 4), crew.baseline.hrMin, crew.baseline.hrMax)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function send(state: AppState, input: Omit<LinkPacket, 'mac' | 'unit' | 'sequence'>): AppState {
  return ingestLinkPacket(state, signedPacket({ ...input, sequence: state.lastInboundSequence + 1 }))
}

function crewOf(id: CrewId): CrewProfile {
  const crew = CREW.find((item) => item.id === id)
  if (!crew) throw new Error(id)
  return crew
}

function sensorFor(crewId: CrewId, kind: MeasurementKind): string {
  const suffix = crewId.replace('-torres', '').replace('-ruiz', '').replace('-chen', '').replace('-morgan', '')
  const short = crewId === 'elena-torres' ? 'elena' : crewId === 'mateo-ruiz' ? 'mateo' : crewId === 'sofia-chen' ? 'sofia' : 'alex'
  void suffix
  if (kind === 'heart_rate') return `sensor-fc-${short}`
  if (kind === 'spo2') return `sensor-spo2-${short}`
  if (kind === 'temperature') return `sensor-temp-${short}`
  if (kind === 'sleep_hours') return `sensor-sleep-${short}`
  return `sensor-fr-${short}`
}
