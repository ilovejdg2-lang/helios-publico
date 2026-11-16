/** Copy for Space Apps San José judging: Impact, Creativity, Validation, Relevance, Presentation. */

export const JUDGE_CRITERIA = [
  {
    id: 'impact',
    es: {
      title: 'Impacto',
      claim:
        'HELIOS reduce el riesgo de mezclar roles y de compartir salud sin consentimiento en una misión simulada: cada persona ve solo lo autorizado.',
      prove: 'Demo grant → médico ve → revocar → 403 / “sin permiso”.',
    },
    en: {
      title: 'Impact',
      claim:
        'HELIOS reduces role-mixing and unauthorized health sharing in a simulated mission: each person only sees what they are granted.',
      prove: 'Demo grant → medic sees data → revoke → 403 / “no grant”.',
    },
  },
  {
    id: 'creativity',
    es: {
      title: 'Creatividad',
      claim:
        'No es un monitor genérico: cuatro espacios (jefe, tripulante, médico, psicólogo) + Quirón físico/emocional con privacidad por defecto.',
      prove: 'Cambiar Rol y mostrar Mi salud vs Atención médica vs Bienestar.',
    },
    en: {
      title: 'Creativity',
      claim:
        'Not a generic vitals wall: four workspaces (chief, crew, medic, psychologist) + Quirón physical/emotional with privacy by default.',
      prove: 'Switch Role and show My Health vs Medical care vs Wellbeing.',
    },
  },
  {
    id: 'validation',
    es: {
      title: 'Validación',
      claim:
        'APIs NASA reales (OSDR, DONKI, RadLab) con fecha de consulta y caché etiquetada. Reglas de prep 80% + críticos en backend. Permisos con prueba automática.',
      prove: 'Abrir Riesgos NASA · ver “Consultado en NASA” · start bloqueado si prep < 80%.',
    },
    en: {
      title: 'Validation',
      claim:
        'Live NASA APIs (OSDR, DONKI, RadLab) with fetch timestamps and labeled cache. Prep 80% + critical rules on the backend. Permissions covered by automated tests.',
      prove: 'Open NASA Risks · show “Retrieved from NASA” · start blocked if prep < 80%.',
    },
  },
  {
    id: 'relevance',
    es: {
      title: 'Relevancia',
      claim:
        'Alinea preparación, monitoreo a bordo y continuidad con fuentes HRR/OCHMO/OSDR. No inventa dosis personal ni diagnóstico clínico.',
      prove: 'Disclaimer en pantalla + fuentes oficiales enlazadas.',
    },
    en: {
      title: 'Relevance',
      claim:
        'Aligns preparation, onboard monitoring, and continuity with HRR/OCHMO/OSDR sources. Does not invent personal dose or clinical diagnosis.',
      prove: 'On-screen disclaimer + linked official sources.',
    },
  },
  {
    id: 'presentation',
    es: {
      title: 'Presentación',
      claim:
        'Demo guiada de 7 pasos + guion de defensa en la plataforma. Frase fija: tecnología al servicio del problema humano.',
      prove: 'Usar “Demo jueces” y este panel durante el pitch.',
    },
    en: {
      title: 'Presentation',
      claim:
        '7-step guided demo + in-app defense script. Fixed line: technology serves the human problem.',
      prove: 'Use “Judge demo” and this panel during the pitch.',
    },
  },
] as const

export const PITCH_CLOSING = {
  es: 'HELIOS no inventa medicina espacial: organiza roles, consentimiento y evidencia NASA abierta para que un equipo humano decida mejor en una misión simulada.',
  en: 'HELIOS does not invent space medicine: it organizes roles, consent, and open NASA evidence so a human team can decide better in a simulated mission.',
} as const

export const DEMO_SCRIPT = [
  {
    es: 'Problema (30 s): en misión, salud + privacidad + roles distintos; un dashboard único falla.',
    en: 'Problem (30 s): on mission, health + privacy + different roles; one generic dashboard fails.',
  },
  {
    es: 'Solución (20 s): HELIOS separa jefe / tripulante / médico / psicólogo con consentimiento.',
    en: 'Solution (20 s): HELIOS separates chief / crew / medic / psychologist with consent.',
  },
  {
    es: 'MVP (2 min): grant vitales → médico ve → revocar; Riesgos NASA con timestamp OSDR/RadLab.',
    en: 'MVP (2 min): grant vitals → medic sees → revoke; NASA Risks with OSDR/RadLab timestamp.',
  },
  {
    es: 'Límites (20 s): simulación; no diagnóstico; NASA = contexto, no telemetría del astronauta.',
    en: 'Limits (20 s): simulation; not diagnosis; NASA = context, not astronaut telemetry.',
  },
  {
    es: 'Cierre: frase de impacto + continuidad si Nest cae (simulador local).',
    en: 'Close: impact line + continuity if Nest drops (local simulator).',
  },
] as const

export const NASA_PROOF = [
  {
    id: 'osdr',
    label: 'OSDR BioData v2',
    docs: 'https://visualization.osdr.nasa.gov/biodata/api/',
    nest: 'GET /api/nasa/osdr/studies/OSD-575',
    ui: '/app/riesgos',
  },
  {
    id: 'donki',
    label: 'DONKI / CCMC',
    docs: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
    nest: 'GET /api/nasa/donki/events',
    ui: '/app/mision · Alertas ambientales',
  },
  {
    id: 'radlab',
    label: 'RadLab',
    docs: 'https://visualization.osdr.nasa.gov/radlab/gui/data-api/',
    nest: 'GET /api/nasa/radlab/measurements',
    ui: '/app/riesgos · Radiation Analysis',
  },
] as const
