import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SpaceContextInput } from '../../shared/spaceSchema'
import { askModel, askSpaceModel } from './client'
import { buildAnalysisContext } from './context'
import { createInitialState } from '../domain/scenarios'
import { askQuiron } from './quironAsk'

const context: SpaceContextInput = {
  crewId: 'elena-torres',
  crewName: 'Elena Torres',
  simulatedAt: 0,
  freshness: 'linea_base',
  datosPersona: { measurements: [], symptoms: [] },
  textoPersona: 'Me siento mal ahora',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('cliente de Mi espacio', () => {
  it('ignora un JSON de solicitud que no cumple el esquema', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ model: 'demo', result: { respuesta: 'lista', nivel: 'medico' } })))
    const result = await askSpaceModel(context, new AbortController().signal)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('invalid_response')
  })
})

describe('fallos del servicio de IA', () => {
  const state = createInitialState('gradual-fatigue')
  const analysis = buildAnalysisContext(state, state.episodes[0]!.id, '¿Cómo va la misión?')!
  const signal = () => new AbortController().signal

  it.each([
    ['chat', () => askModel('/api/ai/chat', analysis, signal())],
    ['Mi espacio', () => askSpaceModel(context, signal())],
  ] as const)('explica un timeout en %s, incluso si el proxy devuelve HTML', async (_name, request) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Gateway Timeout</html>', { status: 504 })))
    expect(await request()).toMatchObject({
      ok: false, code: 'timeout', message: expect.stringContaining('no respondió a tiempo'),
    })
  })

  it('distingue una ruta ausente de un timeout del proveedor', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not Found', { status: 404 })))
    expect(await askModel('/api/ai/chat', analysis, signal())).toMatchObject({
      ok: false, code: 'route_not_found',
    })
  })

  it('clasifica el límite de espera del navegador como timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('Timed out', 'TimeoutError') }))
    expect(await askSpaceModel(context, signal())).toMatchObject({ ok: false, code: 'timeout' })
  })

  it('conserva la cancelación voluntaria', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('Cancelled', 'AbortError') }))
    expect(await askModel('/api/ai/chat', analysis, signal())).toMatchObject({ ok: false, code: 'aborted' })
  })

  it('Quirón devuelve una respuesta local identificada cuando Gemini agota el tiempo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ code: 'timeout', message: 'AI provider could not complete the request.' }, { status: 504 })))
    const answer = await askQuiron({ mode: 'dashboard', question: '¿Qué datos faltan?', locale: 'es', state, signal: signal(), preferModel: true, modelConsent: true })
    expect(answer).toMatchObject({ channel: 'local', errorCode: 'timeout' })
    expect(answer.notice).toMatch(/local/i)
  })
})
