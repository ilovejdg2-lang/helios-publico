import { z } from 'zod'
import { analysisResultSchema } from './aiSchema'
import { CREW_IDS, MISSION_STAGES, PREP_STATUSES, SCENARIO_IDS, UNIT_BY_KIND } from './types'

export const id = z.string().min(1).max(3000)
export const crewId = z.enum(CREW_IDS)
export const kind = z.enum(['heart_rate', 'spo2', 'temperature', 'respiratory_rate', 'sleep_hours'])
const at = z.number().int().nonnegative()
const text = z.string().max(4000)
const role = z.enum(['medical', 'astronaut', 'ops'])
const status = z.enum(['active', 'following', 'closed'])
const commStatus = z.enum(['draft', 'queued', 'sent', 'received'])
const link = z.enum(['up', 'delayed', 'down'])
const resourceKind = z.enum(['reusable', 'consumable'])
const category = z.enum(['equipment', 'supply'])
const resourceStatus = z.enum(['ready', 'review'])
const ids = z.array(id).max(100000)
const quantity = z.number().int().min(0).max(1000000)
const packetFields = {
  messageId: id,
  sequence: z.number().int().positive(),
  crewId,
  sensorId: id,
  kind,
  value: z.number().finite().nonnegative(),
  unit: z.enum(['lpm', '%', '\u00b0C', 'h', 'rpm']),
  measuredAt: at,
  receivedAt: at,
  signalQuality: z.number().min(0).max(100),
  context: z.enum(['routine', 'rest-control', 'manual-repeat', 'exercise']),
}
export const packetSchema = z
  .object({ ...packetFields, mac: z.string().regex(/^[a-f0-9]{64}$/) })
  .strict()
  .refine((p) => p.unit === UNIT_BY_KIND[p.kind], 'Unidad incompatible')
  .refine(
    (p) => (p.kind !== 'spo2' || p.value <= 100) && (p.kind !== 'sleep_hours' || p.value <= 24),
    'Valor incompatible con la unidad',
  )
  .refine((p) => p.receivedAt >= p.measuredAt, 'Recepción anterior a medición')
const measurement = z
  .object({
    ...packetFields,
    id,
    integrity: z.enum(['valid', 'pending', 'stale']),
    origin: z.enum(['link', 'local']),
    mac: z.string().nullable(),
    macValid: z.boolean().nullable(),
  })
  .strict()
  .refine((p) => p.unit === UNIT_BY_KIND[p.kind], 'Unidad incompatible')
const symptom = z
  .object({
    id,
    crewId,
    symptoms: z.array(z.string().min(1).max(80)).max(12),
    note: text,
    reportedAt: at,
    episodeId: id,
  })
  .strict()
const alert = z
  .object({
    id,
    type: z.enum(['change', 'symptom', 'missing', 'quality', 'repeated', 'altered', 'comms']),
    status,
    crewId: crewId.nullable(),
    sensorId: id.nullable(),
    episodeId: id.nullable(),
    title: text,
    reason: text,
    openedAt: at,
    updatedAt: at,
    astronautAck: z.boolean(),
    source: z.enum(['simulation', 'user', 'system']),
  })
  .strict()
const episode = z
  .object({
    id,
    crewId,
    title: text,
    status: z.enum(['open', 'following', 'closed']),
    openedAt: at,
    symptomIds: ids,
    alertIds: ids,
    measurementIds: ids,
  })
  .strict()
const resource = z
  .object({
    id,
    name: z.string().min(2).max(80),
    kind: resourceKind,
    category,
    quantity,
    unitLabel: text,
    location: text,
    status: resourceStatus,
    lastReviewAt: at,
    useCount: quantity,
  })
  .strict()
const communication = z
  .object({
    id,
    crewId,
    episodeId: id.nullable(),
    status: commStatus,
    subject: text,
    body: text,
    sequence: z.number().int().positive(),
    createdAt: at,
    queuedAt: at.nullable(),
    sentAt: at.nullable(),
    receivedAt: at.nullable(),
    idempotencyKey: id,
    actor: role,
  })
  .strict()
