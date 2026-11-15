import { expect, it } from 'vitest'
import { careMessageSchema, careApprovalSchema, careStartSchema } from './careSchema'

it('keeps old message clients local until they explicitly opt in', () => {
  expect(careMessageSchema.parse({ text: 'Hello' }).ai.modelConsent).toBe(false)
  expect(careStartSchema.parse({ mode: 'emotional', locale: 'en' }).locale).toBe('en')
  expect(careStartSchema.safeParse({ mode: 'other' }).success).toBe(false)
})
it('rejects injected records, other owners and unconsented monitoring', () => {
  expect(careMessageSchema.safeParse({ text: 'Hello', profileId: 'other' }).success).toBe(false)
  expect(careMessageSchema.safeParse({ text: 'Hello', ai: {
    modelConsent: false, dataConsent: false, monitoring: { sessionId: crypto.randomUUID(), token: 'a'.repeat(64) },
  } }).success).toBe(false)
})
it('requires an actual reviewable summary and a nonnegative revision', () => {
  expect(careApprovalSchema.safeParse({ body: '', shareWith: null }).success).toBe(false)
  expect(careApprovalSchema.safeParse({ body: 'Summary', expectedMessages: -1 }).success).toBe(false)
})
