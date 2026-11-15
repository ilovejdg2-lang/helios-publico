import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react'
import type { AppState, CrewId, AnalysisResult } from '../../shared/types'
import { ApiError, SimulationClient } from '../api/simulation'
import { createInitialState } from '../domain/scenarios'
import { answerLocal } from '../domain/analysis'
import { reduce, type Action } from '../domain/reduce'
import { clearPrivate } from '../persistence/private'
import { clearSpace } from '../persistence/space'
import { HeliosLogo } from '../components/HeliosLogo'
import { loadState, saveState } from '../persistence/db'

interface StoreValue {
  state: AppState
  backendMode: 'connected' | 'local_simulator'
  backendError: string | null
  persistenceError: string | null
  saving: boolean
  authenticatedCrewId: CrewId | null
  dispatch: (action: Action) => void
  runActions: (actions: Action[]) => Promise<AppState>
  analyzeEpisode: (episodeId: string, question?: string) => Promise<AnalysisResult>
  /** Live Nest monitoring read (same session). Null when offline/local. */
  monitoringLatest: (crewId: CrewId, kind: string) => Promise<{
    measurement: AppState['measurements'][number] | null
    comparison: { min: number; max: number; deltaFromMinimum: number; deltaFromMaximum: number } | null
  } | null>
  listHistoryEvents: (filters?: { crewId?: string; type?: string }) => Promise<Array<{
    type: string
    at: number
    crewId: string | null
    data: unknown
  }> | null>
  unlockSpace: (crewId: CrewId) => void
  restoreDemo: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null)
  const [persistenceError, setPersistenceError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [authenticatedCrewId, setAuthenticatedCrewId] = useState<CrewId | null>(null)
  const stateRef = useRef<AppState | null>(null)
  stateRef.current = state
  const [backendMode, setBackendMode] = useState<'connected' | 'local_simulator'>('local_simulator')
  const [backendError, setBackendError] = useState<string | null>(null)
  const client = useRef<SimulationClient | null>(null)
  const connected = useRef(false)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const actionFailure = useRef<string | null>(null)
  const tickPending = useRef(false)
  const ready = useRef(false)

  const apply = useCallback((next: AppState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const detach = useCallback(() => {
    connected.current = false
    setBackendMode('local_simulator')
    // La copia local continúa en una sesión nueva para conservar ambas ramas de datos.
    try {
      sessionStorage.setItem('vitalink-simulation-id', crypto.randomUUID())
    } catch {
      /* Sesión en memoria. */
    }
    setBackendError(null)
  }, [])

  const dispatch = useCallback(
    (action: Action) => {
      if (action.type === 'setRole') setAuthenticatedCrewId(null)
      if (action.type === 'tick' && tickPending.current) return
      if (action.type === 'tick') tickPending.current = true
      queue.current = queue.current
        .then(async () => {
          actionFailure.current = null
          const current = stateRef.current
          if (!current) return
          if (!connected.current || !client.current) {
            apply(reduce(current, action))
            return
          }
          try {
            // Prefer dedicated Nest surfaces when available (alerts REST).
            let snapshot
            if (action.type === 'ackAlert') {
              snapshot = await client.current.ackAlert(action.alertId)
            } else if (action.type === 'setAlertStatus') {
              snapshot = await client.current.setAlertStatus(action.alertId, action.status)
            } else {
              snapshot = await client.current.dispatch(action)
            }
            apply(snapshot.state)
            setBackendError(null)
          } catch (error) {
            if (error instanceof ApiError && error.status < 500) {
              if (error.status === 409) {
                try {
                  apply((await client.current.refresh()).state)
                } catch {
                  detach()
                }
              }
              if (error.status === 429) error.message += ` Retry after ${error.retryAfterSeconds ?? 60}s / reintenta en ${error.retryAfterSeconds ?? 60}s.`
              actionFailure.current = error.message
              setBackendError(`La operación no se confirmó. ${error.message}`)
              return
            }
            detach()
            apply(reduce(current, action))
          }
        })
        .catch(() => {
          actionFailure.current = 'No se pudo aplicar la operación.'
          setBackendError(actionFailure.current)
        })
        .finally(() => {
          if (action.type === 'tick') tickPending.current = false
        })
    },
    [apply, detach],
  )
  const runActions = useCallback(async (actions: Action[]): Promise<AppState> => {
    await queue.current
    for (const action of actions) {
      dispatch(action)
      await queue.current
      if (actionFailure.current) throw new Error(actionFailure.current)
      if (stateRef.current?.notice?.tone === 'err') throw new Error(stateRef.current.notice.text)
    }
    if (!stateRef.current) throw new Error('Simulation unavailable')
    return stateRef.current
  }, [dispatch])
  const signature = useRef('')
  const saveGeneration = useRef(0)

  useEffect(() => {
    let active = true
    async function initialize() {
      const fallback = () => createInitialState('gradual-fatigue')
      let initial: AppState = fallback()
      try {
        const loaded = await Promise.race([
          loadState(),
          new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2500)),
        ])
        if (loaded) initial = loaded
      } catch {
        initial = fallback()
        /* Sin banner visual: se continúa con demo sin interrumpir la maqueta HELIOS. */
        if (active) setPersistenceError(null)
      }
      // Sesiones antiguas quedaban en pausa: las métricas no avanzaban. Arrancar vivo.
      if (!initial.clock.running || initial.clock.speed < 2) {
        initial = {
          ...initial,
          clock: {
            ...initial.clock,
            running: true,
            speed: initial.clock.speed < 2 ? 10 : initial.clock.speed,
          },
        }
      }
      if (!active) return
      let sessionId: string = crypto.randomUUID()
      try {
        sessionId = sessionStorage.getItem('vitalink-simulation-id') ?? sessionId
        sessionStorage.setItem('vitalink-simulation-id', sessionId)
      } catch {
        /* El backend mantiene la sesión durante esta carga. */
      }
      const api = new SimulationClient(sessionId)
      client.current = api
      try {
        const snapshot = await api.connect(initial)
        if (!active) return
        connected.current = true
        setBackendMode('connected')
        apply(snapshot.state)
      } catch (error) {
        if (!active) return
        detach()
        setBackendError(error instanceof ApiError && error.status === 429
          ? `NestJS: HTTP 429. Retry after ${error.retryAfterSeconds ?? 60}s. / Reintenta en ${error.retryAfterSeconds ?? 60}s.`
          : null)
        apply(initial)
      }
      ready.current = true
    }
    void initialize()
    return () => {
      active = false
    }
  }, [apply, detach])

  useEffect(() => {
    if (!state || !ready.current || persistenceError) return
    const nextSignature = [
      state.symptoms.length,
      state.alerts.length,
      state.communications.length,
      state.movements.length,
      state.analyses.length,
      state.chats.length,
      state.notice?.text ?? '',
    ].join('|')
    const userWrite = signature.current !== '' && signature.current !== nextSignature
    signature.current = nextSignature
    const mine = saveGeneration.current + 1
    saveGeneration.current = mine
    if (userWrite) setSaving(true)
    const handle = window.setTimeout(() => {
      saveState(state)
        .catch(() => {
          setPersistenceError('No se pudo guardar en este navegador. Los cambios pueden perderse al recargar.')
        })
        .finally(() => {
          if (saveGeneration.current === mine) setSaving(false)
        })
    }, 350)
    return () => window.clearTimeout(handle)
  }, [state, persistenceError])

  useEffect(() => {
    if (!state?.clock.running) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const delta = now - last
      last = now
      dispatch({ type: 'tick', realDeltaMs: Math.min(delta, 300000) })
    }, 1000)
    return () => window.clearInterval(id)
  }, [state?.clock.running, dispatch])

  const analyzeEpisode = useCallback(async (episodeId: string, question = 'resumen'): Promise<AnalysisResult> => {
    await queue.current
    if (connected.current && client.current) return client.current.analysis(episodeId, question)
    const current = stateRef.current
    const result = current ? answerLocal(current, episodeId, question) : null
    if (!result) throw new Error('Episodio no disponible')
    return result
  }, [])

  const monitoringLatest = useCallback(async (crewId: CrewId, kind: string) => {
    if (!connected.current || !client.current) return null
    try {
      const data = await client.current.monitoringLatest(crewId, kind)
      return { measurement: data.measurement, comparison: data.comparison }
    } catch {
      return null
    }
  }, [])

  const listHistoryEvents = useCallback(async (filters?: { crewId?: string; type?: string }) => {
    if (!connected.current || !client.current) return null
    try {
      const data = await client.current.listHistory(filters)
      return data.events
    } catch {
      return null
    }
  }, [])

  const value = useMemo<StoreValue | null>(() => {
    if (!state) return null
    return {
      state,
      backendMode,
      backendError,
      persistenceError,
      saving,
      authenticatedCrewId,
      dispatch,
      analyzeEpisode,
      monitoringLatest,
      listHistoryEvents,
      runActions,
      unlockSpace: (crewId) => {
        const current = stateRef.current
        if (!current || current.role !== 'astronaut' || current.sessionCrewId !== crewId) return
        setAuthenticatedCrewId(crewId)
      },
      restoreDemo: async () => {
        setAuthenticatedCrewId(null)
        await clearPrivate().catch(() => undefined)
        await clearSpace().catch(() => undefined)
        dispatch({ type: 'restoreDemo' })
        await queue.current
      },
    }
  }, [state, persistenceError, saving, authenticatedCrewId, backendMode, backendError, dispatch, analyzeEpisode, monitoringLatest, listHistoryEvents, runActions])

  if (!value) {
    return (
      <div className="boot">
        <p className="sim-pill">Simulación · datos ficticios</p>
        <h1 className="sr-only">HELIOS</h1>
        <HeliosLogo variant="wordmark" />
        <p className="tagline">Health evaluation &amp; Life indicators observation system</p>
        <p>Cargando registros locales…</p>
        <div className="skeleton-grid" aria-hidden="true">
          <span className="skeleton" style={{ height: 72 }} />
          <span className="skeleton" />
          <span className="skeleton" />
        </div>
      </div>
    )
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useApp(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useApp fuera del proveedor')
  return value
}
