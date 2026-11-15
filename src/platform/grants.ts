/** Active platform health grant (Nest uses revokedAt; never invent a "status" field). */
export type PlatformGrant = {
  id?: string
  subjectProfileId?: string
  granteeProfileId?: string
  categories?: string[]
  scopeNote?: string
  revokedAt?: number | null
  expiresAt?: number | null
}

export function isActiveGrant(row: PlatformGrant | unknown): boolean {
  const g = row as PlatformGrant
  if (!g || typeof g !== 'object') return false
  if (g.revokedAt != null) return false
  if (g.expiresAt != null && g.expiresAt < Date.now()) return false
  return true
}

export function grantToSubject(
  grants: unknown[],
  subjectProfileId: string,
  granteeProfileId: string | undefined,
): boolean {
  if (!granteeProfileId) return false
  return grants.some((g) => {
    const row = g as PlatformGrant
    return (
      isActiveGrant(row) &&
      row.subjectProfileId === subjectProfileId &&
      row.granteeProfileId === granteeProfileId
    )
  })
}
