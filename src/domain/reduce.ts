import { uiLang } from '../locale';
import type {
  Alert,
  AlertStatus,
  AnalysisRecord,
  AppState,
  ChatMessage,
  CommStatus,
  Communication,
  CrewId,
  LinkStatus,
  Measurement,
  Resource,
  Role,
  MissionStage,
  PrepStatus,
  ScenarioId,
  SharedRequestLevel,
  SpaceRequest,
  Speed,
} from '../../shared/types';
import { MISSION_STAGE_LABEL } from '../../shared/mission';
import {
  canCloseHealthAlert,
  canManageComms,
  canUseInventory,
  isSensorAlert,
} from './access';
import { crewById } from './crew';
import { ensureAlert } from './messages';
import { openEpisode } from './selectors';
import { MINUTE_MS, MAX_TICK_MINUTES } from './constants';
import { advanceClock } from './clock';
import { planAdjustment, planResourceUse } from './inventory';
import {
  appendLiveSample,
  createInitialState,
  latentHeartRate,
} from './scenarios';
import { addAudit, hasKey, nextSeq, rememberKey, withNotice } from './stateOps';
import { spacePreview } from './spacePreview';
import { registerSymptom } from './symptoms';

export type Action =
  | { type: 'tick'; realDeltaMs: number }
  | { type: 'setRunning'; running: boolean }
  | { type: 'setSpeed'; speed: Speed }
  | { type: 'setScenario'; scenarioId: ScenarioId }
  | { type: 'resetSimulation' }
  | { type: 'restoreDemo' }
  | { type: 'setLink'; link: LinkStatus }
  | { type: 'selectCrew'; crewId: CrewId }
  | { type: 'selectEpisode'; episodeId: string | null }
  | { type: 'setRole'; role: Role; sessionCrewId?: CrewId }
  | { type: 'setSound'; enabled: boolean }
  | { type: 'dismissNotice' }
  | {
      type: 'addSymptom';
      crewId: CrewId;
      symptoms: string[];
      note: string;
      idempotencyKey: string;
    }
  | {
      type: 'repeatMeasurement';
      crewId: CrewId;
      idempotencyKey: string;
      atRest: boolean;
    }
  | { type: 'ackAlert'; alertId: string }
  | { type: 'setAlertStatus'; alertId: string; status: AlertStatus }
  | { type: 'resolveSensorAlert'; alertId: string }
  | {
      type: 'useResource';
      resourceId: string;
      quantity: number;
      idempotencyKey: string;
      note: string;
    }
  | {
      type: 'adjustResource';
      resourceId: string;
      quantity: number;
      idempotencyKey: string;
      note: string;
    }
  | {
      type: 'createResource';
      name: string;
      kind: Resource['kind'];
      category: Resource['category'];
      quantity: number;
      location: string;
      idempotencyKey: string;
    }
  | {
      type: 'updateResource';
      resourceId: string;
      name: string;
      location: string;
      status: Resource['status'];
    }
  | {
      type: 'createCommunication';
      crewId: CrewId;
      episodeId: string | null;
      subject: string;
      body: string;
      idempotencyKey: string;
    }
  | {
      type: 'updateCommunicationDraft';
      id: string;
      subject: string;
      body: string;
    }
  | { type: 'transitionCommunication'; id: string; status: CommStatus }
  | { type: 'deliverQueued' }
  | { type: 'confirmReceived' }
  | { type: 'recordAnalysis'; record: AnalysisRecord; idempotencyKey: string }
  | { type: 'appendChat'; message: ChatMessage }
  | {
      type: 'raiseSpaceAlert';
      crewId: CrewId;
      categories: string[];
      idempotencyKey: string;
    }
  | {
      type: 'sendSpaceRequest';
      crewId: CrewId;
      level: SharedRequestLevel;
      text: string;
      idempotencyKey: string;
    }
  | { type: 'setMissionStage'; stage: MissionStage }
  | { type: 'setPrepStatus'; prepId: string; status: PrepStatus };

const COMM_NEXT: Record<CommStatus, CommStatus | null> = {
  draft: 'queued',
  queued: 'sent',
  sent: 'received',
  received: null,
};

