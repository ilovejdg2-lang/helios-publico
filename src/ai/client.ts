import { z } from 'zod'
import {
  analysisResultSchema,
  checkAnalysisRefs,
  type AnalysisContextInput,
} from '../../shared/aiSchema'
import {
  spaceProposalSchema,
  type SpaceContextInput,
  type SpaceProposal,
} from '../../shared/spaceSchema'
import type { AnalysisResult } from '../../shared/types'
import { apiUrl } from '../api/baseUrl'
import { dialogueResponseSchema, type DialogueRequest } from '../../shared/dialogueSchema'

export interface AiHealth {
  configured: boolean
  provider: string
  model: string
  missing: string[]
  reachable: boolean
}

export type ModelResult =
  | { ok: true; model: string; result: AnalysisResult }
  | { ok: false; code: string; message: string }

function serviceFailure(status: number, body: unknown) {
  const parsed = z.object({
    code: z.string().optional(),
    message: z.string().optional(),
  }).safeParse(body)
  const data = parsed.success ? parsed.data : undefined
  const code = data?.code ?? ({
    404: 'route_not_found',
    429: 'rate_limit',
    504: 'timeout',
  } as Record<number, string>)[status] ?? 'network'
  const messages: Record<string, string> = {
    timeout: 'El proveedor de IA no respondió a tiempo. El motor local sigue disponible; puedes volver a intentarlo más tarde.',
    route_not_found: 'No se encontró la ruta de IA en el backend. El motor local sigue disponible.',
    rate_limit: 'Se alcanzó el límite de consultas de IA. Espera antes de volver a intentarlo; el motor local sigue disponible.',
    authentication: 'El proveedor de IA rechazó la configuración de acceso del servidor. El motor local sigue disponible.',
    model_unavailable: 'El modelo configurado no está disponible para esta cuenta. El motor local sigue disponible.',
    network: 'No se pudo completar la consulta al servicio de IA. El motor local sigue disponible.',
  }
  return {
    ok: false as const,
    code,
    message: messages[code] ?? data?.message ?? messages.network!,
  }
}

export async function askDialogue(context: DialogueRequest, signal: AbortSignal, sessionId?: string) {
  try {
    const response = await fetch(apiUrl('/api/ai/dialogue'), {
      method: 'POST',
      headers: { 'content-type': 'application/json',
        ...(context.mode === 'dashboard' && sessionId ? { 'X-Simulation-Id': sessionId } : {}) },
      body: JSON.stringify(context),
      signal: AbortSignal.any([signal, AbortSignal.timeout(40000)]),
    })
    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) return serviceFailure(response.status, body)
    const parsed = dialogueResponseSchema.safeParse(body)
    if (!parsed.success) return { ok: false as const, code: 'invalid_response', message: 'La respuesta de IA no se pudo validar.' }
    return { ok: true as const, ...parsed.data }
  } catch (error) {
    if (signal.aborted) return { ok: false as const, code: 'aborted', message: 'Solicitud cancelada.' }
    return serviceFailure(error instanceof DOMException && error.name === 'TimeoutError' ? 504 : 502, null)
  }
}

export async function getAiHealth(signal?: AbortSignal): Promise<AiHealth> {
  try {
    const response = await fetch(apiUrl('/api/ai/health'), { signal })
    if (!response.ok) return { configured: false, provider: 'desconocido', model: '', missing: [], reachable: false }
    const body = (await response.json()) as Partial<AiHealth>
    return {
      configured: Boolean(body.configured),
      provider: body.provider ?? 'desconocido',
      model: body.model ?? '',
      missing: Array.isArray(body.missing)
        ? body.missing.filter((item) => typeof item === 'string')
        : [],
      reachable: true,
    }
  } catch {
    return {
      configured: false,
      provider: 'desconocido',
      model: '',
      missing: [],
      reachable: false,
    }
  }
}

