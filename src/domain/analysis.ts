import { MISSION_STAGE_LABEL, PREP_STATUS_LABEL } from '../../shared/mission';
import { EVA_METABOLIC_BANDS } from '../../shared/nasaSources';
import { nasaSourceLines } from './scienceBrief';
import { DEMO_PROTOCOLS } from '../../shared/protocols';
import { NASA_RISKS, RISK_CATEGORY_LABEL } from '../../shared/risks';
import type { AnalysisResult, AppState, Measurement } from '../../shared/types';
import { uiLang } from '../locale';
import { crewById } from './crew';
import { integrityLabel, kindLabel } from './format';
import { djb2 } from './hash';
import {
  crewPosture,
  latestReliable,
  measurementsFor,
  vitalTrends,
  measurementQuality,
} from './selectors';

const LIMITATIONS_ES = [
  'Quirón Bot · motor local de HELIOS. No es una evaluación clínica.',
  'No calcula una probabilidad ni confirma un diagnóstico.',
  'La disponibilidad de un recurso no indica que deba usarse.',
  'Las referencias de NASA sirven de contexto científico, no como instrucción de tratamiento.',
];

const LIMITATIONS_EN = [
  'Quirón Bot · HELIOS local engine. This is not a clinical evaluation.',
  'It does not calculate a probability or confirm a diagnosis.',
  'A resource being available does not mean it should be used.',
  'NASA references are scientific context, not treatment instructions.',
];

const STAGE_EN = {
  preembarque: 'Preflight',
  a_bordo: 'In Flight',
  posmision: 'Completed',
} as const;

function stageName(stage: keyof typeof STAGE_EN): string {
  return uiLang() === 'es' ? MISSION_STAGE_LABEL[stage] : STAGE_EN[stage];
}

const SYMPTOM_EN: Record<string, string> = {
  cansancio: 'fatigue',
  mareo: 'dizziness',
  cefalea: 'headache',
  nausea: 'nausea',
  otro: 'other',
};

function symptomWords(ids: string[]): string {
  if (uiLang() !== 'en') return ids.join(', ');
  return ids.map((id) => SYMPTOM_EN[id] ?? id).join(', ');
}

export function episodeFingerprint(state: AppState, episodeId: string): string {
  const episode = state.episodes.find((item) => item.id === episodeId);
  const crewId = episode?.crewId;
  const parts = [
    state.link,
    ...state.measurements
      .filter((item) => item.crewId === crewId)
      .map(
        (item) =>
          `${item.id}:${item.value}:${item.integrity}:${item.measuredAt}`,
      ),
    ...state.symptoms
      .filter((item) => item.episodeId === episodeId)
      .map((item) => `${item.id}:${item.symptoms.join(',')}`),
    ...state.alerts
      .filter((item) => item.episodeId === episodeId || item.crewId === crewId)
      .map((item) => `${item.id}:${item.status}`),
    ...state.resources.map(
      (item) => `${item.id}:${item.quantity}:${item.status}:${item.location}`,
    ),
  ];
  return djb2(parts.join('|'));
}

