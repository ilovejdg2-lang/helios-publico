import { expect, it } from 'vitest'
import { createInitialState } from './scenarios'
import { dashboardIndicatorAnswer } from './quironDashboardLocal'

it('uses the owner even with another crew member selected and no episode', () => {
  const state = createInitialState('baseline')
  state.role = 'astronaut'
  state.sessionCrewId = 'elena-torres'
  state.selectedCrewId = 'sofia-chen'
  state.selectedEpisodeId = null
  const result = dashboardIndicatorAnswer(state, '¿Cómo está mi pulso?', false)
  expect(result).toContain('Elena Torres')
  expect(result).toContain('70 lpm')
  expect(result).not.toContain('Sofia')
})

it('does not expose readings to operations', () => {
  const state = createInitialState('baseline')
  state.role = 'ops'
  expect(dashboardIndicatorAnswer(state, 'My pulse?', true)).not.toMatch(/70|Elena/)
})

it('does not claim stability when reliable readings are missing', () => {
  const state = createInitialState('baseline')
  state.role = 'medical'
  state.measurements = []
  expect(dashboardIndicatorAnswer(state, 'My pulse?', true)).toContain('no current reliable')
})
