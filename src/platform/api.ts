import { apiUrl } from '../api/baseUrl'
import { uiLang } from '../locale'
import { getActiveMissionId, getSessionToken } from './session'

function connectionMessage() {
  return uiLang() === 'en'
    ? "This couldn't load right now. Try again in a moment."
    : 'No se pudo cargar ahora. Probá de nuevo en un momento.'
}

function errorMessage(status: number, data: unknown) {
  const record = data && typeof data === 'object' ? data as { message?: unknown } : {}
  const raw = typeof record.message === 'string'
    ? record.message
    : Array.isArray(record.message)
      ? record.message.filter((item): item is string => typeof item === 'string').join(', ')
      : ''
  if (status >= 500 || /^error\s+\d+$/i.test(raw) || /bad gateway|service unavailable/i.test(raw)) {
    return connectionMessage()
  }
  return raw || connectionMessage()
}
import { careConversationSchema, careDraftSchema, type CareAiOptions } from '../../shared/careSchema'

async function platformFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getSessionToken()
  if (token) headers.set('X-Helios-Session', token)
  const missionId = getActiveMissionId()
  if (missionId) headers.set('X-Helios-Mission', missionId)
  let response: Response
  try {
    response = await fetch(apiUrl(path), { ...init, headers })
  } catch {
    throw new Error(connectionMessage())
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(errorMessage(response.status, data))
  return data as T
}

