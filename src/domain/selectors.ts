import type {
  Alert,
  AppState,
  CrewId,
  Episode,
  Measurement,
  MeasurementKind,
} from '../../shared/types';
import { uiLang } from '../locale';
import { FRESH_MS, SLEEP_FRESH_MS, STALE_GAP_MS } from './constants';
import { crewById } from './crew';

export type ObservedKind = 'stable' | 'change' | 'no_recent_evaluation';
export type EvidenceKind =
  'actualizada' | 'incompleta' | 'pendiente' | 'no_confiable';

export interface CrewPosture {
  observed: ObservedKind;
  evidence: EvidenceKind;
  summary: string;
  evidenceDetail: string;
}

export function isReliable(measurement: Measurement, now: number): boolean {
  if (measurement.integrity !== 'valid') return false;
  if (
    measurement.measuredAt > now ||
    measurement.receivedAt > now ||
    measurement.signalQuality === 0
  )
    return false;
  if (measurement.origin === 'link' && measurement.macValid !== true)
    return false;
  if (measurement.receivedAt - measurement.measuredAt > STALE_GAP_MS)
    return false;
  const window = measurement.kind === 'sleep_hours' ? SLEEP_FRESH_MS : FRESH_MS;
  return now - measurement.measuredAt <= window;
}

export function measurementsFor(
  state: AppState,
  crewId: CrewId,
  kind?: MeasurementKind,
): Measurement[] {
  return state.measurements
    .filter(
      (item) =>
        item.crewId === crewId && (kind === undefined || item.kind === kind),
    )
    .slice()
    .sort((a, b) => a.measuredAt - b.measuredAt || a.sequence - b.sequence);
}

export function latestMeasurement(
  state: AppState,
  crewId: CrewId,
  kind: MeasurementKind,
): Measurement | undefined {
  return measurementsFor(state, crewId, kind).at(-1);
}

export function latestReliable(
  state: AppState,
  crewId: CrewId,
  kind: MeasurementKind,
): Measurement | undefined {
  if (measurementQuality(state, crewId, kind).status === 'frozen')
    return undefined;
  return measurementsFor(state, crewId, kind)
    .filter((item) => isReliable(item, state.clock.simulatedAt))
    .at(-1);
}

export function openEpisode(
  state: AppState,
  crewId: CrewId,
): Episode | undefined {
  return state.episodes.find(
    (episode) => episode.crewId === crewId && episode.status !== 'closed',
  );
}

export function crewPosture(state: AppState, crewId: CrewId): CrewPosture {
  const profile = crewById(crewId);
  const reliable = latestReliable(state, crewId, 'heart_rate');
  const latest = latestMeasurement(state, crewId, 'heart_rate');
  const symptoms = state.symptoms.filter((item) => item.crewId === crewId);
  const unreliable =
    state.alerts.some(
      (alert) =>
        alert.crewId === crewId &&
        alert.status !== 'closed' &&
        (alert.type === 'quality' ||
          alert.type === 'repeated' ||
          alert.type === 'altered'),
    ) ||
    latest?.integrity === 'pending' ||
    latest?.integrity === 'stale' ||
    state.rejected.some(
      (item) => item.sensorId === latest?.sensorId && item.reason === 'altered',
    );

  const english = uiLang() === 'en';
  if (!reliable) {
    return {
      observed: 'no_recent_evaluation',
      evidence: unreliable ? 'no_confiable' : 'pendiente',
      summary: english
        ? 'There is no recent reliable measurement. That does not mean a stable state.'
        : 'No hay una medición confiable reciente. Esto no indica un estado estable.',
      evidenceDetail: latest
        ? english
          ? `The latest heart-rate reading is ${latest.value} ${latest.unit} and is not used as a current evaluation (${latest.integrity === 'stale' ? 'old data' : 'integrity not valid'}).`
          : `La última lectura de frecuencia cardíaca es de ${latest.value} ${latest.unit} y no se usa como evaluación actual (${latest.integrity === 'stale' ? 'dato antiguo' : 'integridad no válida'}).`
        : english
          ? 'No recent heart-rate reading arrived.'
          : 'No llegó una lectura reciente de frecuencia cardíaca.',
    };
  }

  const above = reliable.value > profile.baseline.hrMax;
  const hasRestControl = measurementsFor(state, crewId, 'heart_rate').some(
    (item) =>
      item.context === 'rest-control' &&
      item.measuredAt >= reliable.measuredAt &&
      isReliable(item, state.clock.simulatedAt),
  );
  if (above || symptoms.length > 0) {
    return {
      observed: 'change',
      evidence:
        hasRestControl && !unreliable
          ? 'actualizada'
          : unreliable
            ? 'no_confiable'
            : 'incompleta',
      summary: above
        ? english
          ? `Heart rate (${Math.round(reliable.value)} bpm) is above baseline (${profile.baseline.hrMin}–${profile.baseline.hrMax} bpm).`
          : `La frecuencia cardíaca (${Math.round(reliable.value)} lpm) está por encima de su línea base (${profile.baseline.hrMin}–${profile.baseline.hrMax} lpm).`
        : english
          ? 'Symptoms were reported. Numbers alone do not close the evaluation.'
          : 'Hay síntomas reportados. Las cifras por sí solas no cierran la evaluación.',
      evidenceDetail: hasRestControl
        ? english
          ? 'There is a repeat reading marked at rest. Human review is still required.'
          : 'Hay una repetición marcada en reposo. Sigue haciendo falta revisión humana.'
        : english
          ? 'A resting control measurement is missing, or integrity is a problem. Signal quality is not clinical certainty.'
          : 'Falta una medición de control en reposo o hay un problema de integridad. La calidad de señal no es una certeza clínica.',
    };
  }

  return {
    observed: 'stable',
    evidence: unreliable ? 'no_confiable' : 'actualizada',
    summary: english
      ? `The latest reliable heart rate (${Math.round(reliable.value)} bpm) is within baseline.`
      : `La última frecuencia cardíaca confiable (${Math.round(reliable.value)} lpm) está dentro de su línea base.`,
    evidenceDetail: unreliable
      ? english
        ? 'An integrity notice is open. The reliable number does not clear that notice.'
        : 'Hay un aviso de integridad abierto. La cifra confiable no anula ese aviso.'
      : english
        ? 'Recent evidence is available and shows no change from baseline.'
        : 'La evidencia reciente está disponible y no muestra un cambio respecto a su línea base.',
  };
}

