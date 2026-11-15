import { NASA_RISKS, type NasaRisk } from '../../shared/risks';
import type {
  Alert,
  AppState,
  Measurement,
  MeasurementKind,
} from '../../shared/types';
import { ageLabel } from './format';
import { isReliable, latestMeasurement } from './selectors';

export type ScienceLang = 'es' | 'en';

export interface ScienceSignal {
  label: string;
  value: string;
  age: string;
  reliability: string;
}

export interface ScienceSource {
  title: string;
  url: string;
  use: string;
  limitation: string;
}

export interface ScienceBrief {
  cause: string;
  signals: ScienceSignal[];
  sources: ScienceSource[];
  note: string;
}

const KINDS: MeasurementKind[] = [
  'heart_rate',
  'sleep_hours',
  'spo2',
  'temperature',
  'respiratory_rate',
];

const KIND_EN: Record<MeasurementKind, string> = {
  heart_rate: 'Heart rate',
  sleep_hours: 'Sleep',
  spo2: 'SpO₂',
  temperature: 'Temperature',
  respiratory_rate: 'Respiratory rate',
};

const KIND_ES: Record<MeasurementKind, string> = {
  heart_rate: 'Frecuencia cardíaca',
  sleep_hours: 'Descanso',
  spo2: 'SpO₂',
  temperature: 'Temperatura',
  respiratory_rate: 'Frecuencia respiratoria',
};

function ageEn(now: number, then: number): string {
  const minutes = Math.max(0, Math.round((now - then) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function reliability(
  state: AppState,
  item: Measurement | undefined,
  lang: ScienceLang,
): string {
  if (!item)
    return lang === 'en'
      ? 'No reading in this scenario'
      : 'Sin lectura en este escenario';
  if (
    item.integrity === 'stale' ||
    !isReliable(item, state.clock.simulatedAt)
  ) {
    return lang === 'en'
      ? `Not reliable for the current moment · integrity ${item.integrity} · signal ${item.signalQuality}/100`
      : `No es confiable para el momento actual · integridad ${item.integrity} · señal ${item.signalQuality}/100`;
  }
  return lang === 'en'
    ? `Reliable in the simulation · integrity ${item.integrity} · signal ${item.signalQuality}/100`
    : `Confiable en la simulación · integridad ${item.integrity} · señal ${item.signalQuality}/100`;
}

function pickRisks(
  state: AppState,
  crewId: Alert['crewId'],
  alertType?: string,
): NasaRisk[] {
  const ordered: string[] = [];
  const add = (id: string) => {
    if (!ordered.includes(id)) ordered.push(id);
  };
  const symptoms = state.symptoms
    .filter((item) => item.crewId === crewId)
    .flatMap((item) => item.symptoms);
  const sleep = crewId
    ? latestMeasurement(state, crewId, 'sleep_hours')
    : undefined;
  const hr = crewId
    ? latestMeasurement(state, crewId, 'heart_rate')
    : undefined;
  if (
    alertType === 'change' ||
    alertType === 'missing' ||
    alertType === 'quality' ||
    (hr && hr.value >= 90)
  )
    add('risk-eva-metabolic');
  if (
    (sleep && sleep.value < 6) ||
    symptoms.some((item) => /cansancio|fatiga|sueño|sleep|tired/i.test(item))
  )
    add('risk-sleep');
  if (symptoms.some((item) => /mareo|dizzy|náusea/i.test(item)))
    add('risk-sensorimotor');
  if (hr && hr.value >= 90) add('risk-msk-cv');
  if (ordered.length === 0) add('risk-sleep');
  const chosen = ordered
    .map((id) => NASA_RISKS.find((risk) => risk.id === id))
    .filter((risk): risk is NasaRisk => Boolean(risk));
  const seen = new Set<string>();
  return chosen
    .filter((risk) =>
      seen.has(risk.sourceUrl) ? false : (seen.add(risk.sourceUrl), true),
    )
    .slice(0, 3);
}

const EN_RISK: Record<string, { use: string; limitation: string }> = {
  'risk-sleep': {
    use: 'Public Human Research Roadmap context for short sleep, circadian strain, and workload. It does not score this simulated crew.',
    limitation:
      'It does not set a clinical threshold or authorize treatment in this prototype.',
  },
  'risk-msk-cv': {
    use: 'Public HRR context for cardiovascular and musculoskeletal change in spaceflight. The heart-rate number here is simulated.',
    limitation:
      'It does not prescribe exercise or interpret a live medical record.',
  },
  'risk-sensorimotor': {
    use: 'Public HRR context for sensorimotor change, used when the simulation records dizziness.',
    limitation: 'It does not diagnose vertigo or prescribe medication.',
  },
  'risk-eva-metabolic': {
    use: 'Published NTRS note that heart rate alone does not describe EVA workload. HELIOS uses it to explain alert limits.',
    limitation:
      'No live suit telemetry. The BTU/hr bands are literature, not a calibrated clinical rule.',
  },
};

function toSource(risk: NasaRisk, lang: ScienceLang): ScienceSource {
  const english = EN_RISK[risk.id];
  return {
    title: risk.sourceTitle,
    url: risk.sourceUrl,
    use: lang === 'en' && english ? english.use : risk.useInSystem,
    limitation: lang === 'en' && english ? english.limitation : risk.limitation,
  };
}

export function nasaSourceLines(
  state: AppState,
  crewId: Alert['crewId'],
): string[] {
  return pickRisks(state, crewId).map((risk) => {
    const line = `${risk.sourceTitle} · ${risk.sourceUrl}`;
    return line.length > 180 ? line.slice(0, 177) + '…' : line;
  });
}

export function briefForCrew(
  state: AppState,
  crewId: Alert['crewId'],
  lang: ScienceLang,
  alert?: Alert,
): ScienceBrief {
  const risks = pickRisks(state, crewId, alert?.type);
  const signals = KINDS.flatMap((kind) => {
    if (!crewId) return [];
    const item = latestMeasurement(state, crewId, kind);
    if (!item) return [];
    return [
      {
        label: lang === 'en' ? KIND_EN[kind] : KIND_ES[kind],
        value: `${item.value} ${item.unit}`,
        age:
          lang === 'en'
            ? ageEn(state.clock.simulatedAt, item.measuredAt)
            : ageLabel(state.clock.simulatedAt, item.measuredAt),
        reliability: reliability(state, item, lang),
      },
    ];
  }).slice(0, 4);

  const cause = alert
    ? lang === 'en'
      ? `${alert.title}. Trigger in this simulation: ${alert.reason}`
      : `${alert.title}. Disparador en esta simulación: ${alert.reason}`
    : lang === 'en'
      ? 'This episode uses simulated crew readings. It is not a live NASA medical feed.'
      : 'Este episodio usa lecturas simuladas de la tripulación. No es un canal médico en vivo de NASA.';

  const note =
    lang === 'en'
      ? 'NASA documents below are public references. HELIOS does not download astronaut medical records and does not turn these papers into a diagnosis or a treatment.'
      : 'Los documentos NASA de abajo son referencias públicas. HELIOS no descarga historias clínicas de astronautas ni convierte esos textos en un diagnóstico o un tratamiento.';

  return {
    cause,
    signals,
    sources: risks.map((risk) => toSource(risk, lang)),
    note,
  };
}
