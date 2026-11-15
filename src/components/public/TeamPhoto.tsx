import { useState } from 'react'
import type { TeamMember } from '../../content/landing'

export function TeamPhoto({ member, className = '' }: { member: TeamMember; className?: string }) {
  const [failed, setFailed] = useState(!member.photo)

  if (failed) {
    return (
      <div className={`ph ${className}`} aria-hidden="true">
        {member.initials}
      </div>
    )
  }

  return (
    <img
      src={member.photo}
      alt={`Retrato de ${member.name}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