export async function askModel(
  path: '/api/ai/analyze' | '/api/ai/chat',
  context: AnalysisContextInput,
  signal: AbortSignal,
): Promise<ModelResult> {
  try {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(context),
      signal: AbortSignal.any([signal, AbortSignal.timeout(40000)]),
    })
    const body = (await response.json().catch(() => null)) as {
      code?: string
      message?: string
      model?: string
      result?: AnalysisResult
    } | null
    if (!response.ok) return serviceFailure(response.status, body)
    if (!body?.result) {
      return {
        ok: false,
        code: body?.code ?? 'network',
        message: body?.message ?? 'El servicio de IA no respondiÃ³.',
      }
    }
    const result = analysisResultSchema.safeParse(body.result)
    if (!result.success || !checkAnalysisRefs(result.data, context).ok)
      return {
        ok: false,
        code: 'invalid_response',
        message: 'La respuesta de IA contiene datos o referencias invÃ¡lidos.',
      }
    return { ok: true, model: z.string().max(120).catch('modelo').parse(body.model), result: result.data }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError')
      return serviceFailure(504, null)
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'aborted',
        message: 'Se cancelÃ³ la solicitud. No se guardÃ³ un anÃ¡lisis.',
      }
    }
    return {
      ok: false,
      code: 'network',
      message:
        'No hay conexiÃ³n con el servicio de IA. El motor local sigue disponible.',
    }
  }
}

export type SpaceModelResult =
  | {
      ok: true
      model: string
      proposal: SpaceProposal
      toolsUsed?: { name: string; status: string }[]
    }
  | { ok: false; code: string; message: string }

export async function askSpaceModel(
  context: SpaceContextInput,
  signal: AbortSignal,
  access?: { sessionId: string; token: string },
): Promise<SpaceModelResult> {
  try {
    const response = await fetch(apiUrl('/api/ai/space'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(access
          ? {
              'X-Simulation-Id': access.sessionId,
              'X-Space-Token': access.token,
            }
          : {}),
      },
      body: JSON.stringify(context),
      signal: AbortSignal.any([signal, AbortSignal.timeout(40000)]),
    })
    const body = (await response.json().catch(() => null)) as {
      code?: string
      message?: string
      model?: string
      result?: unknown
      toolsUsed?: unknown
    } | null
    const proposal = spaceProposalSchema.safeParse(body?.result)
    if (!response.ok) return serviceFailure(response.status, body)
    if (!proposal.success) {
      return {
        ok: false,
        code: body?.code ?? 'invalid_response',
        message:
          body?.message ??
          'La respuesta del modelo no se usa. El motor local sigue disponible.',
      }
    }
    return {
      ok: true,
      model: z.string().max(120).catch('modelo').parse(body?.model),
      proposal: {
        ...proposal.data,
        nivel: context.selectedLevel ?? proposal.data.nivel,
      },
      toolsUsed: z
        .array(
          z.object({ name: z.string().max(80), status: z.string().max(30) }),
        )
        .max(4)
        .catch([])
        .parse(body?.toolsUsed),
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError')
      return serviceFailure(504, null)
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'aborted',
        message: 'Se cancelÃ³ la consulta al modelo.',
      }
    }
    return {
      ok: false,
      code: 'network',
      message:
        'No hay conexiÃ³n con el servicio de IA. El motor local sigue disponible.',
    }
  }
}

export async function authorizeSpaceModel(
  sessionId: string,
  crewId: string,
  pin: string,
  dataUse: {
    sleep: boolean
    pulse: boolean
    symptoms: boolean
    mission: boolean
  },
  historyConsent: boolean,
  signal: AbortSignal,
) {
  const response = await fetch(apiUrl('/api/space/access'), {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'X-Simulation-Id': sessionId,
    },
    body: JSON.stringify({
      crewId,
      pin,
      dataUse,
      historyConsent,
      modelConsent: true,
    }),
  })
  if (!response.ok) throw new Error('Model access not authorized')
  return z
    .object({
      token: z.string().regex(/^[a-f0-9]{64}$/),
      expiresAt: z.number(),
    })
    .parse(await response.json())
}
export async function revokeSpaceModel(access: {
  sessionId: string
  token: string
}) {
  await fetch(apiUrl('/api/space/access'), {
    method: 'DELETE',
    headers: {
      'X-Simulation-Id': access.sessionId,
      'X-Space-Token': access.token,
    },
    signal: AbortSignal.timeout(5000),
  }).catch(() => undefined)
}
