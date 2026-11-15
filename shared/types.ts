export const STATE_VERSION = 3 as const

export const MISSION_STAGES = ['preembarque', 'a_bordo', 'posmision'] as const
export type MissionStage = (typeof MISSION_STAGES)[number]

export const PREP_STATUSES = [
  'propuesto',
  'pendiente_revision',
  'aprobado',
  'disponible',
  'faltante',
  'cargado_verificado',
] as const
export type PrepStatus = (typeof PREP_STATUSES)[number]

export interface Mission {
  id: string
  name: string
  stage: MissionStage
  destination: string
  durationDays: number
  crewCount: number
  activities: string[]
  openedAt: number
  stageChangedAt: number
}

export interface PrepItem {
  id: string
  title: string
  category: 'entrenamiento' | 'planificacion' | 'equipo' | 'suministro' | 'habitat' | 'proteccion'
  status: PrepStatus
  riskIds: string[]
  resourceId: string | null
  note: string
  updatedAt: number
}

export const CREW_IDS = ['elena-torres', 'mateo-ruiz', 'sofia-chen', 'alex-morgan'] as const
export type CrewId = (typeof CREW_IDS)[number]

export const SCENARIO_IDS = [
  'baseline',
  'gradual-fatigue',
  'frozen-sensor',
  'missing-data',
  'repeated-message',
  'altered-message',
  'link-down',
  'stale-normal',
  'unwell-normal',
  'pulse-escalation',
] as const
export type ScenarioId = (typeof SCENARIO_IDS)[number]

export type Speed = 1 | 2 | 5 | 10
export type LinkStatus = 'up' | 'delayed' | 'down'
export type Role = 'medical' | 'astronaut' | 'ops'

export type MeasurementKind =
  | 'heart_rate'
  | 'spo2'
  | 'temperature'
  | 'sleep_hours'
  | 'respiratory_rate'

export type Unit = 'lpm' | '%' | '°C' | 'h' | 'rpm'
export type Integrity = 'valid' | 'pending' | 'stale'
export type MeasurementContext = 'routine' | 'rest-control' | 'manual-repeat' | 'exercise'
export type MeasurementOrigin = 'link' | 'local'

export interface Measurement {
  id: string
  messageId: string
  sequence: number
  crewId: CrewId
  sensorId: string
  kind: MeasurementKind
  value: number
  unit: Unit
  measuredAt: number
  receivedAt: number
  signalQuality: number
  integrity: Integrity
  context: MeasurementContext
  origin: MeasurementOrigin
  mac: string | null
  macValid: boolean | null
}

export interface SymptomReport {
  id: string
  crewId: CrewId
  symptoms: string[]
  note: string
  reportedAt: number
  episodeId: string
}

export type AlertType = 'change' | 'symptom' | 'missing' | 'quality' | 'repeated' | 'altered' | 'comms'
export type AlertStatus = 'active' | 'following' | 'closed'

export interface Alert {
  id: string
  type: AlertType
  status: AlertStatus
  crewId: CrewId | null
  sensorId: string | null
  episodeId: string | null
  title: string
  reason: string
  openedAt: number
  updatedAt: number
  astronautAck: boolean
  source: 'simulation' | 'user' | 'system'
}

export type EpisodeStatus = 'open' | 'following' | 'closed'

export interface Episode {
  id: string
  crewId: CrewId
  title: string
  status: EpisodeStatus
  openedAt: number
  symptomIds: string[]
  alertIds: string[]
  measurementIds: string[]
}

export type ResourceKind = 'reusable' | 'consumable'
export type ResourceCategory = 'equipment' | 'supply'
export type ResourceStatus = 'ready' | 'review'

export interface Resource {
  id: string
  name: string
  kind: ResourceKind
  category: ResourceCategory
  quantity: number
  unitLabel: string
  location: string
  status: ResourceStatus
  lastReviewAt: number
  useCount: number
}

export type MovementType = 'use' | 'restock' | 'adjust' | 'create' | 'edit'

export interface InventoryMovement {
  id: string
  resourceId: string
  type: MovementType
  quantityDelta: number
  quantityAfter: number
  at: number
  idempotencyKey: string
  note: string
  actor: Role
}

