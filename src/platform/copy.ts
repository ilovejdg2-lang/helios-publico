export function roleLabel(role: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    chief: ['Mission Commander', 'Comandante de misión'],
    crew: ['Crew Member', 'Tripulante'],
    medic: ['Physician', 'Médico'],
    psychologist: ['Psychologist', 'Psicólogo'],
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
    'elena-torres': ['Mission Commander (demo)', 'Comandante de misión (demo)'],
    'mateo-ruiz': ['Crew Member (demo)', 'Tripulante (demo)'],
    'sofia-chen': ['Physician (demo)', 'Médica (demo)'],
    'alex-morgan': ['Psychologist (demo)', 'Psicólogo (demo)'],
    'ops-desk': ['Operations / prep (demo)', 'Operaciones / preparación (demo)'],
  }
  const pair = byId[profile.id]
  if (pair) return en ? pair[0] : pair[1]
  return profile.title
}

export function stageLabel(stage: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ['Draft', 'Borrador'],
    preflight: ['Preflight', 'Preembarque'],
    aboard: ['In Flight', 'A bordo'],
    postmission: ['Completed', 'Finalizada'],
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
    preflight: ['Preflight: crew, resources, and the Preparation Checklist.', 'Preembarque: tripulación, recursos y lista de preparación.'],
    aboard: ['In Flight: the mission is underway.', 'A bordo: la misión está en curso.'],
    postmission: ['Completed: history, analysis, and recommendations.', 'Finalizada: historial, análisis y recomendaciones.'],
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