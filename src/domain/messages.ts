import { canonicalPacket, signPayload, verifyPayload } from '../../shared/mac'
import { UNIT_BY_KIND, type Alert, type AppState, type LinkPacket, type Measurement } from '../../shared/types'
import { STALE_GAP_MS } from './constants'
import { addAudit } from './stateOps'

export function signedPacket(input: Omit<LinkPacket, 'mac' | 'unit'> & { mac?: string }): LinkPacket {
  const payload = canonicalPacket(input)
  return { ...input, unit: UNIT_BY_KIND[input.kind], mac: input.mac ?? signPayload(payload) }
}

export function ingestLinkPacket(state: AppState, packet: LinkPacket): AppState {
  if (state.seenMessageIds.includes(packet.messageId)) {
    return reject(state, packet, 'duplicate', 'El mensaje ya estaba registrado. No se creó otra medición.')
  }
  const payload = canonicalPacket(packet)
  if (!verifyPayload(payload, packet.mac)) {
    return reject(state, packet, 'altered', 'El mensaje no superó la verificación. No entra como evidencia.')
  }
  if (packet.sequence <= state.lastInboundSequence) {
    return reject(state, packet, 'out_of_order', 'La secuencia es anterior a la última aceptada.')
  }

  const gap = packet.receivedAt - packet.measuredAt
  const measurement: Measurement = {
    id: `meas-${packet.messageId}`,
    messageId: packet.messageId,
    sequence: packet.sequence,
    crewId: packet.crewId,
    sensorId: packet.sensorId,
    kind: packet.kind,
    value: packet.value,
    unit: packet.unit,
    measuredAt: packet.measuredAt,
    receivedAt: packet.receivedAt,
    signalQuality: packet.signalQuality,
    integrity: gap > STALE_GAP_MS ? 'stale' : 'valid',
    context: packet.context,
    origin: 'link',
    mac: packet.mac,
    macValid: true,
  }

  let next: AppState = {
    ...state,
    measurements: [...state.measurements, measurement],
    seenMessageIds: [...state.seenMessageIds, packet.messageId],
    lastInboundSequence: packet.sequence,
  }
  next = markFrozenSeries(next, measurement.sensorId, measurement.kind)
  return next
}

function reject(state: AppState, packet: LinkPacket, reason: 'duplicate' | 'altered' | 'out_of_order', detail: string): AppState {
  const seq = state.seq + 1
  const alertType = reason === 'duplicate' ? 'repeated' : reason === 'altered' ? 'altered' : 'quality'
  let next: AppState = {
    ...state,
    seq,
    seenMessageIds: state.seenMessageIds.includes(packet.messageId) ? state.seenMessageIds : [...state.seenMessageIds, packet.messageId],
    rejected: [
      ...state.rejected,
      {
        id: `rej-${seq}`,
        messageId: packet.messageId,
        reason,
        at: state.clock.simulatedAt,
        claimedValue: packet.value,
        sensorId: packet.sensorId,
        detail,
      },
    ],
  }
  next = ensureAlert(next, {
    id: `alert-${alertType}-${packet.sensorId}`,
    type: alertType,
    status: 'active',
    crewId: packet.crewId,
    sensorId: packet.sensorId,
    episodeId: null,
    title: reason === 'duplicate' ? 'Mensaje repetido' : reason === 'altered' ? 'Mensaje alterado' : 'Mensaje fuera de orden',
    reason: detail,
    openedAt: state.clock.simulatedAt,
    updatedAt: state.clock.simulatedAt,
    astronautAck: false,
    source: 'simulation',
  })
  return addAudit(next, { actor: state.role, action: `reject-${reason}`, entityId: packet.messageId, detail })
}

function markFrozenSeries(state: AppState, sensorId: string, kind: Measurement['kind']): AppState {
  const series = state.measurements.filter((item) => item.sensorId === sensorId && item.kind === kind)
  const last = series.slice(-3)
  if (last.length < 3) return state
  const [first] = last
  if (!first || !last.every((item) => item.value === first.value)) return state
  const ids = new Set(last.map((item) => item.id))
  const measurements = state.measurements.map((item) => (ids.has(item.id) ? { ...item, integrity: 'pending' as const } : item))
  let next: AppState = { ...state, measurements }
  next = ensureAlert(next, {
    id: `alert-quality-${sensorId}`,
    type: 'quality',
    status: 'active',
    crewId: first.crewId,
    sensorId,
    episodeId: null,
    title: 'Lecturas repetidas',
    reason: 'Valores idénticos en 3 lecturas consecutivas. Se requiere verificación. No se interpreta como un ataque.',
    openedAt: state.clock.simulatedAt,
    updatedAt: state.clock.simulatedAt,
    astronautAck: false,
    source: 'simulation',
  })
  return next
}

export function ensureAlert(state: AppState, alert: Alert): AppState {
  const exists = state.alerts.some((item) => item.id === alert.id && item.status !== 'closed')
  if (exists) return state
  return { ...state, alerts: [...state.alerts, alert] }
}
