import { MoreHorizontal, SendHorizontal, Square, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import {
  askQuiron,
  formatServiceStatus,
  probeQuironHealth,
  quironContextLabel,
  type QuironMessage,
  type QuironMode,
} from '../../ai/quironAsk'
import type { AiHealth } from '../../ai/client'
import { dialogueContextKey } from '../../../shared/dialogueSchema'
import { recentSpaceMessages } from '../../ai/spaceMemory'
import type { AppState } from '../../../shared/types'
import { dashboardSuggestions, isPresetQuestion, publicSuggestions } from '../../domain/quironPublic'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { getActiveMissionId, getStoredProfile } from '../../platform/session'
import { useWorkspaceRole } from '../../platform/workspace'
import { formatQuironReply } from './formatReply'
import './quiron.css'
import { AI_CARE, CareAiControls } from './CareAiControls'
import type { CareAiOptions, CareConversation } from '../../../shared/careSchema'

const GREET_KEY = 'quiron-greet-dismissed'
const SESSION_KEY_PUBLIC = 'quiron-public-thread'
const ASSETS = {
  /** Official Quirón PNG (fondo negro removido por flood-fill; contornos conservados). */
  character: '/brand/quiron/quiron-character.png?v=2',
  mark: '/brand/quiron/quiron-mark.svg',
} as const

type CareTopic = 'physical' | 'emotional'

function mapCareMessages(conversation: CareConversation): QuironMessage[] {
  return (conversation.messages || []).map((item, index) => ({
    id: `${conversation.id}-${index}-${item.role}`,
    role: item.role,
    text: item.text,
    at: item.at ?? Date.now() + index,
    channel: item.source === 'model' ? 'model' : 'local',
    model: item.model,
    notice: item.notice,
    sources: item.sources,
  }))
}

export function QuironChat({ mode, state = null }: { mode: QuironMode; state?: AppState | null }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const location = useLocation()
  const dialogId = useId()
  const titleId = useId()
  const fabRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const flightRef = useRef('')
  const stickBottom = useRef(true)
  const composing = useRef(false)
  const contextKeyRef = useRef('')
  const generation = useRef(0)

  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [health, setHealth] = useState<AiHealth | null>(null)
  const [probing, setProbing] = useState(true)
  const [announce, setAnnounce] = useState('')
  const [showJump, setShowJump] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [messages, setMessages] = useState<QuironMessage[]>([])
  const [careTopic, setCareTopic] = useState<CareTopic | null>(null)
  const [careConversationId, setCareConversationId] = useState<string | null>(null)
  const [careAiOptions, setCareAiOptions] = useState<CareAiOptions>(AI_CARE)
  const workspaceRole = useWorkspaceRole()
  const sessionId = mode === 'dashboard' ? sessionStorage.getItem('vitalink-simulation-id') ?? '' : ''
  const scope = `${mode}:${lang}:${sessionId}:${mode === 'dashboard' ? `${getActiveMissionId()}:${getStoredProfile()?.id}:${workspaceRole}` : ''}:${mode === 'dashboard' && state ? dialogueContextKey(state) : ''}`

  const clearThread = useCallback(() => {
    generation.current++
    abortRef.current?.abort()
    abortRef.current = null
    flightRef.current = ''
    setPending(false)
    setMessages([])
    setCareTopic(null)
    setCareConversationId(null)
    setCareAiOptions(AI_CARE)
    setDraft('')
    setError('')
    setAnnounce('')
  }, [])

  useEffect(() => {
    if (mode !== 'dashboard') return
    const openDemo = (event: Event) => {
      const detail: unknown = (event as CustomEvent).detail
      if (!detail || typeof detail !== 'object' || !('question' in detail) || typeof detail.question !== 'string') return
      setOpen(true)
      setDraft(detail.question.slice(0, 1000))
      setShowTip(false)
    }
    const openCare = (event: Event) => {
      const detail: unknown = (event as CustomEvent).detail
      const topic =
        detail && typeof detail === 'object' && 'topic' in detail && (detail.topic === 'physical' || detail.topic === 'emotional')
          ? detail.topic
          : null
      setShowTip(false)
      setOpen(true)
      setMenuOpen(false)
      if (topic) {
        window.setTimeout(() => {
          void (async () => {
            const missionId = getActiveMissionId()
            if (!missionId) {
              setError(en ? 'Join or open a mission to talk about your health with Quirón.' : 'Entrá a una misión para hablar de tu salud con Quirón.')
              return
            }
            setPending(true)
            setError('')
            const version = ++generation.current
            try {
              const conversation = await platformApi.quironStart(missionId, topic, lang) as CareConversation
              if (version !== generation.current) return
              setCareTopic(topic)
              setCareConversationId(conversation.id)
              setCareAiOptions(AI_CARE)
              setMessages(mapCareMessages(conversation))
              stickBottom.current = true
              window.setTimeout(() => inputRef.current?.focus(), 20)
            } catch (err) {
              if (version !== generation.current) return
              setError(err instanceof Error ? err.message : (en ? 'Could not start the conversation.' : 'No se pudo iniciar la conversación.'))
            } finally {
              if (version === generation.current) setPending(false)
            }
          })()
        }, 0)
      }
    }
    window.addEventListener('helios:quiron-demo', openDemo)
    window.addEventListener('helios:quiron-care', openCare)
    return () => {
      window.removeEventListener('helios:quiron-demo', openDemo)
      window.removeEventListener('helios:quiron-care', openCare)
    }
  }, [mode, en, lang])

  const suggestions = mode === 'public' ? publicSuggestions(lang) : dashboardSuggestions(lang)
  const status = formatServiceStatus(health, lang, probing)
  const contextLabel = mode === 'dashboard' ? quironContextLabel(state, lang) : undefined

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(GREET_KEY) && !localStorage.getItem(GREET_KEY)) {
        setShowTip(true)
        const timer = window.setTimeout(() => setShowTip(false), 6500)
        return () => window.clearTimeout(timer)
      }
    } catch {
      setShowTip(true)
    }
  }, [])

  useEffect(() => {
    if (mode !== 'public') return
    try {
      // Threads live in component memory only; do not restore old unconsented text.
      sessionStorage.removeItem(SESSION_KEY_PUBLIC)
    } catch {
      /* ignore */
    }
  }, [mode])

  useEffect(() => () => { generation.current++; abortRef.current?.abort() }, [])

  useEffect(() => {
    const controller = new AbortController()
    setProbing(true)
    void probeQuironHealth(controller.signal).then((value) => {
      if (!controller.signal.aborted) {
        setHealth(value)
        setProbing(false)
      }
    })
    return () => controller.abort()
  }, [open])

  useEffect(() => {
    if (!contextKeyRef.current) {
      contextKeyRef.current = scope
      return
    }
    if (contextKeyRef.current !== scope) {
      contextKeyRef.current = scope
      clearThread()
    }
  }, [scope, clearThread])

  const closePanel = useCallback(() => {
    setOpen(false)
    setMenuOpen(false)
    window.setTimeout(() => fabRef.current?.focus(), 30)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (menuOpen) setMenuOpen(false)
        else closePanel()
      }
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => closeRef.current?.focus(), 40)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, menuOpen, closePanel])

  useEffect(() => {
    if (!menuOpen) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || menuBtnRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    return () => window.removeEventListener('mousedown', onPointer)
  }, [menuOpen])

  const dismissTip = () => {
    setShowTip(false)
    try {
      localStorage.setItem(GREET_KEY, '1')
    } catch {
      /* */
    }
  }

  const openPanel = () => {
    dismissTip()
    setOpen(true)
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    stickBottom.current = dist < 64
    setShowJump(dist >= 96)
  }

  const scrollToEnd = (force = false) => {
    const el = scrollRef.current
    if (!el) return
    if (!force && !stickBottom.current) {
      setShowJump(true)
      return
    }
    el.scrollTop = el.scrollHeight
    setShowJump(false)
  }

  useEffect(() => {
    if (!open) return
    scrollToEnd()
  }, [messages, pending, open])

  const startCareTopic = async (topic: CareTopic) => {
    if (pending) return
    const missionId = getActiveMissionId()
    if (!missionId) {
      setError(en ? 'Join or open a mission to talk about your health with Quirón.' : 'Entrá a una misión para hablar de tu salud con Quirón.')
      return
    }
    setPending(true)
    setError('')
    setMenuOpen(false)
    const version = ++generation.current
    try {
      const conversation = await platformApi.quironStart(missionId, topic, lang) as CareConversation
      if (version !== generation.current) return
      setCareTopic(topic)
      setCareConversationId(conversation.id)
      setCareAiOptions(AI_CARE)
      setMessages(mapCareMessages(conversation))
      setAnnounce(
        topic === 'physical'
          ? (en ? 'Physical health conversation started.' : 'Conversación de salud física iniciada.')
          : (en ? 'Emotional wellbeing conversation started.' : 'Conversación de bienestar emocional iniciada.'),
      )
      stickBottom.current = true
      window.setTimeout(() => inputRef.current?.focus(), 20)
    } catch (err) {
      if (version !== generation.current) return
      setError(err instanceof Error ? err.message : (en ? 'Could not start the conversation.' : 'No se pudo iniciar la conversación.'))
    } finally {
      if (version === generation.current) setPending(false)
    }
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || pending) return
    const key = `${mode}-${careTopic || 'general'}-${trimmed}-${messages.length}`
    if (flightRef.current === key) return
    flightRef.current = key

    const userMsg: QuironMessage = {
      id: `${key}-u`,
      role: 'user',
      text: trimmed,
      at: Date.now(),
      channel: 'local',
    }
    setMessages((prev) => [...prev, userMsg])
    setDraft('')
    setError('')
    setPending(true)
    stickBottom.current = true

    if (careConversationId) {
      const version = ++generation.current
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const conversation = await platformApi.quironMessage(careConversationId, trimmed, lang, careAiOptions, controller.signal)
        if (version !== generation.current) return
        setMessages(mapCareMessages({ ...conversation, id: careConversationId }))
        const last = conversation.messages?.at(-1)
        if (last?.role === 'assistant') setAnnounce(last.text)
      } catch {
        if (version !== generation.current) return
        setError(en ? 'Could not reach Quirón. Your text is still in the box.' : 'No se pudo contactar a Quirón. Tu texto sigue en el campo.')
        setDraft(trimmed)
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
      } finally {
        if (version === generation.current) {
        setPending(false)
        abortRef.current = null
        flightRef.current = ''
        window.setTimeout(() => inputRef.current?.focus(), 20)
        }
      }
      return
    }

    const preset = isPresetQuestion(trimmed)
    const controller = new AbortController()
    abortRef.current = controller
    const version = ++generation.current

    try {
      const result = await askQuiron({
        mode,
        question: trimmed,
        locale: lang,
        state: mode === 'dashboard' ? state : null,
        signal: controller.signal,
        preferModel: !preset,
        modelConsent: !preset,
        historyConsent: !preset,
        dataConsent: !preset && mode === 'dashboard',
        history: preset ? [] : recentSpaceMessages(messages.filter((m) => m.channel !== 'error'), trimmed),
        sessionId,
      })
      if (controller.signal.aborted || version !== generation.current) return
      if (result.errorCode === 'aborted') {
        setPending(false)
        flightRef.current = ''
        return
      }
      const bot: QuironMessage = {
        id: `${key}-a`,
        role: 'assistant',
        text: result.text,
        at: Date.now(),
        sources: result.sources,
        channel: result.channel,
        contextLabel: result.contextLabel,
        model: result.model,
        notice: result.notice,
        retryQuestion: result.errorCode ? trimmed : undefined,
      }
      setMessages((prev) => [...prev, bot])
      setAnnounce(result.text)
      if (result.channel === 'error') setError(result.text)
    } catch {
      if (controller.signal.aborted || version !== generation.current) return
      setError(en ? 'Could not reach Quirón. Your text is still in the box.' : 'No se pudo contactar a Quirón. Tu texto sigue en el campo.')
      setDraft(trimmed)
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
    } finally {
      if (version === generation.current) {
      setPending(false)
      flightRef.current = ''
      abortRef.current = null
      window.setTimeout(() => inputRef.current?.focus(), 20)
      }
    }
  }

  const stop = () => {
    generation.current++
    abortRef.current?.abort()
    abortRef.current = null
    flightRef.current = ''
    setPending(false)
  }

  const newConversation = () => {
    setMenuOpen(false)
    clearThread()
    setAnnounce(en ? 'New conversation started.' : 'Nueva conversación iniciada.')
    if (mode === 'public') {
      try {
        sessionStorage.removeItem(SESSION_KEY_PUBLIC)
      } catch {
        /* */
      }
    }
  }

  const careTopicLabel =
    careTopic === 'physical'
      ? (en ? 'Physical health' : 'Salud física')
      : careTopic === 'emotional'
        ? (en ? 'Emotional wellbeing · private by default' : 'Bienestar emocional · privado por defecto')
        : null

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send(draft)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (composing.current) return
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send(draft)
    }
  }

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [draft])

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setAnnounce(en ? 'Answer copied.' : 'Respuesta copiada.')
    } catch {
      setAnnounce(en ? 'Could not copy.' : 'No se pudo copiar.')
    }
  }

  const channelLabel = (channel: QuironMessage['channel']) => {
    if (channel === 'model') return en ? 'Optional model · not clinical' : 'Modelo opcional · no clínico'
    if (channel === 'local') return en ? 'Local engine · demo-safe' : 'Motor local · seguro para demo'
    if (channel === 'demo') return en ? 'Demo scripted reply' : 'Respuesta de demostración'
    return en ? 'Error' : 'Error'
  }

  const ui = (
    <div
      className={`quiron-root${open ? ' is-open' : ''}${mode === 'dashboard' ? ' is-dashboard' : ''}`}
      data-page={location.pathname}
      data-mode={mode}
    >
      <div className="quiron-fab-wrap">
        {showTip && !open ? (
          <div className="quiron-tip" role="status">
            <img className="quiron-tip-art" src={ASSETS.character} alt="" width={48} height={48} decoding="async" />
            <span>{en ? 'Hi, I’m Quirón. How can I help?' : 'Hola, soy Quirón. ¿En qué te ayudo?'}</span>
            <button type="button" aria-label={en ? 'Dismiss greeting' : 'Descartar saludo'} onClick={dismissTip}>
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <button
          ref={fabRef}
          type="button"
          className={`quiron-fab${open ? ' is-open' : ''}${pending ? ' is-busy' : ''}`}
          aria-label={en ? 'Open chat with Quirón' : 'Abrir chat con Quirón'}
          aria-expanded={open}
          aria-controls={dialogId}
          onClick={() => (open ? closePanel() : openPanel())}
        >
          <span className="quiron-fab-float" aria-hidden="true">
            <img src={ASSETS.character} alt="" width={56} height={56} decoding="async" />
          </span>
        </button>
      </div>

      {open ? (
        <div
          id={dialogId}
          className="quiron-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="quiron-head">
            <div className="quiron-head-avatar" aria-hidden="true">
              <img src={ASSETS.character} alt="" width={44} height={44} decoding="async" />
            </div>
            <div>
              <h2 id={titleId}>Quirón</h2>
              <p>{en ? 'HELIOS guide · not a clinician' : 'Guía HELIOS · no es clínico'}</p>
              <div className="quiron-status">
                <span className={`quiron-status-dot${status.ok && health?.configured ? ' is-ok' : ''}`} aria-hidden="true" />
                <span>{status.label}</span>
              </div>
            </div>
            <div className="quiron-head-actions">
              <button
                ref={menuBtnRef}
                type="button"
                className="quiron-icon-btn"
                aria-label={en ? 'More options' : 'Más opciones'}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={18} aria-hidden="true" />
              </button>
              <button
                ref={closeRef}
                type="button"
                className="quiron-icon-btn"
                aria-label={en ? 'Close Quirón chat' : 'Cerrar chat de Quirón'}
                onClick={closePanel}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {menuOpen ? (
              <div ref={menuRef} className="quiron-menu" role="menu">
                <button type="button" role="menuitem" onClick={newConversation}>
                  {en ? 'Start new conversation' : 'Iniciar nueva conversación'}
                </button>
                {mode === 'dashboard' ? (
                  <>
                    <button type="button" role="menuitem" disabled={pending} onClick={() => void startCareTopic('physical')}>
                      {en ? 'Talk about physical health' : 'Hablar de salud física'}
                    </button>
                    <button type="button" role="menuitem" disabled={pending} onClick={() => void startCareTopic('emotional')}>
                      {en ? 'Talk about emotional wellbeing' : 'Hablar de bienestar emocional'}
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </header>

          <div className="quiron-body">
            <div ref={scrollRef} className="quiron-scroll" onScroll={onScroll}>
              {careTopicLabel ? <p className="quiron-care-chip">{careTopicLabel}</p> : null}
              {contextLabel && messages.length > 0 ? <p className="quiron-context">{contextLabel}</p> : null}

              {messages.length === 0 ? (
                <div className="quiron-welcome">
                  <div className="quiron-welcome-art" aria-hidden="true">
                    <img src={ASSETS.character} alt="" width={220} height={220} decoding="async" />
                  </div>
                  <img src={ASSETS.mark} alt="" height={28} style={{ height: 28, width: 'auto' }} />
                  <h3>{en ? 'Hi, I’m Quirón 👋' : 'Hola, soy Quirón 👋'}</h3>
                  <p>
                    {en
                      ? 'I can help you explore HELIOS, understand the information available, and organize your questions across mission stages.'
                      : 'Puedo ayudarte a explorar HELIOS, comprender la información disponible y organizar tus consultas durante las distintas etapas de una misión.'}
                  </p>
                  {mode === 'public' ? (
                    <p className="quiron-context">
                      {en ? 'Public site · no private dashboard data' : 'Sitio público · sin datos privados del panel'}
                    </p>
                  ) : contextLabel ? (
                    <p className="quiron-context">{contextLabel}</p>
                  ) : null}
                  {mode === 'dashboard' ? (
                    <div className="quiron-topics">
                      <p className="quiron-topics-label">{en ? 'What do you want to talk about?' : '¿Sobre qué querés hablar?'}</p>
                      <div className="quiron-topics-row">
                        <button
                          type="button"
                          className={`quiron-topic${careTopic === 'physical' ? ' is-on' : ''}`}
                          disabled={pending}
                          onClick={() => void startCareTopic('physical')}
                        >
                          {en ? 'Physical health' : 'Salud física'}
                        </button>
                        <button
                          type="button"
                          className={`quiron-topic${careTopic === 'emotional' ? ' is-on' : ''}`}
                          disabled={pending}
                          onClick={() => void startCareTopic('emotional')}
                        >
                          {en ? 'Emotional wellbeing' : 'Bienestar emocional'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="quiron-suggestions">
                    {suggestions.map((item) => (
                      <button key={item} type="button" className="quiron-chip" onClick={() => void send(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) =>
                  msg.role === 'user' ? (
                    <article key={msg.id} className="quiron-msg is-user">
                      <div className="quiron-bubble">{msg.text}</div>
                    </article>
                  ) : (
                    <article key={msg.id} className="quiron-msg is-bot">
                      <div className="quiron-msg-avatar" aria-hidden="true">
                        <img src={ASSETS.character} alt="" width={34} height={34} decoding="async" />
                      </div>
                      <div>
                        <div className="quiron-bubble">{formatQuironReply(msg.text)}</div>
                        <div className="quiron-meta">
                          <span>{msg.channel === 'model' && msg.model?.startsWith('gemini-') ? `Gemini (${msg.model})` : channelLabel(msg.channel)}</span>
                          {msg.sources && msg.sources.length > 0 ? <details><summary>{en ? 'Sources' : 'Fuentes'}</summary><ul>{msg.sources.map((source) => <li key={source}>{source}</li>)}</ul></details> : null}
                          <button type="button" className="quiron-copy" onClick={() => void copyText(msg.text)}>
                            {en ? 'Copy' : 'Copiar'}
                          </button>
                        </div>
                        {msg.notice ? <p className="quiron-context">{msg.notice}</p> : null}
                        {msg.retryQuestion ? <button type="button" disabled={pending} onClick={() => void send(msg.retryQuestion!)}>{en ? 'Retry' : 'Reintentar'}</button> : null}
                      </div>
                    </article>
                  ),
                )
              )}

              {pending ? (
                <div className="quiron-msg is-bot" role="status" aria-label={en ? 'Quirón is writing' : 'Quirón está escribiendo'}>
                  <div className="quiron-msg-avatar">
                    <img src={ASSETS.character} alt="" width={34} height={34} decoding="async" />
                  </div>
                  <div className="quiron-typing" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : null}
            </div>

            {showJump ? (
              <button type="button" className="quiron-jump" onClick={() => scrollToEnd(true)}>
                {en ? 'Jump to latest' : 'Ir al último mensaje'}
              </button>
            ) : null}
          </div>

          <form className="quiron-composer" onSubmit={onSubmit}>
            {careConversationId ? <CareAiControls key={careConversationId}
              conversationId={careConversationId} messageCount={messages.length} locale={lang} state={state}
              disabled={pending} onChange={setCareAiOptions} onCancel={stop} /> : null}
            <label className="sr-only" htmlFor={`${dialogId}-input`}>
              {en ? 'Message for Quirón' : 'Mensaje para Quirón'}
            </label>
            <textarea
              ref={inputRef}
              id={`${dialogId}-input`}
              rows={1}
              placeholder={en ? 'Write to Quirón…' : 'Escribile a Quirón…'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onCompositionStart={() => {
                composing.current = true
              }}
              onCompositionEnd={() => {
                composing.current = false
              }}
            />
            {pending ? (
              <button type="button" className="quiron-send is-busy" aria-label={en ? 'Stop response' : 'Detener respuesta'} onClick={stop}>
                <Square size={16} aria-hidden="true" fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                className="quiron-send"
                disabled={!draft.trim()}
                aria-label={en ? 'Send message' : 'Enviar mensaje'}
              >
                <SendHorizontal size={18} aria-hidden="true" />
              </button>
            )}
            {error ? (
              <p className="quiron-error" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => {
                    const retry = draft || messages.filter((m) => m.role === 'user').at(-1)?.text || ''
                    setError('')
                    void send(retry)
                  }}
                >
                  {en ? 'Retry' : 'Reintentar'}
                </button>
              </p>
            ) : null}
          </form>

          <div className="quiron-sr-live" aria-live="polite">
            {announce}
          </div>
        </div>
      ) : null}
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(ui, document.body)
}
