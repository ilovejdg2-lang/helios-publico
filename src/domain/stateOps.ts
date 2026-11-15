import type { AppState, AuditEvent, Notice, Role } from '../../shared/types'

export function nextSeq(state: AppState): { state: AppState; seq: number } {
  const seq = state.seq + 1
  return { state: { ...state, seq }, seq }
}

export function addAudit(
  state: AppState,
  input: { actor: Role; action: string; entityId: string; detail: string },
): AppState {
  const bumped = nextSeq(state)
  const event: AuditEvent = {
    id: `aud-${bumped.seq}`,
    seq: bumped.seq,
    at: state.clock.simulatedAt,
    actor: input.actor,
    action: input.action,
    entityId: input.entityId,
    detail: input.detail,
  }
  return { ...bumped.state, audit: [...state.audit, event] }
}

export function withNotice(state: AppState, tone: Notice['tone'], text: string): AppState {
  return { ...state, notice: { tone, text } }
}

export function rememberKey(state: AppState, key: string): AppState {
  const keys = state.idempotencyKeys.length > 180 ? state.idempotencyKeys.slice(-180) : state.idempotencyKeys
  return { ...state, idempotencyKeys: [...keys, key] }
}

export function hasKey(state: AppState, key: string): boolean {
  return state.idempotencyKeys.includes(key)
}