export function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'tick':
      return tick(state, action.realDeltaMs);
    case 'setRunning':
      return {
        ...state,
        clock: { ...state.clock, running: action.running },
        notice: null,
      };
    case 'setSpeed':
      return { ...state, clock: { ...state.clock, speed: action.speed } };
    case 'setScenario':
      return swapScenario(state, action.scenarioId);
    case 'resetSimulation':
      return swapScenario(state, state.scenarioId);
    case 'restoreDemo':
      return {
        ...createInitialState('gradual-fatigue'),
        notice: { tone: 'ok', text: 'Datos de demostración restaurados.' },
      };
    case 'setLink':
      return setLink(state, action.link);
    case 'selectCrew':
      return { ...state, selectedCrewId: action.crewId };
    case 'selectEpisode':
      return { ...state, selectedEpisodeId: action.episodeId };
    case 'setRole':
      return {
        ...state,
        role: action.role,
        sessionCrewId: action.sessionCrewId ?? state.sessionCrewId,
        notice: {
          tone: 'ok',
          text: 'El rol es simulado: el navegador no es una frontera de autorización.',
        },
      };
    case 'setSound':
      return { ...state, soundEnabled: action.enabled };
    case 'dismissNotice':
      return { ...state, notice: null };
    case 'addSymptom':
      return registerSymptom(state, { ...action, enforceRole: true });
    case 'repeatMeasurement':
      return repeatMeasurement(state, action);
    case 'ackAlert':
      return ackAlert(state, action.alertId);
    case 'setAlertStatus':
      return setAlertStatus(state, action.alertId, action.status);
    case 'resolveSensorAlert':
      return resolveSensorAlert(state, action.alertId);
    case 'useResource':
      return registerUse(state, action);
    case 'adjustResource':
      return adjustResource(state, action);
    case 'createResource':
      return createResource(state, action);
    case 'updateResource':
      return updateResource(state, action);
    case 'createCommunication':
      return createCommunication(state, action);
    case 'updateCommunicationDraft':
      return updateCommunicationDraft(state, action);
    case 'transitionCommunication':
      return transitionCommunication(state, action.id, action.status);
    case 'deliverQueued':
      return mapComms(state, 'queued', 'sent');
    case 'confirmReceived':
      return mapComms(state, 'sent', 'received');
    case 'recordAnalysis':
      return recordAnalysis(state, action.record, action.idempotencyKey);
    case 'appendChat':
      return appendChat(state, action.message);
    case 'raiseSpaceAlert':
      return raiseSpaceAlert(state, action);
    case 'sendSpaceRequest':
      return sendSpaceRequest(state, action);
    case 'setMissionStage':
      return setMissionStage(state, action.stage);
    case 'setPrepStatus':
      return setPrepStatus(state, action.prepId, action.status);
    default:
      return state;
  }
}

function tick(state: AppState, realDeltaMs: number): AppState {
  const clock = advanceClock(state.clock, realDeltaMs);
  if (clock.simulatedAt === state.clock.simulatedAt) return state;
  const start = Math.floor(
    (state.clock.simulatedAt - state.clock.originAt) / MINUTE_MS,
  );
  const end = Math.floor(
    (clock.simulatedAt - state.clock.originAt) / MINUTE_MS,
  );
  let next: AppState = { ...state, clock };
  const capped = Math.min(end, start + MAX_TICK_MINUTES);
  for (let minute = start + 1; minute <= capped; minute += 1)
    next = applyMinute(next, minute);
  return next;
}

function applyMinute(state: AppState, minute: number): AppState {
  if (
    state.scenarioId === 'missing-data' ||
    state.scenarioId === 'repeated-message' ||
    state.scenarioId === 'altered-message' ||
    state.scenarioId === 'stale-normal' ||
    state.scenarioId === 'link-down'
  ) {
    return state;
  }
  if (state.scenarioId === 'gradual-fatigue') {
    const value = latentHeartRate(
      state.scenarioId,
      'elena-torres',
      minute,
      state.seed,
    );
    let next = state;
    if (value !== null) {
      next = appendLiveSample(
        next,
        'elena-torres',
        'heart_rate',
        value,
        `live-elena-${minute}`,
      );
    }
    for (const crewId of ['mateo-ruiz', 'sofia-chen', 'alex-morgan'] as const) {
      const hr = latentHeartRate('baseline', crewId, minute, state.seed);
      if (hr === null) continue;
      next = appendLiveSample(next, crewId, 'heart_rate', hr, `live-${crewId}-${minute}`);
    }
    return next;
  }
  if (state.scenarioId === 'frozen-sensor') {
    return appendLiveSample(
      state,
      'elena-torres',
      'heart_rate',
      81,
      `live-frozen-${minute}`,
      90,
      'sensor-03',
    );
  }
  if (state.scenarioId === 'pulse-escalation') {
    const value = latentHeartRate(
      state.scenarioId,
      'elena-torres',
      minute,
      state.seed,
    );
    if (value === null) return state;
    return appendLiveSample(
      state,
      'elena-torres',
      'heart_rate',
      value,
      `live-escalation-${minute}`,
    );
  }
  let next = state;
  for (const crewId of [
    'elena-torres',
    'mateo-ruiz',
    'sofia-chen',
    'alex-morgan',
  ] as const) {
    const value = latentHeartRate('baseline', crewId, minute, state.seed);
    if (value === null) continue;
    next = appendLiveSample(
      next,
      crewId,
      'heart_rate',
      value,
      `live-${crewId}-${minute}`,
    );
  }
  return next;
}