export interface EvidenceRef {
  statement: string
  refType: 'measurement' | 'symptom' | 'alert' | 'protocol'
  refId: string
}

export interface ProposedCheck {
  title: string
  protocolId: string
  why: string
}

export interface RelatedResource {
  resourceId: string
  note: string
}

export interface AnalysisResult {
  summary: string
  evidence: EvidenceRef[]
  missing: string[]
  questions: string[]
  checks: ProposedCheck[]
  resources: RelatedResource[]
  humanReviewRequired: true
  limitations: string[]
  sources: string[]
}

export type AnalysisSource = 'local_engine' | 'model'

export interface AnalysisSnapshot {
  measurementIds: string[]
  symptomIds: string[]
  resourceIds: string[]
  alertIds: string[]
  protocolIds: string[]
}

export interface AnalysisRecord {
  id: string
  episodeId: string
  crewId: CrewId
  source: AnalysisSource
  createdAt: number
  model: string | null
  fingerprint: string
  snapshot: AnalysisSnapshot
  result: AnalysisResult
}

export interface ChatMessage {
  id: string
  episodeId: string
  role: 'user' | 'assistant'
  text: string
  source: 'user' | 'model' | 'local_engine' | 'error'
  at: number
  idempotencyKey: string
  result: AnalysisResult | null
}

export type CommStatus = 'draft' | 'queued' | 'sent' | 'received'

export interface Communication {
  id: string
  crewId: CrewId
  episodeId: string | null
  status: CommStatus
  subject: string
  body: string
  sequence: number
  createdAt: number
  queuedAt: number | null
  sentAt: number | null
  receivedAt: number | null
  idempotencyKey: string
  actor: Role
}

export interface AuditEvent {
  id: string
  seq: number
  at: number
  actor: Role
  action: string
  entityId: string
  detail: string
}

export interface RejectedPacket {
  id: string
  messageId: string
  reason: 'duplicate' | 'altered' | 'out_of_order'
  at: number
  claimedValue: number | null
  sensorId: string | null
  detail: string
}

export type SharedRequestLevel = 'generica' | 'medico' | 'equipo'

export interface SpaceRequest {
  id: string
  crewId: CrewId
  level: SharedRequestLevel
  line: string
  sentAt: number
}

export interface Notice {
  tone: 'ok' | 'warn' | 'err'
  text: string
}

export interface SimClock {
  running: boolean
  speed: Speed
  originAt: number
  simulatedAt: number
}

export interface AppState {
  stateVersion: typeof STATE_VERSION
  scenarioId: ScenarioId
  seed: number
  clock: SimClock
  link: LinkStatus
  linkDelayMin: number
  role: Role
  sessionCrewId: CrewId
  selectedCrewId: CrewId
  selectedEpisodeId: string | null
  mission: Mission
  prepItems: PrepItem[]
  measurements: Measurement[]
  symptoms: SymptomReport[]
  alerts: Alert[]
  episodes: Episode[]
  resources: Resource[]
  movements: InventoryMovement[]
  communications: Communication[]
  spaceRequests: SpaceRequest[]
  analyses: AnalysisRecord[]
  chats: ChatMessage[]
  audit: AuditEvent[]
  rejected: RejectedPacket[]
  seenMessageIds: string[]
  lastInboundSequence: number
  idempotencyKeys: string[]
  seq: number
  notice: Notice | null
  soundEnabled: boolean
}

export interface LinkPacket {
  messageId: string
  sequence: number
  crewId: CrewId
  sensorId: string
  kind: MeasurementKind
  value: number
  unit: Unit
  measuredAt: number
  receivedAt: number
  signalQuality: number
  context: MeasurementContext
  mac: string
}

export const UNIT_BY_KIND: Record<MeasurementKind, Unit> = {
  heart_rate: 'lpm',
  spo2: '%',
  temperature: '°C',
  sleep_hours: 'h',
  respiratory_rate: 'rpm',
}

export const KIND_LABEL: Record<MeasurementKind, string> = {
  heart_rate: 'Frecuencia cardíaca',
  spo2: 'SpO₂',
  temperature: 'Temperatura',
  sleep_hours: 'Descanso',
  respiratory_rate: 'Frecuencia respiratoria',
}