export function runLocalAnalysis(
  state: AppState,
  episodeId: string,
): AnalysisResult | null {
  const episode = state.episodes.find((item) => item.id === episodeId);
  if (!episode) return null;
  const profile = crewById(episode.crewId);
  const posture = crewPosture(state, episode.crewId);
  const symptoms = state.symptoms.filter(
    (item) => item.episodeId === episodeId,
  );
  const reliable = (
    [
      'heart_rate',
      'spo2',
      'temperature',
      'respiratory_rate',
      'sleep_hours',
    ] as const
  )
    .map((kind) => latestReliable(state, episode.crewId, kind))
    .filter((item): item is Measurement => Boolean(item));
  const resources = state.resources.filter(
    (item) => item.quantity > 0 && item.status === 'ready',
  );
  const hasStale = measurementsFor(state, episode.crewId).some(
    (item) => item.integrity === 'stale',
  );
  const english = uiLang() === 'en';
  const missing = [
    posture.evidence !== 'actualizada'
      ? english
        ? 'A resting control measurement, with the person still and the sensor identified.'
        : 'Medición de control en reposo, con la persona quieta y el sensor identificado.'
      : '',
    hasStale
      ? english
        ? 'A reading taken now. Older numbers do not describe the current moment.'
        : 'Una lectura tomada ahora. Las cifras antiguas no describen el momento actual.'
      : '',
    symptoms.length === 0
      ? english
        ? 'A short self-report: what they feel, since when, and whether it matches exercise or short sleep.'
        : 'Autorreporte breve: qué siente, desde cuándo y si coincide con ejercicio o sueño corto.'
      : '',
  ].filter(Boolean);

  const reported = symptomWords(symptoms.flatMap((item) => item.symptoms));
  const trend = vitalTrends(state, episode.crewId);
  const quality = measurementQuality(state, episode.crewId);
  const sleep = latestReliable(state, episode.crewId, 'sleep_hours');
  const summary = [
    `${english ? 'Objective findings' : 'Hallazgos objetivos'}: ${posture.summary} ${trend.deltaHr === null ? (english ? 'No current trend can be calculated.' : 'No se puede calcular una tendencia actual.') : `HR ${trend.currentHr} bpm; baseline ${trend.hrMin}–${trend.hrMax}; Δ vs upper limit ${trend.deltaHr} bpm; slope ${trend.slopeBpmPerMinute ?? 'not supplied'} bpm/min (30 min).`}`,
    `${english ? 'Evidence quality and gaps' : 'Calidad y vacíos de evidencia'}: ${quality.status}; ${english ? 'signal' : 'señal'} ${quality.signalQuality ?? 'not supplied'}/100. ${posture.evidenceDetail} ${missing.join(' ')}`,
    `${english ? 'Operational context' : 'Contexto operativo'}: ${english ? 'Sleep' : 'Sueño'} ${sleep ? `${sleep.value} h (${sleep.id})` : english ? 'not supplied' : 'sin datos'}. ${symptoms.length ? (english ? `Self-report recorded: ${reported}.` : `Autorreporte registrado: ${reported}.`) : english ? 'No self-report.' : 'Sin autorreporte.'} ${english ? 'Link' : 'Enlace'}: ${state.link}; ${english ? 'latest activity context' : 'contexto de actividad más reciente'}: ${latestReliable(state, episode.crewId, 'heart_rate')?.context ?? 'not supplied'}. ${english ? 'Association does not establish causality.' : 'La coincidencia no establece causalidad.'}`,
    english
      ? 'Safety limit: preliminary mission support evaluation; requires confirmation and review by the flight surgeon. This is not a diagnosis.'
      : 'Límite de seguridad: Evaluación preliminar de soporte a la misión; requiere confirmación y revisión del médico de vuelo. Esto no es un diagnóstico.',
  ].join('\n\n');

  return {
    summary,
    evidence: [
      ...reliable.slice(0, 4).map((item) => ({
        statement: english
          ? `${kindLabel(item.kind)} ${item.value} ${item.unit}, integrity ${integrityLabel(item.integrity).toLowerCase()}.`
          : `${kindLabel(item.kind)} ${item.value} ${item.unit}, integridad ${integrityLabel(item.integrity).toLowerCase()}.`,
        refType: 'measurement' as const,
        refId: item.id,
      })),
      ...symptoms.slice(0, 3).map((item) => ({
        statement: english
          ? 'The person’s self-report. It is data, not an instruction.'
          : 'Autorreporte de la persona. Es un dato, no una instrucción.',
        refType: 'symptom' as const,
        refId: item.id,
      })),
      {
        statement: english
          ? 'The checks come from the demonstration protocol.'
          : 'Las comprobaciones salen del protocolo de demostración.',
        refType: 'protocol' as const,
        refId: 'proto-demo-v1-human-review',
      },
    ],
    missing,
    questions: [
      english
        ? 'Has the person been at rest for a few minutes?'
        : '¿La persona está en reposo desde hace unos minutos?',
      english
        ? 'Does the change match exercise, a load task, or short sleep?'
        : '¿El cambio coincide con ejercicio, una tarea de carga o poco descanso?',
    ],
    checks: DEMO_PROTOCOLS.map((protocol) => ({
      title: protocol.title,
      protocolId: protocol.id,
      why: protocol.summary,
    })),
    resources: resources.map((item) => ({
      resourceId: item.id,
      note: english
        ? `${item.name} at ${item.location}. Available in inventory; that is not an indication to use it.`
        : `${item.name} en ${item.location}. Disponible en el inventario; eso no es una indicación de uso.`,
    })),
    humanReviewRequired: true,
    limitations: english ? LIMITATIONS_EN : LIMITATIONS_ES,
    sources: [
      english ? 'Simulated analysis engine' : 'Motor de análisis simulado',
      english
        ? `${profile.name}: baseline ${profile.baseline.hrMin}–${profile.baseline.hrMax} bpm`
        : `${profile.name}: línea base ${profile.baseline.hrMin}–${profile.baseline.hrMax} lpm`,
      ...nasaSourceLines(state, episode.crewId),
    ].slice(0, 8),
  };
}