function swapScenario(state: AppState, scenarioId: ScenarioId): AppState {
  const fresh = createInitialState(scenarioId, state.seed);
  return {
    ...fresh,
    role: state.role,
    sessionCrewId: state.sessionCrewId,
    soundEnabled: state.soundEnabled,
    mission: {
      ...fresh.mission,
      stage: state.mission.stage,
      stageChangedAt: state.mission.stageChangedAt,
      name: state.mission.name,
      destination: state.mission.destination,
      durationDays: state.mission.durationDays,
      activities: state.mission.activities,
    },
    prepItems: state.prepItems,
    notice: {
      tone: 'ok',
      text: 'La simulación volvió a su estado inicial. El reloj sigue en marcha. La etapa de la misión se conservó.',
    },
  };
}

const MISSION_STAGE_ORDER: MissionStage[] = [
  'preembarque',
  'a_bordo',
  'posmision',
];

function setMissionStage(state: AppState, stage: MissionStage): AppState {
  if (state.mission.stage === stage) {
    return withNotice(
      state,
      'warn',
      `La misión ya estaba en ${MISSION_STAGE_LABEL[stage]}.`,
    );
  }
  if (state.role === 'astronaut') {
    return withNotice(
      state,
      'err',
      'Este rol simulado no cambia la etapa de la misión.',
    );
  }
  const from = MISSION_STAGE_ORDER.indexOf(state.mission.stage);
  const to = MISSION_STAGE_ORDER.indexOf(stage);
  if (
    from >= 0 &&
    to >= 0 &&
    to < from
  ) {
    return withNotice(
      state,
      'err',
      'No se puede volver al checklist de preembarque. La etapa solo avanza (preembarque → a bordo → posmisión).',
    );
  }
  const openEpisodes = state.episodes.filter(
    (item) => item.status !== 'closed',
  ).length;
  const next = {
    ...state,
    mission: {
      ...state.mission,
      stage,
      stageChangedAt: state.clock.simulatedAt,
    },
  };
  const text =
    openEpisodes > 0
      ? `Etapa: ${MISSION_STAGE_LABEL[stage]}. Hay ${openEpisodes} episodio(s) abiertos: el cambio de etapa no los cierra.`
      : `Etapa: ${MISSION_STAGE_LABEL[stage]}. El historial se conserva.`;
  return addAudit(withNotice(next, 'ok', text), {
    actor: state.role,
    action: 'set-mission-stage',
    entityId: state.mission.id,
    detail: text,
  });
}

function setPrepStatus(
  state: AppState,
  prepId: string,
  status: PrepStatus,
): AppState {
  if (state.role === 'astronaut') {
    return withNotice(
      state,
      'err',
      'Este rol simulado no actualiza la lista de preparación.',
    );
  }
  if (state.mission.stage !== 'preembarque') {
    return withNotice(
      state,
      'err',
      'Checklist cerrado: solo se edita en preembarque. No se puede reabrir después del despegue.',
    );
  }
  const current = state.prepItems.find((item) => item.id === prepId);
  if (!current)
    return withNotice(state, 'err', 'No existe ese elemento de preparación.');
  if (current.status === status)
    return withNotice(state, 'warn', 'Ese elemento ya tenía ese estado.');
  const prepItems = state.prepItems.map((item) =>
    item.id === prepId
      ? { ...item, status, updatedAt: state.clock.simulatedAt }
      : item,
  );
  const text = `Preparación actualizada: ${current.title} → ${status}.`;
  return addAudit(withNotice({ ...state, prepItems }, 'ok', text), {
    actor: state.role,
    action: 'set-prep-status',
    entityId: prepId,
    detail: text,
  });
}

function setLink(state: AppState, link: LinkStatus): AppState {
  if (state.link === link)
    return withNotice(state, 'warn', 'El enlace ya estaba en ese estado.');
  const next = { ...state, link, linkDelayMin: link === 'delayed' ? 8 : 0 };
  const text =
    link === 'down'
      ? 'Enlace interrumpido. El monitoreo local sigue activo y la cola no se entrega.'
      : 'Enlace restaurado. Los mensajes pendientes siguen en su estado hasta que alguien los entregue.';
  return addAudit(withNotice(next, 'ok', text), {
    actor: state.role,
    action: 'set-link',
    entityId: link,
    detail: text,
  });
}