export const platformApi = {
  profiles: () => platformFetch<{ profiles: Profile[] }>('/api/platform/profiles'),
  select: (profileId: string) =>
    platformFetch<{ token: string; profile: Profile; expiresAt: number }>('/api/platform/auth/select', {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    }),
  me: () => platformFetch<{ profile: Profile }>('/api/platform/me'),
  missions: () => platformFetch<{ items: MissionRow[] }>('/api/platform/missions'),
  mission: (id: string) => platformFetch<MissionDetail>(`/api/platform/missions/${id}`),
  createMission: (body: Record<string, unknown>) =>
    platformFetch<MissionDetail>('/api/platform/missions', { method: 'POST', body: JSON.stringify(body) }),
  join: (code: string, role?: string) =>
    platformFetch<{ missionId: string; membershipId?: string; status: string; note?: string }>('/api/platform/missions/join', {
      method: 'POST',
      body: JSON.stringify({ code, role }),
    }),
  decideJoin: (missionId: string, membershipId: string, accept: boolean) =>
    platformFetch<MissionDetail>(`/api/platform/missions/${missionId}/join-decide`, {
      method: 'POST',
      body: JSON.stringify({ membershipId, accept }),
    }),
  startMission: (missionId: string, confirm = true) =>
    platformFetch<MissionDetail & { evaluation?: unknown }>(`/api/platform/missions/${missionId}/start`, {
      method: 'POST',
      body: JSON.stringify({ confirm }),
    }),
  startCheck: (missionId: string) =>
    platformFetch<{
      ok: boolean
      percent: number
      analysisStale?: boolean
      blockers: string[]
      criticalPending: string[]
      activeMembers: number
      plannedCrewCount: number
      disclaimer: string
    }>(`/api/platform/missions/${missionId}/start-check`),
  updateDraft: (id: string, body: Record<string, unknown>) =>
    platformFetch<MissionDetail>(`/api/platform/missions/${id}/draft`, { method: 'POST', body: JSON.stringify(body) }),
  prep: (id: string) => platformFetch<{ items: PrepItem[]; percent: number; canStart: boolean }>(`/api/platform/missions/${id}/prep`),
  upsertPrep: (id: string, body: Record<string, unknown>) =>
    platformFetch<{ items: PrepItem[]; percent: number }>(`/api/platform/missions/${id}/prep`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  suggestPrep: (id: string) =>
    platformFetch<{
      suggestions: PrepSuggestion[]
      note: string
      warning?: string
      rosterLocked?: boolean
      stage?: string
    }>(`/api/platform/missions/${id}/prep/suggest`, { method: 'POST', body: '{}' }),
  commitAiPrep: (id: string, titles?: string[]) =>
    platformFetch<{
      items: PrepItem[]
      percent: number
      canStart: boolean
      mission: Mission
      note: string
      warning: string
      locked: boolean
    }>(`/api/platform/missions/${id}/prep/commit-ai`, {
      method: 'POST',
      body: JSON.stringify({ titles }),
    }),
  start: (id: string) =>
    platformFetch<MissionDetail & { evaluation: StartCheck }>(`/api/platform/missions/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    }),
  setStage: (id: string, stage: string) =>
    platformFetch<MissionDetail>(`/api/platform/missions/${id}/stage`, { method: 'POST', body: JSON.stringify({ stage }) }),
  wake: (id: string, justWoke?: boolean) =>
    platformFetch<{ check: WakeCheck; note: string }>(`/api/platform/missions/${id}/wake${justWoke ? '?justWoke=1' : ''}`),
  completeWake: (id: string, payload: Record<string, unknown>) =>
    platformFetch(`/api/platform/missions/${id}/wake`, { method: 'POST', body: JSON.stringify(payload) }),
  wakeCrew: (id: string) =>
    platformFetch<{
      periodKey: string
      items: Array<{
        profileId: string
        displayName: string
        role: string
        status: string
        payload: Record<string, unknown>
        updatedAt: number | null
      }>
    }>(`/api/platform/missions/${id}/wake/crew`),
  addSleep: (id: string, body: { startAt: number; endAt: number; quality?: number; kind?: string }) =>
    platformFetch(`/api/platform/missions/${id}/sleep`, { method: 'POST', body: JSON.stringify(body) }),
  listSleep: (id: string, subjectId?: string) =>
    platformFetch<{ items: unknown[] }>(
      `/api/platform/missions/${id}/sleep${subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`,
    ),
  addSymptom: (id: string, body: Record<string, unknown>) =>
    platformFetch(`/api/platform/missions/${id}/symptoms`, { method: 'POST', body: JSON.stringify(body) }),
  listSymptoms: (id: string, subjectId?: string) =>
    platformFetch<{ items: unknown[] }>(
      `/api/platform/missions/${id}/symptoms${subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`,
    ),
  listIndicators: (id: string, opts?: { subjectId?: string; kind?: string }) => {
    const params = new URLSearchParams()
    if (opts?.subjectId) params.set('subjectId', opts.subjectId)
    if (opts?.kind) params.set('kind', opts.kind)
    const q = params.toString()
    return platformFetch<{ items: HealthIndicatorReading[] }>(
      `/api/platform/missions/${id}/indicators${q ? `?${q}` : ''}`,
    )
  },
  addIndicator: (
    id: string,
    body: {
      kind: IndicatorKind
      value: number
      valueSecondary?: number | null
      measuredAt?: number
      unit?: string
      origin?: HealthIndicatorReading['origin']
      context?: string
      quality?: HealthIndicatorReading['quality']
      notes?: string
      bodyRegion?: string | null
    },
  ) =>
    platformFetch<HealthIndicatorReading>(`/api/platform/missions/${id}/indicators`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  grants: (id: string) => platformFetch<{ items: unknown[]; chief: { sharesWithChief: string[]; neverAutoShared: string[]; note: string } }>(`/api/platform/missions/${id}/grants`),
  grant: (id: string, body: Record<string, unknown>) =>
    platformFetch(`/api/platform/missions/${id}/grants`, { method: 'POST', body: JSON.stringify(body) }),
  revokeGrant: (grantId: string) => platformFetch(`/api/platform/grants/${grantId}/revoke`, { method: 'POST', body: '{}' }),
  quironStart: (id: string, mode: 'physical' | 'emotional', locale: 'es' | 'en' = 'en') =>
    platformFetch(`/api/platform/missions/${id}/quiron`, { method: 'POST', body: JSON.stringify({ mode, locale }) }),
  quironMessage: async (conversationId: string, text: string, locale: 'es' | 'en' = 'en', ai?: CareAiOptions, signal?: AbortSignal) =>
    careConversationSchema.parse(await platformFetch(`/api/platform/quiron/${conversationId}/message`, {
      method: 'POST', body: JSON.stringify({ text, locale, ai }), signal,
    })),
  quironDraft: async (conversationId: string, locale: 'es' | 'en', ai: CareAiOptions, signal?: AbortSignal) =>
    careDraftSchema.parse(await platformFetch(`/api/platform/quiron/${conversationId}/summary/draft`, {
      method: 'POST', body: JSON.stringify({ locale, ai }), signal,
    })),
  quironSummary: (conversationId: string, body: string, shareWith: string | null, expectedMessages?: number) =>
    platformFetch(`/api/platform/quiron/${conversationId}/summary`, {
      method: 'POST',
      body: JSON.stringify({ body, shareWith, expectedMessages }),
    }),
  urgent: (id: string) => platformFetch(`/api/platform/missions/${id}/urgent`, { method: 'POST', body: '{}' }),
  quironSummaries: (missionId: string) => platformFetch<{ items: Array<{ id: string; body: string; profileId: string; mode: string; createdAt: number }> }>(`/api/platform/missions/${missionId}/quiron-summaries`),
  appointments: (id: string) => platformFetch<{ items: unknown[] }>(`/api/platform/missions/${id}/appointments`),
  requestAppointment: (id: string, body: Record<string, unknown>) =>
    platformFetch(`/api/platform/missions/${id}/appointments`, { method: 'POST', body: JSON.stringify(body) }),
  confirmAppointment: (appointmentId: string, accept: boolean) =>
    platformFetch(`/api/platform/appointments/${appointmentId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ accept }),
    }),
  evidence: () => platformFetch<{ items: Evidence[] }>('/api/platform/evidence'),
  storageStatus: () =>
    platformFetch<{
      driver: 'json' | 'supabase'
      revision: number
      remoteError: string | null
      recovery: { at: number; file: string; reason: string } | null
      damaged: string[]
    }>('/api/platform/storage'),
  restoreStorage: (file: string) =>
    platformFetch<{ damaged: string[] }>('/api/platform/storage/restore', {
      method: 'POST',
      body: JSON.stringify({ file }),
    }),
}

export type Profile = {
  id: string
  displayName: string
  title: string
  demoRole: string
  avatarKey: string | null
}

export type MissionEnvironment = 'spacecraft' | 'space_station' | 'rover' | 'surface_base' | 'training'

export type Mission = {
  id: string
  code: string
  name: string
  destination: string
  environment?: MissionEnvironment
  stage: string
  plannedStart: string | null
  durationDays: number
  plannedCrewCount: number
  timezone: string
  activities: string[]
  commsNotes: string
  storageNotes: string
  prepPercent: number
  rosterLocked?: boolean
  analysisStale?: boolean
  createdBy: string
}

export type IndicatorKind =
  | 'heart_rate'
  | 'blood_pressure'
  | 'spo2'
  | 'glucose'
  | 'temperature'
  | 'respiratory_rate'
  | 'sleep_hours'
  | 'mood'

export type HealthIndicatorReading = {
  id: string
  missionId: string
  profileId: string
  kind: IndicatorKind
  measuredAt: number
  value: number
  valueSecondary: number | null
  unit: string
  origin: 'manual' | 'sensor' | 'import' | 'simulation'
  context: string
  quality: 'good' | 'fair' | 'poor' | 'unknown'
  staleAfterMs: number
  notes: string
  bodyRegion: string | null
  createdAt: number
}

export type MissionRow = {
  mission: Mission
  membership: { id: string; role: string; status: string }
}

export type MissionDetail = {
  mission: Mission
  members: { id: string; profileId: string; role: string; status: string }[]
  prepItems: PrepItem[]
  prepPercent: number
}

export type PrepItem = {
  id: string
  category: string
  title: string
  description: string
  source: string
  critical: boolean
  status: string
  applies: boolean
  qtyRequired: number | null
  qtyAvailable: number | null
  evidence: string
}

export type PrepSuggestion = {
  key?: string
  title: string
  category: string
  reason: string
  source: string
  qty: number | null
  qtyLabel?: string | null
  critical?: boolean
  assumptions: string
}

export type StartCheck = {
  ok: boolean
  percent: number
  blockers: string[]
  disclaimer: string
}

export type WakeCheck = {
  id: string
  status: string
  periodKey: string
  payload: Record<string, unknown>
}

export type Evidence = {
  id: string
  title: string
  institution: string
  url: string
  kind: string
  notes: string
}
