import { stateSchema } from '../../shared/stateSchema'
import type { AppState } from '../../shared/types'

export function isAppState(value: unknown): value is AppState {
  return stateSchema.safeParse(value).success
}