export function answerLocal(
  state: AppState,
  episodeId: string,
  question: string,
): AnalysisResult | null {
  const base = runLocalAnalysis(state, episodeId);
  if (!base) return null;
  const episode = state.episodes.find((item) => item.id === episodeId);
  if (!episode) return null;
  const normalized = question.toLowerCase();
  const english = uiLang() === 'en';
  const resources = state.resources.filter((item) => item.quantity > 0);
  const alerts = state.alerts.filter(
    (item) => item.episodeId === episodeId || item.crewId === episode.crewId,
  );
  let summary = base.summary;
  if (
    normalized.includes('abord') ||
    normalized.includes('prepar') ||
    normalized.includes('preembar') ||
    normalized.includes('board') ||
    normalized.includes('before flight')
  ) {
    const pending = state.prepItems.filter(
      (item) =>
        item.status === 'propuesto' ||
        item.status === 'pendiente_revision' ||
        item.status === 'faltante',
    );
    const list =
      pending
        .map((item) => `${item.title} (${PREP_STATUS_LABEL[item.status]})`)
        .join('; ') || (english ? 'none' : 'ninguno');
    summary = english
      ? `Preflight. ${pending.length} item(s) still not ready: ${list}. Quirón Bot proposes categories; authorized staff approve products and quantities.`
      : `Preembarque. ${pending.length} elemento(s) aún no listos: ${list}. Quirón Bot propone categorías; el personal autorizado aprueba productos y cantidades.`;
  } else if (
    normalized.includes('aprob') ||
    (normalized.includes('pendiente') && normalized.includes('recurso')) ||
    normalized.includes('approval')
  ) {
    const rows = state.prepItems.filter(
      (item) =>
        item.status === 'propuesto' || item.status === 'pendiente_revision',
    );
    summary = rows.length
      ? english
        ? `Pending approval or review: ${rows.map((item) => item.title).join('; ')}.`
        : `Pendientes de aprobación o revisión: ${rows.map((item) => item.title).join('; ')}.`
      : english
        ? 'There are no proposals waiting for review on the preparation list.'
        : 'No hay propuestas pendientes de revisión en la lista de preparación.';
  } else if (
    normalized.includes('posmisi') ||
    normalized.includes('regres') ||
    normalized.includes('después') ||
    normalized.includes('return') ||
    normalized.includes('follow-up')
  ) {
    const open = state.episodes.filter((item) => item.status !== 'closed');
    summary = english
      ? `Completed. Current stage: ${stageName(state.mission.stage)}. Episodes still open: ${open.length}. Changing stage does not close a pending follow-up. Recovery decisions belong to authorized staff.`
      : `Posmisión. Etapa actual: ${MISSION_STAGE_LABEL[state.mission.stage]}. Episodios aún abiertos: ${open.length}. Cambiar de etapa no cierra un seguimiento pendiente. Las decisiones de recuperación corresponden al personal autorizado.`;
  } else if (
    normalized.includes('riesgo') ||
    normalized.includes('risk') ||
    normalized.includes('nasa') ||
    normalized.includes('hrp')
  ) {
    const list = NASA_RISKS.slice(0, 4)
      .map((item) => `${item.title} [${RISK_CATEGORY_LABEL[item.category]}]`)
      .join('; ');
    summary = english
      ? `Reference risks loaded: ${list}. They are scientific grounding; they do not become automatic treatment.`
      : `Riesgos de referencia cargados: ${list}. Son fundamento científico; no se convierten en tratamiento automático.`;
  } else if (
    normalized.includes('equipo') ||
    normalized.includes('equipment') ||
    normalized.includes('recurso') ||
    normalized.includes('resource') ||
    normalized.includes('oxím') ||
    normalized.includes('oxim') ||
    normalized.includes('dónde') ||
    normalized.includes('where')
  ) {
    summary = resources.length
      ? english
        ? `Recorded equipment: ${resources.map((item) => `${item.name} (${item.quantity} ${item.unitLabel}, ${item.location})`).join('; ')}. Availability does not mean it should be used.`
        : `Equipo registrado: ${resources.map((item) => `${item.name} (${item.quantity} ${item.unitLabel}, ${item.location})`).join('; ')}. La disponibilidad no indica que deba usarse.`
      : english
        ? 'No resources with stock are loaded in the inventory.'
        : 'No hay recursos con existencias en el inventario cargado.';
  } else if (normalized.includes('falta') || normalized.includes('missing')) {
    summary = base.missing.length
      ? english
        ? `Still to confirm: ${base.missing.join(' ')}`
        : `Falta confirmar: ${base.missing.join(' ')}`
      : english
        ? 'Quirón Bot does not see another gap in this episode’s data.'
        : 'Quirón Bot no detecta un hueco adicional en los datos de este episodio.';
  } else if (/calidad|quality|sensor/.test(normalized)) {
    const q = measurementQuality(state, episode.crewId);
    summary = english
      ? `Measurement quality: ${q.status}; signal ${q.signalQuality ?? 'not supplied'}/100; resting control ${q.restControl ? 'available' : 'missing'}. Repeated values require verification. ${base.summary}`
      : `Calidad de medición: ${q.status}; señal ${q.signalQuality ?? 'sin datos'}/100; control en reposo ${q.restControl ? 'disponible' : 'faltante'}. Los valores repetidos requieren verificación. ${base.summary}`;
  } else if (/tendencia|trend/.test(normalized)) {
    const t = vitalTrends(state, episode.crewId);
    summary = english
      ? `30-minute trend: ${t.slopeBpmPerMinute ?? 'insufficient evidence'} bpm/min; delta vs upper baseline ${t.deltaHr ?? 'not available'} bpm. ${base.summary}`
      : `Tendencia de 30 minutos: ${t.slopeBpmPerMinute ?? 'evidencia insuficiente'} lpm/min; diferencia respecto al límite superior ${t.deltaHr ?? 'sin datos'} lpm. ${base.summary}`;
  } else if (normalized.includes('alerta') || normalized.includes('alert')) {
    summary = alerts.length
      ? english
        ? `Linked alerts: ${alerts.map((item) => `${item.title}. ${item.reason}`).join(' ')}`
        : `Alertas vinculadas: ${alerts.map((item) => `${item.title}. ${item.reason}`).join(' ')}`
      : english
        ? 'There are no open alerts linked to this episode.'
        : 'No hay alertas abiertas vinculadas a este episodio.';
  } else if (
    normalized.includes('resumen') ||
    normalized.includes('especialista') ||
    normalized.includes('summary') ||
    normalized.includes('specialist')
  ) {
    const posture = crewPosture(state, episode.crewId);
    summary = english
      ? `Summary for human review (${stageName(state.mission.stage)}). ${posture.summary} ${posture.evidenceDetail} Link: ${state.link}. This is not a closed medical instruction.`
      : `Resumen para revisión humana (${MISSION_STAGE_LABEL[state.mission.stage]}). ${posture.summary} ${posture.evidenceDetail} Enlace: ${state.link}. No es una orientación médica cerrada.`;
  } else if (
    normalized.includes('cambi') ||
    normalized.includes('medici') ||
    normalized.includes('change') ||
    normalized.includes('reading')
  ) {
    const hr = latestReliable(state, episode.crewId, 'heart_rate');
    summary = hr
      ? english
        ? `Against baseline, the latest reliable heart rate is ${hr.value} ${hr.unit}. ${base.summary}`
        : `Respecto a la línea base, la última frecuencia confiable es ${hr.value} ${hr.unit}. ${base.summary}`
      : english
        ? `There is no recent reliable measurement to compare. ${base.summary}`
        : `No hay una medición reciente confiable para comparar. ${base.summary}`;
  }
  return {
    ...base,
    summary,
    sources: [...base.sources, 'Quirón Bot · HELIOS'],
  };
}

