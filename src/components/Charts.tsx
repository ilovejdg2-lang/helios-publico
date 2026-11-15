import { useEffect, useId, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatClock } from '../domain/format'

export interface Point {
  label: string
  value: number | null
  title?: string
  people?: number
}

function useColor(name: string, fallback: string): string {
  const [color, setColor] = useState(fallback)
  useEffect(() => {
    const read = () => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      if (value) setColor(value)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [name])
  return color
}

export function TrendChart({
  points,
  unit,
  domain,
  ticks,
  empty,
}: {
  points: Point[]
  unit: string
  domain: [number, number]
  ticks: number[]
  empty: string
}) {
  const accent = useColor('--hist-amber', '#e69500')
  const grid = useColor('--hist-grid', '#d9d3cc')
  const ink = useColor('--ink', '#1a1a1a')
  const fillId = useId().replace(/:/g, '')
  const plotted = points.some((point) => point.value !== null)
  if (!plotted) {
    return <p className="hist-empty">{empty}</p>
  }
  return (
    <div className="chart hist-plot" role="img" aria-label={points.filter((point) => point.value !== null).map((point) => `${point.title ?? point.label}: ${point.value} ${unit}`).join('. ')}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 18, right: 18, left: 4, bottom: 8 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
              <stop offset="78%" stopColor={accent} stopOpacity={0.04} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: ink, fontSize: 13 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
          <YAxis domain={domain} ticks={ticks} tick={{ fill: ink, fontSize: 14 }} axisLine={false} tickLine={false} width={42} />
          <Tooltip
            content={(props) => <ChartTip {...props} unit={unit} />}
            cursor={{ stroke: grid, strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={accent}
            strokeWidth={2.25}
            fill={`url(#${fillId})`}
            dot={false}
            activeDot={{ r: 4, fill: accent, stroke: '#fff', strokeWidth: 1.5 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChartTip({
  active,
  payload,
  unit,
}: {
  active?: boolean
  // Recharts tipa `value` como ValueType (number | string); normalizamos abajo.
  payload?: ReadonlyArray<{ value?: unknown; payload?: Point }>
  unit: string
}) {
  const point = payload?.[0]?.payload
  const raw = payload?.[0]?.value
  const value = typeof raw === 'number' ? raw : Number(raw)
  if (!active || !point || !Number.isFinite(value)) return null
  const people = point.people && point.people > 1 ? ` · media de ${point.people} personas` : ''
  return (
    <div className="hist-tip" role="status">
      <strong>{point.title ?? point.label}</strong>
      <span>{value} {unit}{people}</span>
    </div>
  )
}

export function timeLabel(at: number): string {
  return formatClock(at)
}
