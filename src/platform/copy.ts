export function roleLabel(role: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    chief: ['Chief', 'Jefe'],
    crew: ['Crew member', 'Tripulante'],
    medic: ['Medic (simulated)', 'Médico (simulado)'],
    psychologist: ['Psychologist (simulated)', 'Psicólogo (simulado)'],
    ops: ['Operations', 'Operaciones'],
  }
  const pair = map[role]
  if (!pair) return role
  return en ? pair[0] : pair[1]
}

const PROFILE_NAMES: Record<string, string> = {
  'elena-torres': 'Elena Torres',
  'mateo-ruiz': 'Mateo Ruiz',
  'sofia-chen': 'Sofía Chen',
  'alex-morgan': 'Alex Morgan',
  'ops-desk': 'Mesa Ops',
}

export function profileDisplayName(profileId: string): string {
  return PROFILE_NAMES[profileId] || profileId
}

export function profileTitle(profile: { id: string; title: string }, en: boolean): string {
  const byId: Record<string, [string, string]> = {
    'elena-torres': ['Mission chief (demo)', 'Jefa de misión (demo)'],
    'mateo-ruiz': ['Crew member (demo)', 'Tripulante (demo)'],
    'sofia-chen': ['Simulated medic (demo)', 'Médica simulada (demo)'],
    'alex-morgan': ['Simulated psychologist (demo)', 'Psicólogo simulado (demo)'],
    'ops-desk': ['Operations / prep (demo)', 'Operaciones / preparación (demo)'],
  }
  const pair = byId[profile.id]
  if (pair) return en ? pair[0] : pair[1]
  return profile.title
}

export function stageLabel(stage: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ['Draft', 'Borrador'],
    preflight: ['Pre-flight', 'Preembarque'],
    aboard: ['Aboard', 'A bordo'],
    postmission: ['Post-mission', 'Posmisión'],
    archived: ['Archived', 'Archivada'],
    cancelled: ['Cancelled', 'Cancelada'],
  }
  const pair = map[stage]
  if (!pair) return stage
  return en ? pair[0] : pair[1]
}

export const MISSION_PROCESS_STEPS = ['draft', 'preflight', 'aboard', 'postmission'] as const

export function stageBlurb(stage: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ['Planning the mission size and duration.', 'Definiendo tamaño de tripulación y duración.'],
    preflight: ['Boarding prep: checklist before takeoff.', 'Preembarque: checklist antes de despegar.'],
    aboard: ['Mission underway on board.', 'Misión en curso a bordo.'],
    postmission: ['Return and review.', 'Regreso y revisión.'],
    archived: ['Archived mission.', 'Misión archivada.'],
    cancelled: ['Cancelled mission.', 'Misión cancelada.'],
  }
  const pair = map[stage]
  if (!pair) return stage
  return en ? pair[0] : pair[1]
}

/** Mini hint under each process step in Centro / hub. */
export function stageHint(stage: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ['Set crew size & days', 'Definí personas y días'],
    preflight: ['Analyze & mark checklist', 'Analizá y marcá checklist'],
    aboard: ['Mission in progress', 'Misión en curso'],
    postmission: ['Return & review', 'Regreso y revisión'],
  }
  const pair = map[stage]
  if (!pair) return ''
  return en ? pair[0] : pair[1]
}

export function stageStepIndex(stage: string): number {
  const idx = MISSION_PROCESS_STEPS.indexOf(stage as (typeof MISSION_PROCESS_STEPS)[number])
  return idx >= 0 ? idx : 0
}