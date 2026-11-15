import { afterEach, expect, it, vi } from 'vitest'
import { ApiError, SimulationClient } from './simulation'
import { createInitialState } from '../domain/scenarios'

afterEach(() => vi.unstubAllGlobals())
const state = createInitialState('baseline')
const snapshot = { state, revision: 2, simulated: true }
it('reuses a session on reload without creating another one', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(snapshot)))
  vi.stubGlobal('fetch', fetcher)
  expect((await new SimulationClient('fixture').connect(state)).revision).toBe(2)
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(fetcher.mock.calls[0]?.[1].method).toBe('GET')
})
it('initializes only when the session is unknown', async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response('{}', { status: 404 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(snapshot)))
  vi.stubGlobal('fetch', fetcher)
  await new SimulationClient('fixture').connect(state)
  expect(fetcher.mock.calls.map((c) => c[1].method)).toEqual(['GET', 'POST'])
})
it('preserves Retry-After and never retries a rejected request as an initialization', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 429, headers: { 'Retry-After': '25' } }))
  vi.stubGlobal('fetch', fetcher)
  const error = await new SimulationClient('fixture').connect(state).catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  expect(error).toMatchObject({ status: 429, retryAfterSeconds: 25 })
  expect(fetcher).toHaveBeenCalledTimes(1)
})
