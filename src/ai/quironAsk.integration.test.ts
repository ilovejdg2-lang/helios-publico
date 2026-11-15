/**
 * Integration tests for askQuiron – verifies that:
 *  - Gemini (via askDialogue) is prioritised when consent is given in ALL modes.
 *  - History is forwarded when historyConsent is true.
 *  - Local fallback is used when the model fails or consent is withheld.
 *  - Clinical deterministic engine is only used as fallback, never instead of Gemini.
 *  - Aborted requests are handled cleanly.
 *  - No duplicate function definitions (regression guard).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { askQuiron } from './quironAsk'

// ── Mock askDialogue ──────────────────────────────────────────────────────────
vi.mock('./client', () => ({
  askDialogue: vi.fn(),
  getAiHealth: vi.fn().mockResolvedValue({ configured: true, provider: 'test', model: 'test-model', missing: [], reachable: true }),
}))
import { askDialogue } from './client'
const mockAskDialogue = vi.mocked(askDialogue)

function signal() {
  return new AbortController().signal
}

function geminiOk(text: string) {
  return { ok: true as const, source: 'model' as const, model: 'test-model', result: { text, sources: ['Quirón · test'] } }
}

function geminiError(code = 'network') {
  return { ok: false as const, code, message: 'Falló la conexión.' }
}

// ── Minimal AppState for dashboard tests ─────────────────────────────────────
const baseState = {
  mission: { id: 'helios-1', name: 'HELIOS', stage: 'a_bordo' as const },
  role: 'medical' as const,
  sessionCrewId: 'crew-1',
  selectedCrewId: 'crew-1',
  selectedEpisodeId: 'ep-1',
  episodes: [],
} as unknown as Parameters<typeof askQuiron>[0]['state']

beforeEach(() => {
  mockAskDialogue.mockReset()
})

describe('askQuiron – modo público', () => {
  it('llama a Gemini cuando modelConsent y preferModel son true', async () => {
    mockAskDialogue.mockResolvedValueOnce(geminiOk('HELIOS es un prototipo de salud espacial.'))
    const result = await askQuiron({
      mode: 'public', question: '¿Qué es HELIOS?', locale: 'es', state: null,
      signal: signal(), preferModel: true, modelConsent: true,
    })
    expect(result.channel).toBe('model')
    expect(result.text).toContain('HELIOS')
    expect(mockAskDialogue).toHaveBeenCalledOnce()
  })

  it('NO llama a Gemini cuando preferModel es false', async () => {
    const result = await askQuiron({
      mode: 'public', question: '¿Qué es HELIOS?', locale: 'es', state: null,
      signal: signal(), preferModel: false,
    })
    expect(result.channel).toBe('demo')
    expect(mockAskDialogue).not.toHaveBeenCalled()
  })

  it('usa motor local cuando Gemini falla', async () => {
    mockAskDialogue.mockResolvedValueOnce(geminiError())
    const result = await askQuiron({
      mode: 'public', question: '¿Qué puedo hacer en HELIOS?', locale: 'es', state: null,
      signal: signal(), preferModel: true, modelConsent: true,
    })
    expect(result.channel).toBe('demo')
    expect(result.notice).toMatch(/local/i)
  })

  it('envía historial a Gemini cuando historyConsent es true', async () => {
    mockAskDialogue.mockResolvedValueOnce(geminiOk('Claro, el pulso es un indicador clave.'))
    const history = [
      { role: 'user' as const, content: '¿Qué monitorea HELIOS?' },
      { role: 'assistant' as const, content: 'HELIOS monitorea pulso, sueño y oxígeno.' },
    ]
    await askQuiron({
      mode: 'public', question: '¿Y eso por qué?', locale: 'es', state: null,
      signal: signal(), preferModel: true, modelConsent: true, historyConsent: true, history,
    })
    const call = mockAskDialogue.mock.calls[0]?.[0]
    expect(call?.history).toHaveLength(2)
    expect(call?.historyConsent).toBe(true)
  })

  it('NO envía historial cuando historyConsent es false', async () => {
    mockAskDialogue.mockResolvedValueOnce(geminiOk('Respuesta sin historial.'))
    await askQuiron({
      mode: 'public', question: '¿Qué es HELIOS?', locale: 'es', state: null,
      signal: signal(), preferModel: true, modelConsent: true, historyConsent: false,
      history: [{ role: 'user' as const, content: 'Algo anterior' }],
    })
    const call = mockAskDialogue.mock.calls[0]?.[0]
    expect(call?.history).toHaveLength(0)
  })

  it('maneja un request abortado limpiamente', async () => {
    mockAskDialogue.mockResolvedValueOnce({ ok: false as const, code: 'aborted', message: 'cancelado' })
    const result = await askQuiron({
      mode: 'public', question: '¿Qué es HELIOS?', locale: 'es', state: null,
      signal: signal(), preferModel: true, modelConsent: true,
    })
    expect(result.channel).toBe('error')
    expect(result.errorCode).toBe('aborted')
  })

  it('devuelve error limpio para pregunta vacía', async () => {
    const result = await askQuiron({
      mode: 'public', question: '   ', locale: 'es', state: null,
      signal: signal(), preferModel: true, modelConsent: true,
    })
    expect(result.channel).toBe('error')
    expect(result.errorCode).toBe('empty')
    expect(mockAskDialogue).not.toHaveBeenCalled()
  })
})

describe('askQuiron – modo dashboard', () => {
  it('mantiene el dolor de cabeza durante varios turnos incluso si falla Gemini', async () => {
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = []
    const replies: string[] = []
    for (const question of ['me siento mal', 'fisico', 'dolor de cabeza', 'fisica']) {
      mockAskDialogue.mockResolvedValueOnce(geminiError('network'))
      const result = await askQuiron({
        mode: 'dashboard', question, locale: 'es', state: baseState,
        signal: signal(), preferModel: true, modelConsent: true, historyConsent: true, history: [...history],
      })
      replies.push(result.text)
      history.push({ role: 'user', content: question }, { role: 'assistant', content: result.text })
    }
    expect(replies[1]).toContain('molestia física')
    expect(replies[2]).toContain('cuándo')
    expect(replies[3]).toContain('dolor de cabeza')
    expect(replies[3]).not.toMatch(/emocional|orbital|radiación/)
  })
  it('conversa sobre un malestar sin advertencias de datos si el proveedor falla', async () => {
    mockAskDialogue.mockResolvedValueOnce(geminiError('network'))
    const result = await askQuiron({
      mode: 'dashboard', question: 'me siento mal', locale: 'es', state: baseState,
      signal: signal(), preferModel: true, modelConsent: true, dataConsent: false,
    })
    expect(result.text).toMatch(/físico.*emocional/)
    expect(result.text).not.toMatch(/consent|permiso|registros|Mi espacio/)
    expect(result.channel).toBe('local')
  })

  it('orienta las solicitudes explícitamente privadas a Mi espacio también sin modelo', async () => {
    const result = await askQuiron({
      mode: 'dashboard', question: 'Quiero hablar en privado', locale: 'es', state: baseState,
      signal: signal(), preferModel: false,
    })
    expect(result.text).toContain('Mi espacio')
    expect(mockAskDialogue).not.toHaveBeenCalled()
  })
  it('llama a Gemini con contextKey cuando hay estado de misión', async () => {
    mockAskDialogue.mockResolvedValueOnce(geminiOk('La misión está en curso a bordo.'))
    const result = await askQuiron({
      mode: 'dashboard', question: '¿Cómo va la misión?', locale: 'es', state: baseState,
      signal: signal(), preferModel: true, modelConsent: true,
    })
    expect(result.channel).toBe('model')
    const call = mockAskDialogue.mock.calls[0]?.[0]
    expect(call?.mode).toBe('dashboard')
    expect(call?.contextKey).toBeTruthy()
  })

  it('llama a Gemini incluso sin episodio seleccionado', async () => {
    mockAskDialogue.mockResolvedValueOnce(geminiOk('No hay episodio activo, pero puedo ayudar.'))
    const noEpisodeState = { ...baseState, selectedEpisodeId: null, episodes: [] } as unknown as typeof baseState
    const result = await askQuiron({
      mode: 'dashboard', question: 'Hola', locale: 'es', state: noEpisodeState,
      signal: signal(), preferModel: true, modelConsent: true,
    })
    expect(result.channel).toBe('model')
    expect(mockAskDialogue).toHaveBeenCalledOnce()
  })

  it('devuelve error cuando state es null en modo dashboard', async () => {
    const result = await askQuiron({
      mode: 'dashboard', question: 'Hola', locale: 'es', state: null,
      signal: signal(), preferModel: true, modelConsent: true,
    })
    expect(result.channel).toBe('error')
    expect(result.errorCode).toBe('no_state')
    expect(mockAskDialogue).not.toHaveBeenCalled()
  })

  it('usa motor local cuando Gemini falla en dashboard', async () => {
    mockAskDialogue.mockResolvedValueOnce(geminiError('timeout'))
    const result = await askQuiron({
      mode: 'dashboard', question: 'Hola', locale: 'es', state: baseState,
      signal: signal(), preferModel: true, modelConsent: true,
    })
    expect(result.channel).toBe('local')
    expect(result.notice).toMatch(/local/i)
  })

  it('responde en inglés cuando locale es en', async () => {
    mockAskDialogue.mockResolvedValueOnce(geminiOk('Mission is on track.'))
    const result = await askQuiron({
      mode: 'dashboard', question: 'How is the mission?', locale: 'en', state: baseState,
      signal: signal(), preferModel: true, modelConsent: true,
    })
    expect(result.channel).toBe('model')
    const call = mockAskDialogue.mock.calls[0]?.[0]
    expect(call?.locale).toBe('en')
  })
})
