import type { SimClock } from '../../shared/types'

export function advanceClock(clock: SimClock, realDeltaMs: number): SimClock {
  if (!clock.running || realDeltaMs <= 0) return clock
  return { ...clock, simulatedAt: clock.simulatedAt + realDeltaMs * clock.speed }
}
