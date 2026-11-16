import { answerLocal, answerMissionLocal } from '../domain/analysis'
import { answerPublicLocal, type QuironPublicLocale } from '../domain/quironPublic'
import { askDialogue, getAiHealth, type AiHealth } from './client'
import { dialogueContextKey, type DialogueHistory } from '../../shared/dialogueSchema'
import type { AppState } from '../../shared/types'
import { crewById } from '../domain/crew'
import { generalQuironExplanation } from '../domain/quironKnowledge'
import { dashboardIndicatorAnswer } from '../domain/quironDashboardLocal'
import { dashboardConversationFallback } from '../../shared/dashboardConversation'

export type QuironMode = 'public' | 'dashboard'

export interface QuironMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
  sources?: string[]
  /** Honest label when answer is local/demo, not a live model */
  channel: 'model' | 'local' | 'demo' | 'error'
  contextLabel?: string
  model?: string
  notice?: string
  retryQuestion?: string
}

export interface QuironAskResult {
  text: string
  sources: string[]
  channel: QuironMessage['channel']
  contextLabel?: string
  model?: string
  errorCode?: string
  notice?: string
}

export function quironContextLabel(state: AppState | null, locale: QuironPublicLocale): string | undefined {
  if (!state) return undefined
  const episode =
    state.episodes.find((item) => item.id === state.selectedEpisodeId) ??
    state.episodes.find((item) => item.status !== 'closed')
  const crew = episode ? crewById(episode.crewId) : null
  const stage =
    locale === 'en'
      ? state.mission.stage === 'preembarque'
        ? 'Preflight'
        : state.mission.stage === 'a_bordo'
          ? 'In Flight'
          : 'Completed'
      : state.mission.stage === 'preembarque'
        ? 'Preembarque'
        : state.mission.stage === 'a_bordo'
          ? 'A bordo'
          : 'Finalizada'
  if (crew) return locale === 'en' ? `Context: ${crew.name} · ${stage}` : `Contexto: ${crew.name} · ${stage}`
  return locale === 'en' ? `Context: ${state.mission.name} · ${stage}` : `Contexto: ${state.mission.name} · ${stage}`
}

