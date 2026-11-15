import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiUrl } from './baseUrl'
import { fetchEnvironmental, weatherSchema } from './environment'
import { fetchOsdrStudy } from './nasa'
import {
  askSpaceModel,
  authorizeSpaceModel,
  getAiHealth,
  revokeSpaceModel,
} from '../ai/client'
import { buildSpaceContext } from '../ai/spaceContext'
import { createInitialState } from '../domain/scenarios'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('merged local and remote API routing', () => {
  it.each(['', ' https://backend.example/ '])(
    'routes NASA, conversation and consent to the configured backend: %s',
    async (configuredBase) => {
      vi.stubEnv('VITE_API_BASE_URL', configuredBase)
      const base = configuredBase.trim().replace(/\/$/, '')
      const token = 'a'.repeat(64)
      const fetcher = vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              token,
              expiresAt: Date.now() + 60000,
              events: [],
              sources: [],
              result: {
                respuesta: 'Hello',
                nivel: 'equipo',
                vistaPrevia: 'Review before sharing',
                humanReviewRequired: true,
              },
            }),
          ),
        ),
      )
      vi.stubGlobal('fetch', fetcher)
      const signal = new AbortController().signal
      const dataUse = { sleep: false, pulse: false, symptoms: false }
      const access = { sessionId: 'session-fixture', token }
      await getAiHealth(signal)
      await authorizeSpaceModel(
        access.sessionId,
        'elena-torres',
        '1001',
        { ...dataUse, mission: false },
        false,
        signal,
      )
      const context = buildSpaceContext(
        createInitialState('baseline'),
        'elena-torres',
        dataUse,
        'hello',
      )
      context.selectedLevel = 'solo_yo'
      const answer = await askSpaceModel(context, signal, access)
      expect(answer.ok && answer.proposal.nivel).toBe('solo_yo')
      await revokeSpaceModel(access)
      await fetchEnvironmental('donki/events', {}, weatherSchema, signal)
      await fetchOsdrStudy('OSD-575', signal)
      expect(fetcher.mock.calls.map((call) => (call as unknown[])[0])).toEqual(
        [
          '/api/ai/health',
          '/api/space/access',
          '/api/ai/space',
          '/api/space/access',
          '/api/nasa/donki/events?',
          '/api/nasa/osdr/studies/OSD-575',
        ].map((path) => `${base}${path}`),
      )
      expect(apiUrl('api/simulation')).toBe(`${base}/api/simulation`)
      const request = (fetcher.mock.calls[2] as unknown[])[1] as RequestInit
      expect(request.headers).toMatchObject({
        'X-Simulation-Id': access.sessionId,
        'X-Space-Token': token,
      })
    },
  )
})
