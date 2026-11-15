import type { HealthIndicatorReading, IndicatorKind } from '../platform/api'
import type { TrendPoint } from './historySeries'
import { INDICATOR_CATALOG } from './healthIndicators'

/** Build per-kind daily series from platform indicators. Never mixes incompatible units. */
export function platformDailySeries(
  items: HealthIndicatorReading[],
  kind: IndicatorKind,
): TrendPoint[] {
  const filtered = items
    .filter((item) => item.kind === kind && Number.isFinite(item.value))
    .sort((a, b) => a.measuredAt - b.measuredAt)

  const byDay = new Map<string, number[]>()
  for (const item of filtered) {
    // Blood pressure charts use systolic only; diastolic listed separately in UI.
    const value = item.value
    const day = new Date(item.measuredAt).toISOString().slice(0, 10)
    const bucket = byDay.get(day) ?? []
    bucket.push(value)
    byDay.set(day, bucket)
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, values]) => {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length
      const rounded = kind === 'sleep_hours' || kind === 'temperature'
        ? Math.round(mean * 10) / 10
        : Math.round(mean)
      const [, month, date] = day.split('-')
      return {
        day,
        label: `${date}-${month}`,
        value: rounded,
        people: 1,
        title: day,
      }
    })
}

export function chartablePlatformKinds(items: HealthIndicatorReading[]): IndicatorKind[] {
  const present = new Set(items.map((item) => item.kind))
  return INDICATOR_CATALOG
    .map((entry) => entry.kind)
    .filter((kind) => present.has(kind) && kind !== 'mood') // mood shown as categorical list, not continuous axis mix
}

export function autoDomain(points: TrendPoint[]): { domain: [number, number]; ticks: number[] } {
  const values = points.map((p) => p.value).filter((v): v is number => v != null && Number.isFinite(v))
  if (values.length === 0) return { domain: [0, 1], ticks: [0, 1] }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max(1, (max - min) * 0.15)
  const lo = Math.floor(min - pad)
  const hi = Math.ceil(max + pad)
  const mid = Math.round((lo + hi) / 2)
  return { domain: [lo, hi], ticks: [lo, mid, hi] }
}