export async function askQuiron(options: {
  mode: QuironMode
  question: string
  locale: QuironPublicLocale
  state: AppState | null
  signal: AbortSignal
  preferModel: boolean
  modelConsent?: boolean
  historyConsent?: boolean
  dataConsent?: boolean
  history?: DialogueHistory
  sessionId?: string
}): Promise<QuironAskResult> {
  const { mode, question, locale, state, signal, preferModel } = options
  const trimmed = question.trim().slice(0, 1000)
  if (!trimmed) {
    return {
      text: locale === 'en' ? 'Write a short question for Quirón.' : 'Escribí una pregunta breve para Quirón.',
      sources: [],
      channel: 'error',
      errorCode: 'empty',
    }
  }

  if (mode === 'dashboard' && !state) {
    return {
      text: locale === 'en' ? 'Dashboard context is not ready yet.' : 'El contexto del panel aún no está listo.',
      sources: [],
      channel: 'error',
      errorCode: 'no_state',
    }
  }

  const label = mode === 'dashboard' ? quironContextLabel(state, locale) : undefined

  // ── Episode lookup for deterministic clinical fallback (dashboard only) ──────
  const episode =
    state && mode === 'dashboard'
      ? state.episodes.find(
          (item) =>
            item.id === state.selectedEpisodeId &&
            (state.role === 'medical' ||
              (state.role === 'astronaut' && item.crewId === state.sessionCrewId)),
        )
      : undefined

  // ── 1. Try Gemini / configured model when consent is given ───────────────────
  //   This applies to ALL modes (public, dashboard) so conversations are natural.
  //   Only clinical deterministic answers bypass Gemini (see section 2 below).
  let failure: { code: string; message: string } | undefined

  if (preferModel && options.modelConsent) {
    const response = await askDialogue(
      {
        mode,
        question: trimmed,
        locale,
        modelConsent: true,
        historyConsent: Boolean(options.historyConsent),
        dataConsent: mode === 'dashboard' && Boolean(options.dataConsent),
        history: options.historyConsent ? (options.history ?? []) : [],
        // Public requests never include a private context key.
        ...(state && mode === 'dashboard' ? { contextKey: dialogueContextKey(state) } : {}),
      },
      signal,
      mode === 'dashboard' ? options.sessionId : undefined,
    )

    if (response.ok) {
      return {
        text: response.result.text,
        sources: response.result.sources,
        channel: 'model',
        contextLabel: label,
        model: response.model,
      }
    }

    if (response.code === 'aborted') {
      return {
        text: locale === 'en' ? 'Request cancelled.' : 'Solicitud cancelada.',
        sources: [],
        channel: 'error',
        errorCode: 'aborted',
        contextLabel: label,
      }
    }

    // Model failed – record failure, fall through to local engines
    failure = response
  }

  const fallback = {
    errorCode: failure?.code,
    notice: failure
      ? locale === 'en'
        ? 'The model could not respond. Showing a local answer instead.'
        : 'El modelo no pudo responder. Mostrando una respuesta local.'
      : undefined,
  }

  // ── 2. Deterministic clinical analysis (dashboard, with episode, health question) ──
  //   Only used as fallback when Gemini is unavailable or not consented.
  const conversational = mode === 'dashboard' ? dashboardConversationFallback(trimmed, locale, options.historyConsent ? options.history : []) : undefined
  if (conversational) return { text: conversational, sources: [], channel: 'local', contextLabel: label, ...fallback }
  const explanation = generalQuironExplanation(trimmed, locale === 'en')
  if (mode === 'dashboard' && explanation) {
    return { text: explanation, sources: [], channel: 'local', contextLabel: label, ...fallback }
  }

  if (
    mode === 'dashboard' &&
    episode &&
    state &&
    /alert|indicador|pulso|pulse|heart|frecuencia|sueño|sleep|sensor|medici|measurement|sintoma|síntoma|symptom|datos.*falt|missing.*data/i.test(
      trimmed,
    )
  ) {
    const local = answerLocal(state, episode.id, trimmed)
    if (local) {
      return { text: local.summary, sources: local.sources, channel: 'local', contextLabel: label, ...fallback }
    }
  }

  // ── 3. Public / general fallback ─────────────────────────────────────────────
  const indicators = mode === 'dashboard' && state
    ? dashboardIndicatorAnswer(state, trimmed, locale === 'en') : undefined
  if (indicators) return {
    text: indicators, sources: ['HELIOS · motor determinista local'], channel: 'local', contextLabel: label, ...fallback,
  }

  if (mode === 'public') {
    const local = answerPublicLocal(trimmed, locale, options.historyConsent ? options.history : [])
    return { text: local.text, sources: local.sources, channel: 'demo', ...fallback }
  }

  // ── 4. Dashboard general fallback (mission resources / comms) ────────────────
  const general = answerPublicLocal(trimmed, locale, options.historyConsent ? options.history : [])
  const mission =
    state && /mision|misión|mission|destino|destination|enlace|comunic|link|communicat|inventar|recurso|resource|prepar/i.test(trimmed)
      ? answerMissionLocal(state, trimmed)
      : general.text
  return {
    text: mission,
    sources: [locale === 'en' ? 'Quirón · HELIOS local engine' : 'Quirón · motor local de HELIOS'],
    channel: 'local',
    contextLabel: label,
    ...fallback,
  }
}

export async function probeQuironHealth(signal?: AbortSignal): Promise<AiHealth> {
  return getAiHealth(signal)
}

export function formatServiceStatus(
  health: AiHealth | null,
  locale: QuironPublicLocale,
  probing: boolean,
): { label: string; ok: boolean } {
  if (probing || !health) {
    return { label: locale === 'en' ? 'Checking service…' : 'Comprobando servicio…', ok: false }
  }
  if (health.reachable && health.configured) {
    return {
      label: locale === 'en'
        ? `Optional model ready · ${health.provider} · not clinical`
        : `Modelo opcional listo · ${health.provider} · no clínico`,
      ok: true,
    }
  }
  if (health.reachable && !health.configured) {
    return {
      label: locale === 'en'
        ? 'Local / demo engine · model key not set (honest fallback)'
        : 'Motor local / demo · sin clave de modelo (fallback honesto)',
      ok: true,
    }
  }
  return {
    label: locale === 'en'
      ? 'Local / demo engine · AI endpoint unreachable'
      : 'Motor local / demo · endpoint de IA no alcanzable',
    ok: true,
  }
}
