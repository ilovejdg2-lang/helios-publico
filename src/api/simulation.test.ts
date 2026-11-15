import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, SimulationClient } from './simulation'
import { createInitialState } from '../domain/scenarios'

afterEach(() => vi.unstubAllGlobals())
describe('cliente NestJS', () => {
  it('inicializa y envía acciones con sesión y revisión del servidor', async () => {
    const state = createInitialState('baseline')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ state, revision: 3, simulated: true }))
      .mockResolvedValueOnce(Response.json({ state, revision: 4, simulated: true }))
    vi.stubGlobal('fetch', fetchMock)
    const client = new SimulationClient(crypto.randomUUID())
    await client.initialize(state)
    await client.dispatch({ type: 'setRunning', running: true })
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const action = fetchMock.mock.calls[1]?.[1] as RequestInit
    expect(init.headers).toMatchObject({ 'X-Simulation-Id': client.sessionId })
    expect(JSON.parse(action.body as string)).toMatchObject({
      expectedRevision: 3,
      action: { type: 'setRunning', running: true },
    })
    expect(client.revision).toBe(4)
  })
  it('rechaza estados y análisis inválidos del servidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ state: { stateVersion: 2 }, revision: 0, simulated: true })),
    )
    const client = new SimulationClient(crypto.randomUUID())
    await expect(client.refresh()).rejects.toThrow()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ source: 'local_engine', result: { humanReviewRequired: true } })),
    )
    await expect(client.analysis('episode')).rejects.toThrow()
  })
  it('distingue conflictos HTTP de desconexiones', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'Conflicto' }, { status: 409 })))
    const client = new SimulationClient(crypto.randomUUID())
    await expect(client.dispatch({ type: 'resetSimulation' })).rejects.toBeInstanceOf(ApiError)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(client.refresh()).rejects.toThrow('offline')
  })
})