function repeatMeasurement(
  state: AppState,
  action: { crewId: CrewId; idempotencyKey: string; atRest: boolean },
): AppState {
  if (!canUseInventory(state.role) && state.role !== 'astronaut') {
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede registrar una medición.',
    );
  }
  if (hasKey(state, action.idempotencyKey))
    return withNotice(state, 'warn', 'Esa medición ya estaba registrada.');
  const minute = Math.floor(
    (state.clock.simulatedAt - state.clock.originAt) / MINUTE_MS,
  );
  const value = latentHeartRate(
    state.scenarioId,
    action.crewId,
    minute,
    state.seed,
  );
  if (value === null) {
    return withNotice(
      state,
      'err',
      'Este escenario no entrega una lectura del sensor. No se inventó un valor.',
    );
  }
  const bumped = nextSeq(state);
  const measurement: Measurement = {
    id: `meas-local-${bumped.seq}`,
    messageId: `local-${bumped.seq}`,
    sequence: bumped.seq,
    crewId: action.crewId,
    sensorId: 'local-repeat',
    kind: 'heart_rate',
    value,
    unit: 'lpm',
    measuredAt: state.clock.simulatedAt,
    receivedAt: state.clock.simulatedAt,
    signalQuality: 96,
    integrity:
      state.scenarioId === 'frozen-sensor' && action.crewId === 'elena-torres'
        ? 'pending'
        : 'valid',
    context: action.atRest ? 'rest-control' : 'manual-repeat',
    origin: 'local',
    mac: null,
    macValid: null,
  };
  let next: AppState = rememberKey(
    { ...bumped.state, measurements: [...state.measurements, measurement] },
    action.idempotencyKey,
  );
  next = withNotice(
    next,
    'ok',
    measurement.integrity === 'pending'
      ? 'Se registró la repetición, pero la serie sigue pendiente de verificación.'
      : 'Medición local registrada. No sustituye la revisión humana.',
  );
  return addAudit(next, {
    actor: state.role,
    action: 'repeat-measurement',
    entityId: measurement.id,
    detail: `Repetición local de frecuencia cardíaca: ${value} lpm.`,
  });
}

function ackAlert(state: AppState, alertId: string): AppState {
  const alert = state.alerts.find((item) => item.id === alertId);
  if (!alert) return withNotice(state, 'err', 'No se encontró el aviso.');
  if (alert.astronautAck)
    return withNotice(state, 'warn', 'Ese aviso ya estaba confirmado.');
  const alerts = state.alerts.map((item) =>
    item.id === alertId
      ? { ...item, astronautAck: true, updatedAt: state.clock.simulatedAt }
      : item,
  );
  return addAudit(
    withNotice(
      { ...state, alerts },
      'ok',
      'Aviso confirmado. El episodio, si existe, sigue abierto.',
    ),
    {
      actor: state.role,
      action: 'ack-alert',
      entityId: alertId,
      detail: 'La persona confirmó que vio el aviso.',
    },
  );
}

function setAlertStatus(
  state: AppState,
  alertId: string,
  status: AlertStatus,
): AppState {
  const alert = state.alerts.find((item) => item.id === alertId);
  if (!alert) return withNotice(state, 'err', 'No se encontró la alerta.');
  if (alert.status === status)
    return withNotice(state, 'warn', 'La alerta ya estaba en ese estado.');
  if (
    (status === 'closed' || status === 'following') &&
    !isSensorAlert(alert.type) &&
    !canCloseHealthAlert(state.role)
  ) {
    return withNotice(
      state,
      'err',
      'Solo el rol simulado de equipo médico puede cambiar esta alerta de salud.',
    );
  }
  const alerts = state.alerts.map((item) =>
    item.id === alertId
      ? { ...item, status, updatedAt: state.clock.simulatedAt }
      : item,
  );
  return addAudit(
    withNotice(
      { ...state, alerts },
      'ok',
      'Estado de la alerta actualizado. El episodio no se cerró solo.',
    ),
    {
      actor: state.role,
      action: 'set-alert-status',
      entityId: alertId,
      detail: `La alerta pasó a ${status === 'following' ? 'seguimiento' : status === 'closed' ? 'cerrada' : 'activa'}.`,
    },
  );
}

function resolveSensorAlert(state: AppState, alertId: string): AppState {
  const alert = state.alerts.find((item) => item.id === alertId);
  if (!alert) return withNotice(state, 'err', 'No se encontró la alerta.');
  if (!isSensorAlert(alert.type)) {
    return withNotice(
      state,
      'err',
      'Resolver un sensor no cierra un episodio de salud.',
    );
  }
  if (!canUseInventory(state.role))
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede cerrar el aviso del sensor.',
    );
  if (alert.status === 'closed')
    return withNotice(state, 'warn', 'Ese aviso del sensor ya estaba cerrado.');
  const alerts = state.alerts.map((item) =>
    item.id === alertId
      ? {
          ...item,
          status: 'closed' as const,
          updatedAt: state.clock.simulatedAt,
        }
      : item,
  );
  return addAudit(
    withNotice(
      { ...state, alerts },
      'ok',
      'Aviso del sensor cerrado. Los síntomas y el episodio siguen como estaban.',
    ),
    {
      actor: state.role,
      action: 'resolve-sensor',
      entityId: alertId,
      detail: 'Se cerró solo el aviso del sensor.',
    },
  );
}