export function analysisIsStale(
  state: AppState,
  fingerprint: string,
  episodeId: string,
): boolean {
  return episodeFingerprint(state, episodeId) !== fingerprint;
}

/** Respuestas de Quirón Bot sobre misión y preparación, sin exigir un episodio abierto. */
export function answerMissionLocal(state: AppState, question: string): string {
  const normalized = question.toLowerCase();
  const english = uiLang() === 'en';
  const pending = state.prepItems.filter(
    (item) =>
      item.status === 'propuesto' ||
      item.status === 'pendiente_revision' ||
      item.status === 'faltante',
  );
  const open = state.episodes.filter((item) => item.status !== 'closed');
  if (
    normalized.includes('abord') ||
    normalized.includes('prepar') ||
    normalized.includes('preembar') ||
    normalized.includes('board')
  ) {
    const list =
      pending
        .map((item) => `${item.title} (${PREP_STATUS_LABEL[item.status]})`)
        .join('; ') || (english ? 'none' : 'ninguno');
    return english
      ? `Before boarding (${stageName(state.mission.stage)}): ${pending.length} item(s) still open — ${list}. HELIOS does not decide medication per crew member.`
      : `Antes de abordar (${MISSION_STAGE_LABEL[state.mission.stage]}): ${pending.length} ítem(s) por resolver — ${list}. HELIOS no decide medicamentos por tripulante.`;
  }
  if (
    normalized.includes('aprob') ||
    normalized.includes('pendiente') ||
    normalized.includes('approval') ||
    normalized.includes('pending')
  ) {
    const rows = state.prepItems.filter(
      (item) =>
        item.status === 'propuesto' || item.status === 'pendiente_revision',
    );
    return rows.length
      ? english
        ? `Pending review or approval: ${rows.map((item) => item.title).join('; ')}.`
        : `Pendientes de revisión/aprobación: ${rows.map((item) => item.title).join('; ')}.`
      : english
        ? 'There are no proposals waiting on the preparation list.'
        : 'No hay propuestas pendientes en la lista de preparación.';
  }
  if (
    normalized.includes('posmisi') ||
    normalized.includes('regres') ||
    normalized.includes('después') ||
    normalized.includes('return') ||
    normalized.includes('follow-up')
  ) {
    return english
      ? `Later follow-up: stage ${stageName(state.mission.stage)}. Open episodes: ${open.length}. Finishing or changing stage does not automatically close a pending episode.`
      : `Seguimiento posterior: etapa ${MISSION_STAGE_LABEL[state.mission.stage]}. Episodios abiertos: ${open.length}. Finalizar o cambiar de etapa no cierra automáticamente un episodio pendiente.`;
  }
  if (
    normalized.includes('riesgo') ||
    normalized.includes('risk') ||
    normalized.includes('nasa')
  ) {
    return english
      ? `NASA risk library (selection): ${NASA_RISKS.length} references. Open NASA risks for the title, link, and limit of use.`
      : `Biblioteca de riesgos NASA (selección): ${NASA_RISKS.length} referencias. Consultá la pantalla Riesgos NASA para título, enlace y límite de uso.`;
  }
  if (
    normalized.includes('metaból') ||
    normalized.includes('metabol') ||
    normalized.includes('eva') ||
    normalized.includes('btu')
  ) {
    return english
      ? `EVA effort (xEMU/NTRS literature): low ≤${EVA_METABOLIC_BANDS.lowMax} BTU/hr, medium up to ${EVA_METABOLIC_BANDS.mediumMax}, historical design ~${EVA_METABOLIC_BANDS.highDesignLimit}. Heart rate alone is not enough. This prototype has no public suit telemetry.`
      : `Esfuerzo EVA (literatura xEMU/NTRS): baja ≤${EVA_METABOLIC_BANDS.lowMax} BTU/hr, media hasta ${EVA_METABOLIC_BANDS.mediumMax}, diseño histórico ~${EVA_METABOLIC_BANDS.highDesignLimit}. La FC sola no basta. No hay telemetría de traje pública en este prototipo.`;
  }
  if (
    normalized.includes('dónde') ||
    normalized.includes('where') ||
    normalized.includes('recurso') ||
    normalized.includes('resource') ||
    normalized.includes('equipo') ||
    normalized.includes('equipment')
  ) {
    const ready = state.resources.filter((item) => item.quantity > 0);
    return (
      ready
        .map(
          (item) =>
            `${item.name}: ${item.quantity} ${english ? 'at' : 'en'} ${item.location}`,
        )
        .join('; ') || (english ? 'No stock.' : 'Sin existencias.')
    );
  }
  return english
    ? `Mission ${state.mission.name}. Destination ${state.mission.destination}, ${state.mission.durationDays} days, ${state.mission.crewCount} crew. Stage: ${stageName(state.mission.stage)}.`
    : `Misión ${state.mission.name}. Destino ${state.mission.destination}, ${state.mission.durationDays} días, ${state.mission.crewCount} tripulantes. Etapa: ${MISSION_STAGE_LABEL[state.mission.stage]}.`;
}
