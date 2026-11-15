import { describe, expect, it } from 'vitest'
import { grantToSubject, isActiveGrant } from './grants'

describe('platform grants', () => {
  it('treats revokedAt as inactive (Nest shape)', () => {
    expect(isActiveGrant({ revokedAt: null })).toBe(true)
    expect(isActiveGrant({ revokedAt: Date.now() })).toBe(false)
  })

  it('matches subject → grantee only when active', () => {
    const grants = [
      { subjectProfileId: 'mateo-ruiz', granteeProfileId: 'sofia-chen', revokedAt: null },
      { subjectProfileId: 'mateo-ruiz', granteeProfileId: 'sofia-chen', revokedAt: 1 },
    ]
    expect(grantToSubject(grants, 'mateo-ruiz', 'sofia-chen')).toBe(true)
    expect(grantToSubject(grants, 'mateo-ruiz', 'alex-morgan')).toBe(false)
  })
})