function registerUse(
  state: AppState,
  action: {
    resourceId: string;
    quantity: number;
    idempotencyKey: string;
    note: string;
  },
): AppState {
  if (!canUseInventory(state.role))
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede registrar uso de inventario.',
    );
  if (hasKey(state, action.idempotencyKey))
    return withNotice(state, 'warn', 'Ese uso ya estaba registrado.');
  const resource = state.resources.find(
    (item) => item.id === action.resourceId,
  );
  if (!resource)
    return withNotice(state, 'err', 'Ese recurso no está en el inventario.');
  const plan = planResourceUse(resource, action.quantity);
  if (!plan.ok) return withNotice(state, 'err', plan.error);
  return applyStock(
    state,
    resource,
    plan.plan.quantity,
    plan.plan.useCount,
    plan.plan.quantityDelta,
    'use',
    action.idempotencyKey,
    action.note || plan.plan.note,
  );
}

function adjustResource(
  state: AppState,
  action: {
    resourceId: string;
    quantity: number;
    idempotencyKey: string;
    note: string;
  },
): AppState {
  if (!canUseInventory(state.role))
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede ajustar el inventario.',
    );
  if (hasKey(state, action.idempotencyKey))
    return withNotice(state, 'warn', 'Ese ajuste ya estaba registrado.');
  const resource = state.resources.find(
    (item) => item.id === action.resourceId,
  );
  if (!resource)
    return withNotice(state, 'err', 'Ese recurso no está en el inventario.');
  const plan = planAdjustment(resource, action.quantity);
  if (!plan.ok) return withNotice(state, 'err', plan.error);
  return applyStock(
    state,
    resource,
    plan.plan.quantity,
    plan.plan.useCount,
    plan.plan.quantityDelta,
    'adjust',
    action.idempotencyKey,
    action.note || plan.plan.note,
  );
}

function applyStock(
  state: AppState,
  resource: Resource,
  quantity: number,
  useCount: number,
  quantityDelta: number,
  type: 'use' | 'adjust',
  idempotencyKey: string,
  note: string,
): AppState {
  const bumped = nextSeq(state);
  const resources = state.resources.map((item) =>
    item.id === resource.id
      ? { ...item, quantity, useCount, lastReviewAt: state.clock.simulatedAt }
      : item,
  );
  const next = rememberKey(
    {
      ...bumped.state,
      resources,
      movements: [
        ...state.movements,
        {
          id: `mov-${bumped.seq}`,
          resourceId: resource.id,
          type,
          quantityDelta,
          quantityAfter: quantity,
          at: state.clock.simulatedAt,
          idempotencyKey,
          note,
          actor: state.role,
        },
      ],
    },
    idempotencyKey,
  );
  return addAudit(withNotice(next, 'ok', note), {
    actor: state.role,
    action: type === 'use' ? 'use-resource' : 'adjust-resource',
    entityId: resource.id,
    detail: note,
  });
}

function createResource(
  state: AppState,
  action: {
    name: string;
    kind: Resource['kind'];
    category: Resource['category'];
    quantity: number;
    location: string;
    idempotencyKey: string;
  },
): AppState {
  if (!canUseInventory(state.role))
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede dar de alta un recurso.',
    );
  if (hasKey(state, action.idempotencyKey))
    return withNotice(state, 'warn', 'Ese alta ya estaba registrada.');
  const name = action.name.trim();
  const location = action.location.trim();
  if (name.length < 2 || name.length > 80)
    return withNotice(
      state,
      'err',
      'El nombre debe tener entre 2 y 80 caracteres.',
    );
  if (location.length < 2)
    return withNotice(state, 'err', 'Indicá una ubicación.');
  if (!Number.isInteger(action.quantity) || action.quantity < 0)
    return withNotice(
      state,
      'err',
      'La cantidad inicial no puede ser negativa.',
    );
  const bumped = nextSeq(state);
  const id = `res-${bumped.seq}`;
  const resource: Resource = {
    id,
    name,
    kind: action.kind,
    category: action.category,
    quantity: action.quantity,
    unitLabel: 'unidades',
    location,
    status: 'ready',
    lastReviewAt: state.clock.simulatedAt,
    useCount: 0,
  };
  const next = rememberKey(
    {
      ...bumped.state,
      resources: [...state.resources, resource],
      movements: [
        ...state.movements,
        {
          id: `mov-${bumped.seq}`,
          resourceId: id,
          type: 'create',
          quantityDelta: action.quantity,
          quantityAfter: action.quantity,
          at: state.clock.simulatedAt,
          idempotencyKey: action.idempotencyKey,
          note: 'Alta de recurso.',
          actor: state.role,
        },
      ],
    },
    action.idempotencyKey,
  );
  return addAudit(
    withNotice(next, 'ok', 'Recurso agregado al inventario de la nave.'),
    {
      actor: state.role,
      action: 'create-resource',
      entityId: id,
      detail: name,
    },
  );
}

