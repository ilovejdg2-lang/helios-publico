import type { AppState, CrewId, Measurement } from '../../shared/types'
import { CREW } from './crew'
import { integrityLabel, kindLabel } from './format'
import type { HistoryRow } from './exportData'

export interface TrendPoint {
  day: string
  label: string
  value: number | null
  people: number
  title: string
}

const PULSE_CAP = 100
const PULSE_STEP = 25
const SLEEP_CAP = 8
const SLEEP_STEP = 2

export function dailyTrends(measurements: Measurement[], crewId: CrewId | 'all'): { pulse: TrendPoint[]; sleep: TrendPoint[] } {
  const seen = new Set<string>()
  const pulseByDay = new Map<string, Map<string, number[]>>()
  const sleepByDay = new Map<string, Map<string, { at: number; value: number }>>()

  for (const item of measurements) {
    if (crewId !== 'all' && item.crewId !== crewId) continue
    if (item.kind !== 'heart_rate' && item.kind !== 'sleep_hours') continue
    if (!Number.isFinite(item.value) || item.value < 0) continue
    const duplicate = `${item.crewId}|${item.kind}|${item.measuredAt}|${item.value}`
    if (seen.has(item.id) || seen.has(duplicate)) continue
    seen.add(item.id)
    seen.add(duplicate)
    const day = new Date(item.measuredAt).toISOString().slice(0, 10)
    if (item.kind === 'heart_rate') {
      const people = pulseByDay.get(day) ?? new Map<string, number[]>()
      const values = people.get(item.crewId) ?? []
      values.push(item.value)
      people.set(item.crewId, values)
      pulseByDay.set(day, people)
    } else {
      const people = sleepByDay.get(day) ?? new Map<string, { at: number; value: number }>()
      const previous = people.get(item.crewId)
      if (!previous || item.measuredAt >= previous.at) people.set(item.crewId, { at: item.measuredAt, value: item.value })
      sleepByDay.set(day, people)
    }
  }

  const days = [...new Set([...pulseByDay.keys(), ...sleepByDay.keys()])].sort()
  const first = days[0]
  const last = days[days.length - 1]
  if (!first || !last) return { pulse: [], sleep: [] }
  const range = eachUtcDay(first, last)
  return {
    pulse: range.map((day) => toPoint(day, meanOf(pulseByDay.get(day), (values) => values.reduce((sum, value) => sum + value, 0) / values.length), true)),
    sleep: range.map((day) => toPoint(day, meanOf(sleepByDay.get(day), (entry) => entry.value), false)),
  }
}

function meanOf<T>(bucket: Map<string, T> | undefined, pick: (value: T) => number): { value: number | null; people: number } {
  if (!bucket || bucket.size === 0) return { value: null, people: 0 }
  const values = [...bucket.values()].map(pick).filter((value) => Number.isFinite(value))
  if (values.length === 0) return { value: null, people: 0 }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return { value: mean, people: values.length }
}

function toPoint(day: string, aggregate: { value: number | null; people: number }, pulse: boolean): TrendPoint {
  const value = aggregate.value === null ? null : pulse ? Math.round(aggregate.value) : Math.round(aggregate.value * 10) / 10
  return { day, label: axisLabel(day), value, people: aggregate.people, title: dayTitle(day) }
}

function axisLabel(day: string): string {
  const [, month, date] = day.split('-')
  return `${date}-${month}`
}

function dayTitle(day: string): string {
  const at = Date.parse(`${day}T00:00:00Z`)
  return new Intl.DateTimeFormat('es', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).format(at).replace('.', '')
}

function eachUtcDay(start: string, end: string): string[] {
  const days: string[] = []
  let cursor = Date.parse(`${start}T00:00:00Z`)
  const last = Date.parse(`${end}T00:00:00Z`)
  while (cursor <= last) {
    days.push(new Date(cursor).toISOString().slice(0, 10))
    cursor += 24 * 60 * 60 * 1000
  }
  return days
}

export function axisFor(points: TrendPoint[], cap: number, step: number): { domain: [number, number]; ticks: number[] } {
  const values = points.flatMap((point) => (point.value === null ? [] : [point.value]))
  const peak = values.length === 0 ? cap : Math.max(cap, ...values)
  const top = peak <= cap ? cap : Math.ceil(peak / step) * step
  const ticks: number[] = []
  for (let tick = 0; tick <= top + 1e-6; tick += step) ticks.push(Number(tick.toFixed(2)))
  return { domain: [0, top], ticks }
}

export function pulseAxis(points: TrendPoint[]) {
  return axisFor(points, PULSE_CAP, PULSE_STEP)
}

export function sleepAxis(points: TrendPoint[]) {
  return axisFor(points, SLEEP_CAP, SLEEP_STEP)
}

export interface ExportRecord {
  at: string
  person: string
  type: string
  value: string
  unit: string
  quality: string
}

export function exportRecords(state: AppState, rows: HistoryRow[]): ExportRecord[] {
  const measurements = new Map(state.measurements.map((item) => [item.id, item]))
  return rows.map((row) => {
    const measurement = measurements.get(row.id)
    if (measurement) {
      return {
        at: new Date(row.at).toISOString(),
        person: personName(row.crewId),
        type: kindLabel(measurement.kind),
        value: String(measurement.value),
        unit: measurement.unit,
        quality: integrityLabel(measurement.integrity),
      }
    }
    return {
      at: new Date(row.at).toISOString(),
      person: personName(row.crewId),
      type: row.title,
      value: '',
      unit: '',
      quality: row.detail,
    }
  })
}

function personName(crewId: CrewId | null): string {
  if (!crewId) return ''
  return CREW.find((crew) => crew.id === crewId)?.name ?? crewId
}

export function recordsToCsv(records: ExportRecord[]): string {
  const header = ['Fecha', 'Persona', 'Tipo de registro', 'Valor', 'Unidad', 'Calidad o estado']
  const lines = [header.map(csvCell).join(',')]
  for (const record of records) {
    lines.push([record.at, record.person, record.type, record.value, record.unit, record.quality].map(csvCell).join(','))
  }
  return lines.join('\r\n')
}

function csvCell(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${guarded.replaceAll('"', '""')}"`
}

export function exportDocument(
  state: AppState,
  filter: { person: string; type: string },
  rows: HistoryRow[],
  pulse: TrendPoint[],
  sleep: TrendPoint[],
): string {
  const stamps = rows.map((row) => row.at)
  return JSON.stringify(
    {
      simulation: true,
      disclaimer: 'Simulación. Datos ficticios. No es un registro clínico.',
      scenarioId: state.scenarioId,
      exportedAt: new Date().toISOString(),
      filters: filter,
      period: stamps.length === 0 ? null : { from: new Date(Math.min(...stamps)).toISOString(), to: new Date(Math.max(...stamps)).toISOString() },
      units: { heart_rate: 'lpm', sleep_hours: 'h' },
      aggregation: 'El pulso diario es la media de las frecuencias válidas de cada persona. Con toda la tripulación, el punto es la media de esas medias. El descanso usa el último registro de cada persona en el día, sin sumar intervalos, y con toda la tripulación se promedian esas personas. Un día sin registros no se dibuja como cero.',
      timezone: 'UTC',
      aggregates: {
        pulse: pulse.filter((point) => point.value !== null),
        sleep: sleep.filter((point) => point.value !== null),
      },
      records: exportRecords(state, rows),
    },
    null,
    2,
  )
}
