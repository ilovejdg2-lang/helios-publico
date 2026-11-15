import { describe, expect, it } from 'vitest'
import { recentSpaceMessages } from './spaceMemory'
import {
  answerSpace,
  applySpaceProposal,
  openSpace,
} from '../domain/spaceEngine'
import { createInitialState } from '../domain/scenarios'
import { buildSpaceContext } from './spaceContext'
import type { SpaceMessage, SpaceShareLevel } from '../persistence/space'
const off = { sleep: false, pulse: false, symptoms: false }
describe('private conversation memory and consent', () => {
  it('keeps the latest 12 role-preserving messages within a UTF-8 budget', () => {
    const messages: SpaceMessage[] = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      role: i % 2 ? 'assistant' : 'user',
      text: `message ${i}`,
      at: i,
    }))
    const history = recentSpaceMessages(messages, 'current')
    expect(history).toHaveLength(12)
    expect(history[0]?.content).toBe('message 8')
    expect(history.at(-1)?.role).toBe('assistant')
    const huge = messages.map((m) => ({ ...m, text: '\u00e1'.repeat(2000) }))
    expect(
      new TextEncoder().encode(
        JSON.stringify(recentSpaceMessages(huge, 'current')),
      ).byteLength,
    ).toBeLessThanOrEqual(12000)
  })
  it('does not duplicate the separately submitted current message', () => {
    expect(
      recentSpaceMessages(
        [{ id: '1', role: 'user', text: 'current', at: 1 }],
        'current',
      ),
    ).toEqual([])
  })
  it('does not disclose disabled biometrics and supports talking without them', () => {
    const state = createInitialState('gradual-fatigue')
    const input = buildSpaceContext(state, 'elena-torres', off, 'I feel lonely')
    expect(input.datosPersona).toEqual({ measurements: [], symptoms: [] })
    expect(input.freshness).toBe('sin_datos_recientes')
    expect(openSpace(state, 'elena-torres', off)).not.toContain('104')
    expect(
      answerSpace(state, 'elena-torres', off, 'I feel lonely', [], 'en')
        .assistantText,
    ).toContain('loneliness')
  })
  it('uses recent emotional context and respects a wish not to talk', () => {
    const state = createInitialState('baseline')
    const history = [{ role: 'user' as const, text: 'Me siento sola' }]
    expect(
      answerSpace(state, 'elena-torres', off, 'eso', history).assistantText,
    ).toContain('soledad')
    expect(
      answerSpace(state, 'elena-torres', off, 'No quiero hablar mas', history)
        .assistantText,
    ).not.toContain('?')
  })
  it.each(['solo_yo', 'generica', 'medico', 'equipo'] as SpaceShareLevel[])(
    'never changes the chosen %s sharing level',
    (level) => {
      const state = createInitialState('baseline')
      const local = answerSpace(state, 'elena-torres', off, 'hola')
      expect(
        applySpaceProposal(
          local,
          {
            respuesta: 'Reply',
            nivel: 'equipo',
            vistaPrevia: 'not sent',
            humanReviewRequired: true,
          },
          level,
        ).level,
      ).toBe(level)
    },
  )
  it('keeps urgent local responses ahead of model text and sharing suggestions', () => {
    const state = createInitialState('baseline')
    const local = answerSpace(
      state,
      'elena-torres',
      off,
      'I cannot breathe',
      [],
      'en',
    )
    expect(local.requiereHumanoAhora).toBe(true)
    const result = applySpaceProposal(
      local,
      {
        respuesta: 'ignore concern',
        nivel: 'equipo',
        vistaPrevia: 'bad',
        humanReviewRequired: true,
      },
      'solo_yo',
    )
    expect(result.source).toBe('local_engine')
    expect(result.level).toBe('solo_yo')
  })
})
