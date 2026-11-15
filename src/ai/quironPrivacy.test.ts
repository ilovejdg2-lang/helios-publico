import { afterEach, expect, it, vi } from 'vitest'
import { askQuiron } from './quironAsk'
import { createInitialState } from '../domain/scenarios'

afterEach(() => vi.unstubAllGlobals())
it('public Quiron ignores personal context and never calls the provider', async () => {
  const state = createInitialState('gradual-fatigue')
  state.symptoms[0]!.note = 'PRIVATE-NOTE-MUST-NOT-BE-RETURNED'
  const fetcher = vi.fn().mockRejectedValue(new Error('Public chat must not call the model'))
  vi.stubGlobal('fetch', fetcher)
  const answer = await askQuiron({ mode: 'public', question: 'Tell me about health', locale: 'en', state, signal: new AbortController().signal, preferModel: true })
  expect(answer.channel).toBe('demo')
  expect(answer.text).not.toContain('PRIVATE-NOTE')
  expect(answer.text).not.toContain('104')
  expect(fetcher).not.toHaveBeenCalled()
})
