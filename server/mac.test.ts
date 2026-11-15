import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { DEMO_MAC_KEY, signPayload, verifyPayload } from '../shared/mac'

describe('HMAC de demostración', () => {
  it('coincide con el HMAC-SHA256 de Node', () => {
    const payload = 'msg|1|sensor|heart_rate|70|1000'
    const expected = createHmac('sha256', DEMO_MAC_KEY).update(payload).digest('hex')
    expect(signPayload(payload)).toBe(expected)
    expect(verifyPayload(payload, expected)).toBe(true)
    expect(verifyPayload(payload, '00')).toBe(false)
  })
})
