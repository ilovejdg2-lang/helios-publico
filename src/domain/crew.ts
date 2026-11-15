import type { CrewId } from '../../shared/types';

export interface Baseline {
  hrMin: number;
  hrMax: number;
  sleepMin: number;
  sleepMax: number;
  spo2Min: number;
  spo2Max: number;
  tempMin: number;
  tempMax: number;
  respMin: number;
  respMax: number;
}

export interface CrewProfile {
  id: CrewId;
  name: string;
  callSign: string;
  duty: string;
  location: string;
  baseline: Baseline;
}

export const CREW: readonly CrewProfile[] = [
  {
    id: 'elena-torres',
    name: 'Elena Torres',
    callSign: 'Tripulante 01',
    duty: 'Especialista de misión',
    location: 'Módulo Hábitat A',
    baseline: {
      hrMin: 64,
      hrMax: 76,
      sleepMin: 7,
      sleepMax: 8,
      spo2Min: 96,
      spo2Max: 99,
      tempMin: 36.4,
      tempMax: 37.1,
      respMin: 12,
      respMax: 14,
    },
  },
  {
    id: 'mateo-ruiz',
    name: 'Mateo Ruiz',
    callSign: 'Tripulante 02',
    duty: 'Ingeniero de sistemas',
    location: 'Laboratorio',
    baseline: {
      hrMin: 60,
      hrMax: 72,
      sleepMin: 7,
      sleepMax: 8,
      spo2Min: 96,
      spo2Max: 99,
      tempMin: 36.3,
      tempMax: 37,
      respMin: 12,
      respMax: 16,
    },
  },
  {
    id: 'sofia-chen',
    name: 'Sofía Chen',
    callSign: 'Tripulante 03',
    duty: 'Científica de carga',
    location: 'Módulo Ciencia',
    baseline: {
      hrMin: 62,
      hrMax: 74,
      sleepMin: 7,
      sleepMax: 8.2,
      spo2Min: 96,
      spo2Max: 99,
      tempMin: 36.4,
      tempMax: 37.1,
      respMin: 12,
      respMax: 16,
    },
  },
  {
    id: 'alex-morgan',
    name: 'Alex Morgan',
    callSign: 'Tripulante 04',
    duty: 'Piloto',
    location: 'Módulo Hábitat B',
    baseline: {
      hrMin: 58,
      hrMax: 70,
      sleepMin: 7,
      sleepMax: 8,
      spo2Min: 96,
      spo2Max: 99,
      tempMin: 36.3,
      tempMax: 37,
      respMin: 12,
      respMax: 16,
    },
  },
];

const DUTY_EN: Record<string, string> = {
  'Especialista de misión': 'Mission specialist',
  'Ingeniero de sistemas': 'Systems engineer',
  'Científica de carga': 'Payload scientist',
  Piloto: 'Pilot',
};

const PLACE_EN: Record<string, string> = {
  'Módulo Hábitat A': 'Habitat module A',
  Laboratorio: 'Laboratory',
  'Módulo Ciencia': 'Science module',
  'Módulo Hábitat B': 'Habitat module B',
};

export function crewDuty(
  profile: CrewProfile,
  lang: 'en' | 'es' = 'en',
): string {
  if (lang === 'es') return profile.duty;
  return DUTY_EN[profile.duty] ?? profile.duty;
}

export function crewPlace(
  profile: CrewProfile,
  lang: 'en' | 'es' = 'en',
): string {
  if (lang === 'es') return profile.location;
  return PLACE_EN[profile.location] ?? profile.location;
}

export function crewById(id: CrewId): CrewProfile {
  const profile = CREW.find((crew) => crew.id === id);
  if (!profile) throw new Error(`Tripulante desconocido: ${id}`);
  return profile;
}