function updateResource(
  state: AppState,
  action: {
    resourceId: string;
    name: string;
    location: string;
    status: Resource['status'];
  },
): AppState {
  if (!canUseInventory(state.role))
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede editar un recurso.',
    );
  const current = state.resources.find((item) => item.id === action.resourceId);
  if (!current)
    return withNotice(state, 'err', 'Ese recurso no está en el inventario.');
  const name = action.name.trim();
  const location = action.location.trim();
  if (name.length < 2 || location.length < 2)
    return withNotice(state, 'err', 'Nombre y ubicación son obligatorios.');
  const resources = state.resources.map((item) =>
    item.id === current.id
      ? { ...item, name, location, status: action.status }
      : item,
  );
  const bumped = nextSeq({ ...state, resources });
  const next = {
    ...bumped.state,
    movements: [
      ...state.movements,
      {
        id: `mov-${bumped.seq}`,
        resourceId: current.id,
        type: 'edit' as const,
        quantityDelta: 0,
        quantityAfter: current.quantity,
        at: state.clock.simulatedAt,
        idempotencyKey: `edit-${bumped.seq}`,
        note: 'Edición de ficha. La cantidad no cambió.',
        actor: state.role,
      },
    ],
  };
  return addAudit(
    withNotice(next, 'ok', 'Ficha actualizada. La cantidad quedó igual.'),
    {
      actor: state.role,
      action: 'edit-resource',
      entityId: current.id,
      detail: name,
    },
  );
}

function createCommunication(
  state: AppState,
  action: {
    crewId: CrewId;
    episodeId: string | null;
    subject: string;
    body: string;
    idempotencyKey: string;
  },
): AppState {
  if (!canManageComms(state.role))
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede preparar mensajes al equipo de Tierra.',
    );
  if (hasKey(state, action.idempotencyKey))
    return withNotice(state, 'warn', 'Ese borrador ya estaba guardado.');
  const subject = action.subject.trim();
  const body = action.body.trim();
  if (subject.length < 3)
    return withNotice(state, 'err', 'El asunto es demasiado corto.');
  if (subject.length > 180)
    return withNotice(
      state,
      'err',
      uiLang() === 'en'
        ? 'The subject exceeds 180 characters.'
        : 'El asunto supera el límite de 180 caracteres.',
    );
  if (body.length < 3)
    return withNotice(state, 'err', 'El mensaje está vacío.');
  if (body.length > 4000)
    return withNotice(
      state,
      'err',
      'El mensaje supera el límite de 4000 caracteres.',
    );
  const bumped = nextSeq(state);
  const sequence =
    state.communications.reduce(
      (max, item) => Math.max(max, item.sequence),
      0,
    ) + 1;
  const communication: Communication = {
    id: `comm-${bumped.seq}`,
    crewId: action.crewId,
    episodeId: action.episodeId,
    status: 'draft',
    subject,
    body,
    sequence,
    createdAt: state.clock.simulatedAt,
    queuedAt: null,
    sentAt: null,
    receivedAt: null,
    idempotencyKey: action.idempotencyKey,
    actor: state.role,
  };
  const next = rememberKey(
    {
      ...bumped.state,
      communications: [...state.communications, communication],
    },
    action.idempotencyKey,
  );
  return addAudit(
    withNotice(
      next,
      'ok',
      uiLang() === 'en'
        ? 'Draft saved. It is not queued or sent yet.'
        : 'Borrador guardado. Todavía no está en cola ni fue enviado.',
    ),
    {
      actor: state.role,
      action: 'draft-communication',
      entityId: communication.id,
      detail: subject,
    },
  );
}

