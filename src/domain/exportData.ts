import type { AlertStatus, AppState, CommStatus, CrewId } from '../../shared/types'
import { formatMission, integrityLabel, kindLabel, movementLabel } from './format'

export interface HistoryRow {
  id: string
  at: number
  crewId: CrewId | null
  type: 'measurement' | 'symptom' | 'alert' | 'inventory' | 'communication' | 'analysis'
  title: string
  detail: string
}

export function historyRows(state: AppState): HistoryRow[] {
  const rows: HistoryRow[] = [
    ...state.measurements.map((item) => ({
      id: item.id,
      at: item.measuredAt,
      crewId: item.crewId,
      type: 'measurement' as const,
      title: kindLabel(item.kind),
      detail: `${item.value} ${item.unit}. Integridad ${integrityLabel(item.integrity).toLowerCase()}. Medida ${formatMission(item.measuredAt)}. Recibida ${formatMission(item.receivedAt)}.`,
    })),
    ...state.symptoms.map((item) => ({
      id: item.id,
      at: item.reportedAt,
      crewId: item.crewId,
      type: 'symptom' as const,
      title: 'Síntomas',
      detail: `${item.symptoms.join(', ')}. ${item.note}`,
    })),
    ...state.alerts.map((item) => ({
      id: item.id,
      at: item.openedAt,
      crewId: item.crewId,
      type: 'alert' as const,
      title: item.title,
      detail: `${ALERT_STATUS[item.status]}. ${item.reason}`,
    })),
    ...state.movements.map((item) => ({
      id: item.id,
      at: item.at,
      crewId: null,
      type: 'inventory' as const,
      title: movementLabel(item.type),
      detail: `${state.resources.find((resource) => resource.id === item.resourceId)?.name ?? item.resourceId}: ${item.quantityDelta >= 0 ? '+' : ''}${item.quantityDelta}, quedan ${item.quantityAfter}. ${item.note}`,
    })),
    ...state.communications.map((item) => ({
      id: item.id,
      at: item.createdAt,
      crewId: item.crewId,
      type: 'communication' as const,
      title: item.subject,
      detail: `${COMM_STATUS[item.status]}. ${item.body}`,
    })),
    ...state.analyses.map((item) => ({
      id: item.id,
      at: item.createdAt,
      crewId: item.crewId,
      type: 'analysis' as const,
      title: item.source === 'model' ? 'IA conectada' : 'Motor de análisis simulado',
      detail: item.result.summary,
    })),
  ]
  return rows.sort((a, b) => b.at - a.at || a.id.localeCompare(b.id))
}

export function filterHistory(
  rows: HistoryRow[],
  filter: { crewId?: CrewId | 'all'; type?: HistoryRow['type'] | 'all'; from?: number; to?: number },
): HistoryRow[] {
  return rows.filter((row) => {
    if (filter.crewId && filter.crewId !== 'all' && row.crewId !== filter.crewId) return false
    if (filter.type && filter.type !== 'all' && row.type !== filter.type) return false
    if (filter.from !== undefined && row.at < filter.from) return false
    if (filter.to !== undefined && row.at > filter.to) return false
    return true
  })
}

export function toCsv(rows: HistoryRow[]): string {
  const header = ['id', 'at', 'crewId', 'type', 'title', 'detail']
  const lines = [header.join(',')]
  for (const row of rows) {
    lines.push([row.id, new Date(row.at).toISOString(), row.crewId ?? '', row.type, csv(row.title), csv(row.detail)].join(','))
  }
  return lines.join('\n')
}

const ALERT_STATUS: Record<AlertStatus, string> = {
  active: 'Abierta',
  following: 'En seguimiento',
  closed: 'Cerrada',
}

const COMM_STATUS: Record<CommStatus, string> = {
  draft: 'Borrador',
  queued: 'En cola',
  sent: 'Enviado',
  received: 'Recibido',
}

function csv(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

export function exportBundle(state: AppState, rows: HistoryRow[]): string {
  return JSON.stringify(
    {
      disclaimer: 'Simulación. Datos ficticios. No es un registro clínico.',
      scenarioId: state.scenarioId,
      seed: state.seed,
      simulatedAt: state.clock.simulatedAt,
      link: state.link,
      rows,
    },
    null,
    2,
  )
}