const analysis = z
  .object({
    id,
    episodeId: id,
    crewId,
    source: z.enum(['local_engine', 'model']),
    createdAt: at,
    model: text.nullable(),
    fingerprint: id,
    snapshot: z
      .object({
        measurementIds: ids,
        symptomIds: ids,
        resourceIds: ids,
        alertIds: ids,
        protocolIds: ids,
      })
      .strict(),
    result: analysisResultSchema,
  })
  .strict()
const chat = z
  .object({
    id,
    episodeId: id,
    role: z.enum(['user', 'assistant']),
    text: z.string().max(12000),
    source: z.enum(['user', 'model', 'local_engine', 'error']),
    at,
    idempotencyKey: id,
    result: analysisResultSchema.nullable(),
  })
  .strict()
const list = <T extends z.ZodType>(schema: T) => z.array(schema).max(100000)
export const stateSchema = z
  .object({
    stateVersion: z.literal(3),
    scenarioId: z.enum(SCENARIO_IDS),
    seed: z.number().int(),
    clock: z
      .object({
        running: z.boolean(),
        speed: z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(10)]),
        originAt: at,
        simulatedAt: at,
      })
      .strict(),
    link,
    linkDelayMin: z.number().min(0).max(1000),
    role,
    sessionCrewId: crewId,
    selectedCrewId: crewId,
    selectedEpisodeId: id.nullable(),
    mission: z
      .object({
        id,
        name: text,
        stage: z.enum(MISSION_STAGES),
        destination: text,
        durationDays: z.number().int().positive().max(10000),
        crewCount: z.number().int().positive().max(100),
        activities: z.array(z.string().max(200)).max(40),
        openedAt: at,
        stageChangedAt: at,
      })
      .strict(),
    prepItems: list(
      z
        .object({
          id,
          title: text,
          category: z.enum(['entrenamiento', 'planificacion', 'equipo', 'suministro', 'habitat', 'proteccion']),
          status: z.enum(PREP_STATUSES),
          riskIds: z.array(id).max(40),
          resourceId: id.nullable(),
          note: text,
          updatedAt: at,
        })
        .strict(),
    ),
    measurements: list(measurement),
    symptoms: list(symptom),
    alerts: list(alert),
    episodes: list(episode),
    resources: list(resource),
    movements: list(
      z
        .object({
          id,
          resourceId: id,
          type: z.enum(['use', 'restock', 'adjust', 'create', 'edit']),
          quantityDelta: z.number().int(),
          quantityAfter: quantity,
          at,
          idempotencyKey: id,
          note: text,
          actor: role,
        })
        .strict(),
    ),
    communications: list(communication),
    spaceRequests: list(
      z
        .object({
          id,
          crewId,
          level: z.enum(['generica', 'medico', 'equipo']),
          line: text,
          sentAt: at,
        })
        .strict(),
    ).default([]),
    analyses: list(analysis),
    chats: list(chat),
    audit: list(
      z
        .object({
          id,
          seq: z.number().int().nonnegative(),
          at,
          actor: role,
          action: text,
          entityId: id,
          detail: text,
        })
        .strict(),
    ),
    rejected: list(
      z
        .object({
          id,
          messageId: id,
          reason: z.enum(['duplicate', 'altered', 'out_of_order']),
          at,
          claimedValue: z.number().finite().nullable(),
          sensorId: id.nullable(),
          detail: text,
        })
        .strict(),
    ),
    seenMessageIds: ids,
    lastInboundSequence: z.number().int().nonnegative(),
    idempotencyKeys: ids,
    seq: z.number().int().nonnegative(),
    notice: z
      .object({ tone: z.enum(['ok', 'warn', 'err']), text })
      .strict()
      .nullable(),
    soundEnabled: z.boolean(),
  })
  .strict()