function updateCommunicationDraft(
  state: AppState,
  action: { id: string; subject: string; body: string },
): AppState {
  if (!canManageComms(state.role))
    return withNotice(
      state,
      'err',
      uiLang() === 'en'
        ? 'This simulated role cannot edit a draft.'
        : 'Este rol simulado no puede editar un borrador.',
    );
  const current = state.communications.find((item) => item.id === action.id);
  if (!current)
    return withNotice(
      state,
      'err',
      uiLang() === 'en'
        ? 'That draft was not found.'
        : 'No se encontró el borrador.',
    );
  if (current.status !== 'draft') {
    return withNotice(
      state,
      'err',
      uiLang() === 'en'
        ? 'Only a draft can be edited. This message was not changed.'
        : 'Solo un borrador se puede editar. Este mensaje no cambió.',
    );
  }
  const subject = action.subject.trim();
  const body = action.body.trim();
  if (subject.length < 3)
    return withNotice(
      state,
      'err',
      uiLang() === 'en'
        ? 'The subject is too short.'
        : 'El asunto es demasiado corto.',
    );
  if (subject.length > 180)
    return withNotice(
      state,
      'err',
      uiLang() === 'en'
        ? 'The subject exceeds 180 characters.'
        : 'El asunto supera el l\u00edmite de 180 caracteres.',
    );
  if (body.length < 3)
    return withNotice(
      state,
      'err',
      uiLang() === 'en' ? 'The message is empty.' : 'El mensaje está vacío.',
    );
  if (body.length > 4000)
    return withNotice(
      state,
      'err',
      uiLang() === 'en'
        ? 'The message is over the 4000 character limit.'
        : 'El mensaje supera el límite de 4000 caracteres.',
    );
  if (current.subject === subject && current.body === body) {
    return withNotice(
      state,
      'ok',
      uiLang() === 'en'
        ? 'Draft saved. It is not queued or sent yet.'
        : 'Borrador guardado. Todavía no está en cola ni fue enviado.',
    );
  }
  const communications = state.communications.map((item) =>
    item.id === current.id
      ? { ...item, subject, body, status: 'draft' as const }
      : item,
  );
  return addAudit(
    withNotice(
      { ...state, communications },
      'ok',
      uiLang() === 'en'
        ? 'Draft saved. It is not queued or sent yet.'
        : 'Borrador guardado. Todavía no está en cola ni fue enviado.',
    ),
    {
      actor: state.role,
      action: 'edit-communication-draft',
      entityId: current.id,
      detail: 'Asunto y cuerpo del borrador actualizados.',
    },
  );
}

function transitionCommunication(
  state: AppState,
  id: string,
  status: CommStatus,
): AppState {
  if (!canManageComms(state.role))
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede cambiar el estado del mensaje.',
    );
  const current = state.communications.find((item) => item.id === id);
  if (!current) return withNotice(state, 'err', 'No se encontró el mensaje.');
  if (current.status === status)
    return withNotice(state, 'warn', 'Ese mensaje ya estaba en ese estado.');
  if (COMM_NEXT[current.status] !== status)
    return withNotice(state, 'err', 'Esa transición no está permitida.');
  if ((status === 'sent' || status === 'received') && state.link === 'down') {
    return withNotice(
      state,
      'err',
      'El enlace está cortado. El mensaje no se marcó como enviado ni recibido.',
    );
  }
  return writeComm(state, current, status);
}

function mapComms(state: AppState, from: CommStatus, to: CommStatus): AppState {
  if (!canManageComms(state.role))
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede entregar la cola.',
    );
  if ((to === 'sent' || to === 'received') && state.link === 'down') {
    return withNotice(
      state,
      'err',
      'Sin enlace no se entrega la cola. Los mensajes siguen pendientes.',
    );
  }
  const batch = state.communications
    .filter((item) => item.status === from)
    .slice()
    .sort((a, b) => a.sequence - b.sequence);
  if (batch.length === 0)
    return withNotice(state, 'warn', 'No hay mensajes en ese estado.');
  let next = state;
  for (const item of batch) next = writeComm(next, item, to);
  return {
    ...next,
    notice: {
      tone: 'ok',
      text:
        to === 'sent'
          ? 'Mensajes marcados como enviados. Enviado todavía no es recibido.'
          : 'Recepción confirmada, sin duplicar mensajes.',
    },
  };
}

function writeComm(
  state: AppState,
  current: Communication,
  status: CommStatus,
): AppState {
  const at = state.clock.simulatedAt;
  const communications = state.communications.map((item) =>
    item.id === current.id
      ? {
          ...item,
          status,
          queuedAt: status === 'queued' ? at : item.queuedAt,
          sentAt: status === 'sent' ? at : item.sentAt,
          receivedAt: status === 'received' ? at : item.receivedAt,
        }
      : item,
  );
  return addAudit(
    withNotice({ ...state, communications }, 'ok', statusLabel(status)),
    {
      actor: state.role,
      action: `comm-${status}`,
      entityId: current.id,
      detail: statusLabel(status),
    },
  );
}

function statusLabel(status: CommStatus): string {
  if (status === 'queued')
    return uiLang() === 'en'
      ? 'The message is queued. It has not been sent yet.'
      : 'El mensaje quedó en cola. Aún no fue enviado.';
  if (status === 'sent')
    return 'Marcado como enviado. Eso no confirma la recepción.';
  return 'Recepción confirmada.';
}

