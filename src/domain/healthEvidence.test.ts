import { describe, expect, it } from 'vitest'
import { createInitialState } from './scenarios'
import { measurementQuality, vitalTrends, activeHealthAlerts, crewPosture } from './selectors'
import { runLocalAnalysis } from './analysis'
import { answerSpace } from './spaceEngine'

describe('explainable evidence', () => {
  it('calculates the individual delta and 30-minute slope with only reliable samples', () => {
    const state = createInitialState('gradual-fatigue')
    const trend = vitalTrends(state, 'elena-torres')
    expect(trend).toMatchObject({ currentHr: 104, deltaHr: 28, hrMin: 64, hrMax: 76, sampleCount: 31 })
    expect(trend.slopeBpmPerMinute).toBeCloseTo(28 / 30, 1)
    expect(trend.measurementIds.every((id) => state.measurements.find((m) => m.id === id)?.crewId === 'elena-torres')).toBe(true)
    expect(vitalTrends(state, 'mateo-ruiz').currentHr).toBe(68)
  })
  it.each(['missing-data', 'stale-normal', 'frozen-sensor'] as const)('%s never becomes a stable trend', (id) => {
    const state = createInitialState(id)
    expect(vitalTrends(state, 'elena-torres').currentHr).toBeNull()
    expect(measurementQuality(state, 'elena-torres').status).not.toBe('valid')
  })
  it('detects a repeated sequence as a verification flag, not a diagnosis', () => {
    const state = createInitialState('baseline')
    const latest = state.measurements.findLast((m) => m.crewId === 'elena-torres' && m.kind === 'heart_rate')!
    state.measurements = [0, 1, 2].map((i) => ({ ...latest, id: `frozen-${i}`, sequence: i, measuredAt: state.clock.simulatedAt - i * 60000 }))
    expect(measurementQuality(state, 'elena-torres')).toMatchObject({ status: 'frozen', possibleFrozen: true })
    expect(crewPosture(state, 'elena-torres').observed).toBe('no_recent_evaluation')
  })
  it('does not interpret a reading older than thirty minutes as a current evaluation', () => {
    const state = createInitialState('baseline')
    state.clock.simulatedAt += 31 * 60000
    expect(measurementQuality(state, 'elena-torres').status).toBe('stale')
    expect(crewPosture(state, 'elena-torres').observed).toBe('no_recent_evaluation')
  })
  it('records objective evidence, gaps, operational context and human review', () => {
    const state = createInitialState('gradual-fatigue')
    const episode = state.episodes.find((e) => e.crewId === 'elena-torres')!
    const result = runLocalAnalysis(state, episode.id)!
    expect(result.summary).toContain('Hallazgos objetivos')
    expect(result.summary).toContain('28 bpm')
    expect(result.summary).toContain('4.5 h')
    expect(result.summary).toContain('Calidad y vacíos')
    expect(result.summary).toContain('revisión del médico de vuelo')
    expect(result.humanReviewRequired).toBe(true)
    expect(activeHealthAlerts(state, 'mateo-ruiz')).toHaveLength(0)
  })
  it('provides the same evidence locally only for the selected owner and enabled data', () => {
    const state = createInitialState('gradual-fatigue')
    state.role = 'astronaut'
    state.sessionCrewId = 'elena-torres'
    const on = { pulse: true, sleep: false, symptoms: false }
    expect(answerSpace(state, 'elena-torres', on, 'tendencia').assistantText).toContain('104')
    expect(answerSpace(state, 'elena-torres', { ...on, pulse: false }, 'tendencia').assistantText).not.toContain('104')
    expect(answerSpace(state, 'mateo-ruiz', on, 'tendencia').assistantText).not.toContain('104')
  })
})
