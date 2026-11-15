export class ProviderError extends Error {
  readonly code: 'timeout' | 'rate_limit' | 'network' | 'invalid_response' | 'aborted'

  constructor(code: ProviderError['code'], message: string) {
    super(message)
    this.code = code
    this.name = 'ProviderError'
  }
}

export interface ModelProvider {
  name: string
  model: string
  complete(input: { system: string; user: string; signal: AbortSignal }): Promise<string>
  /** Multi-turn conversational call. Implementations may fall back to flattening history. */
  completeChat(input: { messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>; signal: AbortSignal }): Promise<string>
}

interface ResolvedProvider {
  provider: ModelProvider | null
  missing: string[]
  providerName: string
  model: string
}

export function resolveProvider(env: NodeJS.ProcessEnv = process.env): ResolvedProvider {
  const providerName = env.AI_PROVIDER?.trim() || 'openai-compatible'
  const model = env.AI_MODEL?.trim() || (providerName === 'anthropic' ? 'claude-3-5-haiku-latest' : 'gpt-4o-mini')
  const missing: string[] = []
  const key = env.AI_API_KEY?.trim() ?? ''
  if (!key) missing.push('AI_API_KEY')
  if (missing.length) return { provider: null, missing, providerName, model }
  const timeoutMs = Number(env.AI_TIMEOUT_MS ?? 25000)
  const provider =
    providerName === 'anthropic'
      ? anthropicProvider(key, model, timeoutMs)
      : openAiCompatibleProvider(key, env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1', model, timeoutMs)
  return { provider, missing, providerName, model }
}

function openAiCompatibleProvider(key: string, baseUrl: string, model: string, timeoutMs: number): ModelProvider {
  async function callChat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    signal: AbortSignal,
  ): Promise<string> {
    const timeout = AbortSignal.timeout(timeoutMs)
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, temperature: 0.7, messages }),
      signal: AbortSignal.any([signal, timeout]),
    }).catch((error: unknown) => {
      throw mapFetchError(error, signal)
    })
    if (response.status === 429) throw new ProviderError('rate_limit', 'El proveedor limitó las solicitudes.')
    if (!response.ok) throw new ProviderError('network', `El proveedor respondió ${response.status}.`)
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const content = body.choices?.[0]?.message?.content
    if (!content) throw new ProviderError('invalid_response', 'El proveedor no devolvió contenido.')
    return content
  }

  return {
    name: 'openai-compatible',
    model,
    async complete({ system, user, signal }) {
      return callChat([{ role: 'system', content: system }, { role: 'user', content: user }], signal)
    },
    async completeChat({ messages, signal }) {
      return callChat(messages, signal)
    },
  }
}

function anthropicProvider(key: string, model: string, timeoutMs: number): ModelProvider {
  async function callMessages(
    system: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    signal: AbortSignal,
  ): Promise<string> {
    const timeout = AbortSignal.timeout(timeoutMs)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model, max_tokens: 1200, temperature: 0.7, system, messages }),
      signal: AbortSignal.any([signal, timeout]),
    }).catch((error: unknown) => {
      throw mapFetchError(error, signal)
    })
    if (response.status === 429) throw new ProviderError('rate_limit', 'El proveedor limitó las solicitudes.')
    if (!response.ok) throw new ProviderError('network', `El proveedor respondió ${response.status}.`)
    const body = (await response.json()) as { content?: { text?: string }[] }
    const content = body.content?.map((item) => item.text ?? '').join('')
    if (!content) throw new ProviderError('invalid_response', 'El proveedor no devolvió contenido.')
    return content
  }

  return {
    name: 'anthropic',
    model,
    async complete({ system, user, signal }) {
      return callMessages(system, [{ role: 'user', content: user }], signal)
    },
    async completeChat({ messages, signal }) {
      // Anthropic separates system from user/assistant turns
      const systemMsg = messages.find((m) => m.role === 'system')?.content ?? ''
      const turns = messages
        .filter((m): m is { role: 'user' | 'assistant'; content: string } => m.role !== 'system')
      return callMessages(systemMsg, turns, signal)
    },
  }
}

function mapFetchError(error: unknown, signal: AbortSignal): ProviderError {
  if (error instanceof ProviderError) return error
  if (signal.aborted) return new ProviderError('aborted', 'La solicitud fue cancelada.')
  if (error instanceof Error && error.name === 'TimeoutError') return new ProviderError('timeout', 'El proveedor no respondió a tiempo.')
  if (error instanceof Error && error.name === 'AbortError') return new ProviderError('aborted', 'La solicitud fue cancelada.')
  return new ProviderError('network', 'No se pudo contactar al proveedor.')
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed)
  return JSON.parse(fenced?.[1] ?? trimmed) as unknown
}
