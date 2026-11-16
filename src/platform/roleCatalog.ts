import type { WorkspaceRole } from './workspace'
import { ChiefArt, CrewArt, MedicArt, PsychArt } from '../components/role/RoleArt'
import type { ComponentType } from 'react'

export type RoleCardCopy = {
  id: WorkspaceRole
  name: { es: string; en: string }
  blurb: { es: string; en: string }
  caps: { es: string[]; en: string[] }
  cta: { es: string; en: string }
  Art: ComponentType<{ className?: string }>
}

export const ROLE_CARDS: RoleCardCopy[] = [
  {
    id: 'chief',
    name: { es: 'Jefe de misión', en: 'Mission Commander' },
    blurb: {
      es: 'Organizá la tripulación, prepará los recursos y supervisá el estado de la misión.',
      en: 'Organize the crew, prepare resources, and supervise mission status.',
    },
    caps: {
      es: ['Tripulación y roles', 'Checklist de preparación', 'Alertas operativas'],
      en: ['Crew and roles', 'Preparation Checklist', 'Operational alerts'],
    },
    cta: { es: 'Explorar como jefe', en: 'Explore as Mission Commander' },
    Art: ChiefArt,
  },
  {
    id: 'crew',
    name: { es: 'Tripulante', en: 'Crew Member' },
    blurb: {
      es: 'Consultá tu salud, registrá cómo te sentís y recibí acompañamiento.',
      en: 'Check your health, log how you feel, and receive support.',
    },
    caps: {
      es: ['Chequeo diario', 'Síntomas y descanso', 'Quirón personal'],
      en: ['Daily Check-in', 'Symptoms and rest', 'Personal Quirón'],
    },
    cta: { es: 'Explorar como tripulante', en: 'Explore as Crew Member' },
    Art: CrewArt,
  },
  {
    id: 'medic',
    name: { es: 'Médico', en: 'Medic' },
    blurb: {
      es: 'Revisá casos autorizados, organizá consultas y acompañá el seguimiento físico.',
      en: 'Review authorized cases, organize visits, and support physical follow-up.',
    },
    caps: {
      es: ['Casos con permiso', 'Agenda clínica', 'Evidencia oficial'],
      en: ['Granted cases', 'Clinical schedule', 'Official evidence'],
    },
    cta: { es: 'Explorar como médico', en: 'Explore as Physician' },
    Art: MedicArt,
  },
  {
    id: 'psychologist',
    name: { es: 'Psicólogo', en: 'Psychologist' },
    blurb: {
      es: 'Consultá seguimientos autorizados y brindá acompañamiento emocional.',
      en: 'Review authorized follow-ups and provide emotional support.',
    },
    caps: {
      es: ['Sesiones y agenda', 'Resúmenes compartidos', 'Acceso voluntario'],
      en: ['Sessions and schedule', 'Shared summaries', 'Voluntary access'],
    },
    cta: { es: 'Explorar como psicólogo', en: 'Explore as Psychologist' },
    Art: PsychArt,
  },
]