export function activeAlerts(
  state: AppState,
  status?: Alert['status'],
): Alert[] {
  return state.alerts.filter((alert) =>
    status ? alert.status === status : alert.status !== 'closed',
  );
}

export function measurementQuality(
  state: AppState,
  crewId: CrewId,
  kind: MeasurementKind = 'heart_rate',
) {
  const now = state.clock.simulatedAt;
  const latest = latestMeasurement(state, crewId, kind);
  const recent = measurementsFor(state, crewId, kind).filter(
    (m) => m.measuredAt <= now && now - m.measuredAt <= 30 * 60000,
  );
  const lastThree = recent
    .filter((m) => m.sensorId === latest?.sensorId)
    .slice(-3);
  // A repeated series is a verification flag, never proof of a broken sensor.
  const possibleFrozen =
    lastThree.length === 3 &&
    new Set(lastThree.map((m) => m.measuredAt)).size === 3 &&
    lastThree.every((m) => m.value === lastThree[0]?.value);
  const ageMinutes = latest ? (now - latest.measuredAt) / 60000 : null;
  const freshnessWindow = kind === 'sleep_hours' ? SLEEP_FRESH_MS : 30 * 60000;
  const stale = latest && now - latest.measuredAt > freshnessWindow;
  const status: 'valid' | 'stale' | 'frozen' | 'pending' = !latest
    ? 'pending'
    : stale || latest.integrity === 'stale'
      ? 'stale'
      : possibleFrozen
        ? 'frozen'
        : !isReliable(latest, now)
          ? 'pending'
          : 'valid';
  return {
    status,
    possibleFrozen,
    measurementId: latest?.id ?? null,
    kind,
    ageMinutes,
    signalQuality: latest?.signalQuality ?? null,
    integrity: latest?.integrity ?? null,
    restControl: recent.some(
      (m) => m.context === 'rest-control' && isReliable(m, now),
    ),
    measuredAt: latest?.measuredAt ?? null,
    note: 'Simulated measurement quality; repeated values require verification, not a diagnosis.',
  };
}

export function vitalTrends(state: AppState, crewId: CrewId) {
  const now = state.clock.simulatedAt;
  const baseline = crewById(crewId).baseline;
  const quality = measurementQuality(state, crewId);
  const readings = measurementsFor(state, crewId, 'heart_rate').filter(
    (m) =>
      m.measuredAt <= now &&
      now - m.measuredAt <= 30 * 60000 &&
      isReliable(m, now),
  );
  // Distinct timestamps prevent duplicate packets from inflating the regression.
  const samples = [...new Map(readings.map((m) => [m.measuredAt, m])).values()];
  const current = quality.status === 'valid' ? samples.at(-1) : undefined;
  const usable = current ? samples : [];
  const meanX =
    usable.reduce((n, m) => n + (m.measuredAt - now) / 60000, 0) /
    (usable.length || 1);
  const meanY = usable.reduce((n, m) => n + m.value, 0) / (usable.length || 1);
  const denominator = usable.reduce(
    (n, m) => n + ((m.measuredAt - now) / 60000 - meanX) ** 2,
    0,
  );
  const slope =
    denominator > 0
      ? usable.reduce(
          (n, m) =>
            n + ((m.measuredAt - now) / 60000 - meanX) * (m.value - meanY),
          0,
        ) / denominator
      : null;
  return {
    windowMinutes: 30,
    hrMin: baseline.hrMin,
    hrMax: baseline.hrMax,
    currentHr: current?.value ?? null,
    deltaHr: current ? current.value - baseline.hrMax : null,
    deltaFromMidpoint: current
      ? current.value - (baseline.hrMin + baseline.hrMax) / 2
      : null,
    slopeBpmPerMinute: slope === null ? null : Number(slope.toFixed(4)),
    sampleCount: usable.length,
    measurementIds: usable.map((m) => m.id),
    quality: quality.status,
    note: 'deltaHr = current minus upper baseline; trend is descriptive and does not establish a cause.',
  };
}

export function activeHealthAlerts(state: AppState, crewId: CrewId) {
  return activeAlerts(state).filter(
    (a) => a.crewId === crewId && (a.type === 'change' || a.type === 'symptom'),
  );
}
