import { z } from 'zod'

/** Same contract in NestJS. Text/history are untrusted and never grant access. */
export const dialogueHistorySchema = z.array(z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000),
}).strict()).max(12).refine(
  (messages) => new TextEncoder().encode(JSON.stringify(messages)).byteLength <= 12000,
  'History exceeds UTF-8 budget',
)
export const dialogueRequestSchema = z.object({
  mode: z.enum(['public', 'dashboard']),
  question: z.string().trim().min(1).max(2000),
  locale: z.enum(['es', 'en']),
  modelConsent: z.literal(true),
  historyConsent: z.boolean(),
  dataConsent: z.boolean().default(false),
  history: dialogueHistorySchema.default([]),
  contextKey: z.string().max(500).optional(),
}).strict().refine((q) => q.historyConsent || !q.history.length, 'History consent required')
  .refine((q) => q.mode !== 'public' || (!q.dataConsent && !q.contextKey), 'Public context only')

export const dialogueReplySchema = z.object({
  text: z.string().trim().min(1).max(2000),
  referenceIds: z.array(z.string().min(1).max(100)).max(8),
}).strict()
export const dialogueResponseSchema = z.object({
  source: z.literal('model'),
  model: z.string().min(1).max(120),
  result: z.object({ text: z.string().min(1).max(2000), sources: z.array(z.string().max(200)).max(8) }).strict(),
}).strict()
export type DialogueRequest = z.infer<typeof dialogueRequestSchema>
export type DialogueHistory = z.infer<typeof dialogueHistorySchema>

export function dialogueContextKey(state: {
  mission: { id: string; stage: string }; role: string; sessionCrewId: string
  selectedCrewId: string; selectedEpisodeId: string | null
}) {
  return [state.mission.id, state.mission.stage, state.role, state.sessionCrewId,
    state.selectedCrewId, state.selectedEpisodeId ?? ''].join(':')
}

/** Curated public facts. No session data or private records belong here. */
export const QUIRON_PUBLIC_FACTS = [
  { id: 'helios', label: 'HELIOS · proyecto', data: 'HELIOS means Health Evaluation & Life Indicators Observation System. Independent fictional space-health prototype, not operated or endorsed by NASA. Mission stages: Preflight, In Flight, and Completed.' },
  { id: 'features', label: 'HELIOS · funciones', data: 'The dashboard demonstrates monitoring, alerts, sensor quality, communications and resource inventory. The deterministic engine evaluates simulated measurements. Quiron explains; people decide and explicitly perform actions.' },
  { id: 'privacy', label: 'HELIOS · privacidad', data: 'Public chat cannot access crew records. Mi espacio is a separate PIN-unlocked simulated astronaut session with explicit consent for model, history and each data category. Sharing requires a separate explicit action. Ops has no personal clinical data in this chat.' },
  { id: 'science', label: 'HELIOS · fuentes NASA', data: 'NASA DONKI covers space-weather events, OSDR public research datasets, RadLab radiation research. They are scientific/environmental context, not live astronaut medical readings. Chat has no live NASA lookup tool; never claim to have just fetched NASA data.' },
  { id: 'space-medicine', label: 'HELIOS · contexto médico espacial', data: 'Educational context only, not diagnosis or treatment. NASA Human Research Program five hazards: radiation, isolation/confinement, distance from Earth, gravity fields, hostile/closed environment. Related patterns crews discuss: fluid shift and vision changes, bone and muscle loss, cardiovascular deconditioning, sleep loss, behavioral health, immune changes, and delayed medical care. HELIOS may explain these ideas and point to public sources. It must not invent personal dose, a diagnosis, or a prescription. Red flags (trouble breathing, chest pain, fainting, severe bleeding, suicidal thoughts) need a human now. Sources: https://www.nasa.gov/hrp/hazards/ · https://www.nasa.gov/hrp/risks/ · https://humanresearchroadmap.nasa.gov/Evidence/ · https://www.nasa.gov/reference/6-0-medical-operations/ · https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/ · https://science.nasa.gov/biological-physical/data/ · https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp' },
  { id: 'navigation', label: 'HELIOS · navegación', data: 'Public navigation: Home, Project, How it works, About us, Video, Documents, Data. Enter the system opens the demo dashboard. Mi espacio belongs to the astronaut role. Demo walkthrough has seven steps. Earth link states up, delayed, down are simulated.' },
] as const