function recordAnalysis(
  state: AppState,
  record: AnalysisRecord,
  idempotencyKey: string,
): AppState {
  if (
    hasKey(state, idempotencyKey) ||
    state.analyses.some((item) => item.id === record.id)
  ) {
    return withNotice(state, 'warn', 'Ese análisis ya estaba guardado.');
  }
  if (record.result.humanReviewRequired !== true)
    return withNotice(
      state,
      'err',
      'Un análisis sin revisión humana no se guarda.',
    );
  const resources = new Set(state.resources.map((item) => item.id));
  const unknown = record.result.resources.some(
    (item) => !resources.has(item.resourceId),
  );
  if (unknown)
    return withNotice(
      state,
      'err',
      'El análisis cita un recurso que no existe. No se guardó.',
    );
  const next = rememberKey(
    { ...state, analyses: [...state.analyses, record] },
    idempotencyKey,
  );
  return addAudit(
    withNotice(
      next,
      'ok',
      record.source === 'model'
        ? 'Análisis del modelo guardado.'
        : 'Análisis del motor local guardado.',
    ),
    {
      actor: state.role,
      action: 'record-analysis',
      entityId: record.id,
      detail: 'El análisis no modificó inventario, alertas ni comunicaciones.',
    },
  );
}

function raiseSpaceAlert(
  state: AppState,
  action: { crewId: CrewId; categories: string[]; idempotencyKey: string },
): AppState {
  if (state.role !== 'astronaut' || state.sessionCrewId !== action.crewId) {
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede crear esa alerta desde Mi espacio.',
    );
  }
  if (hasKey(state, action.idempotencyKey) || action.categories.length === 0)
    return state;
  const id = `alert-space-${action.crewId}`;
  const already = state.alerts.some(
    (item) => item.id === id && item.status !== 'closed',
  );
  let next = rememberKey(state, action.idempotencyKey);
  if (already) return next;
  const profile = crewById(action.crewId);
  const episode = openEpisode(next, action.crewId);
  const alert: Alert = {
    id,
    type: 'symptom',
    status: 'active',
    crewId: action.crewId,
    sensorId: null,
    episodeId: episode?.id ?? null,
    title: `Contacto humano ahora — ${profile.name}`,
    reason: `Simulación del motor local. Hace falta una persona ahora. Se activó: ${action.categories.join(', ')}.`,
    openedAt: next.clock.simulatedAt,
    updatedAt: next.clock.simulatedAt,
    astronautAck: false,
    source: 'user',
  };
  next = ensureAlert(next, alert);
  next = addAudit(next, {
    actor: next.role,
    action: 'raise-space-alert',
    entityId: id,
    detail: `Simulación. Contacto humano: ${action.categories.join(', ')}.`,
  });
  return withNotice(
    next,
    'warn',
    'Esto es importante y no debe quedarse solo entre tú y yo.',
  );
}

function sendSpaceRequest(
  state: AppState,
  action: {
    crewId: CrewId;
    level: SharedRequestLevel;
    text: string;
    idempotencyKey: string;
  },
): AppState {
  if (state.role !== 'astronaut' || state.sessionCrewId !== action.crewId) {
    return withNotice(
      state,
      'err',
      'Este rol simulado no puede enviar esa solicitud.',
    );
  }
  const text = action.text.trim().slice(0, 2000);
  if (!text) return withNotice(state, 'err', 'La solicitud no tiene texto.');
  if (hasKey(state, action.idempotencyKey))
    return withNotice(state, 'warn', 'Esa solicitud ya estaba enviada.');
  const profile = crewById(action.crewId);
  const line = spacePreview(
    profile.name.split(' ')[0] ?? profile.name,
    action.level,
    text,
  ).teamLine;
  if (!line)
    return withNotice(state, 'err', 'Ese nivel no se comparte con el equipo.');
  const request: SpaceRequest = {
    id: `space-shared-${action.crewId}-${state.spaceRequests.length}`,
    crewId: action.crewId,
    level: action.level,
    line: line.slice(0, 500),
    sentAt: state.clock.simulatedAt,
  };
  const kept =
    state.spaceRequests.length >= 100
      ? state.spaceRequests.slice(-99)
      : state.spaceRequests;
  const next = rememberKey(
    { ...state, spaceRequests: [...kept, request] },
    action.idempotencyKey,
  );
  return addAudit(
    withNotice(
      next,
      'ok',
      'La solicitud quedó en el panel del equipo, con el nivel que elegiste.',
    ),
    {
      actor: next.role,
      action: 'send-space-request',
      entityId: request.id,
      detail: `Simulación. Nivel ${action.level}. El texto privado no entra en la auditoría.`,
    },
  );
}

function appendChat(state: AppState, message: ChatMessage): AppState {
  if (
    state.chats.some((item) => item.idempotencyKey === message.idempotencyKey)
  )
    return state;
  const episodeChats = state.chats.filter(
    (item) => item.episodeId === message.episodeId,
  );
  const trimmed =
    episodeChats.length >= 40
      ? state.chats.filter((item) => item !== episodeChats[0])
      : state.chats;
  return { ...state, chats: [...trimmed, message] };
}
