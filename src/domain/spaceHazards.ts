/** NASA “5 Hazards of Human Spaceflight” educational framing for HELIOS. */
export type SpaceHazard = {
  id: string
  title: { es: string; en: string }
  summary: { es: string; en: string }
  relatedRisks: { es: string; en: string }
  heliosContext: { es: string; en: string }
  limits: { es: string; en: string }
  prepFollowUp: { es: string; en: string }
  sources: { title: string; url: string; institution: string }[]
}

export const SPACE_HAZARDS: SpaceHazard[] = [
  {
    id: 'radiation',
    title: { es: 'Radiación espacial', en: 'Space radiation' },
    summary: {
      es: 'La exposición a partículas energéticas y radiación galáctica aumenta fuera del campo magnético terrestre.',
      en: 'Exposure to energetic particles and galactic radiation rises beyond Earth’s magnetic field.',
    },
    relatedRisks: {
      es: 'Riesgos de cáncer, degeneración tisular y efectos agudos durante eventos solares (contexto HRP).',
      en: 'Cancer risk, tissue degeneration and acute effects during solar events (HRP context).',
    },
    heliosContext: {
      es: 'HELIOS muestra clima espacial DONKI/RadLab como contexto ambiental de misión, no como dosis personal del tripulante.',
      en: 'HELIOS shows DONKI/RadLab space weather as mission environmental context, not personal crew dose.',
    },
    limits: {
      es: 'Un evento DONKI histórico no mide la exposición actual de una persona a bordo.',
      en: 'A historical DONKI event does not measure a person’s current onboard exposure.',
    },
    prepFollowUp: {
      es: 'Preparación: protocolos de refugio y comunicación. Seguimiento: revisar alertas ambientales y registrar malestar si aparece.',
      en: 'Prep: shelter and comms protocols. Follow-up: review environmental alerts and log symptoms if they appear.',
    },
    sources: [
      { title: 'NASA HRP Hazards', url: 'https://www.nasa.gov/hrp/hazards/', institution: 'NASA HRP' },
      { title: 'DONKI (CCMC)', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/', institution: 'NASA CCMC' },
      {
        title: 'CSA · How radiation affects the human body in space',
        url: 'https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp',
        institution: 'Canadian Space Agency',
      },
    ],
  },
  {
    id: 'isolation',
    title: { es: 'Aislamiento y confinamiento', en: 'Isolation and confinement' },
    summary: {
      es: 'Vivir en un volumen pequeño, lejos de redes sociales habituales, desafía el bienestar conductual.',
      en: 'Living in a small volume far from usual social networks challenges behavioral health.',
    },
    relatedRisks: {
      es: 'Estrés, conflictos de tripulación, alteraciones del sueño y ánimo.',
      en: 'Stress, crew conflict, sleep disturbance and mood changes.',
    },
    heliosContext: {
      es: 'Chequeo diario, autorreporte de ánimo, Quirón emocional y citas con psicología.',
      en: 'Daily check-in, mood self-report, emotional Quirón and psychology appointments.',
    },
    limits: {
      es: 'Un ánimo “3/5” no descarta riesgo psicosocial ni sustituye atención profesional.',
      en: 'A “3/5” mood does not rule out psychosocial risk or replace professional care.',
    },
    prepFollowUp: {
      es: 'Preparación: rutinas de bienestar. Seguimiento: completar chequeos y pedir ayuda sin penalización.',
      en: 'Prep: wellbeing routines. Follow-up: complete check-ins and request help without penalty.',
    },
    sources: [
      { title: 'NASA HRP Hazards', url: 'https://www.nasa.gov/hrp/hazards/', institution: 'NASA HRP' },
      { title: 'NASA HRP Risks', url: 'https://www.nasa.gov/hrp/risks/', institution: 'NASA HRP' },
    ],
  },
  {
    id: 'distance',
    title: { es: 'Distancia de la Tierra', en: 'Distance from Earth' },
    summary: {
      es: 'La demora de comunicación y la autonomía operativa crecen con la distancia.',
      en: 'Communication delay and operational autonomy grow with distance.',
    },
    relatedRisks: {
      es: 'Decisiones médicas con soporte retardado; necesidad de protocolos a bordo.',
      en: 'Medical decisions with delayed support; need for onboard protocols.',
    },
    heliosContext: {
      es: 'Flujos urgentes, resúmenes compartibles y orientación local de Quirón cuando la red falla.',
      en: 'Urgent flows, shareable summaries and local Quirón guidance when the network fails.',
    },
    limits: {
      es: 'HELIOS no reemplaza telemedicina certificada ni garantiza enlace Tierra.',
      en: 'HELIOS does not replace certified telemedicine or guarantee Earth link.',
    },
    prepFollowUp: {
      es: 'Preparación: inventarios y protocolos. Seguimiento: registrar acciones locales pendientes de sync.',
      en: 'Prep: inventories and protocols. Follow-up: log local actions pending sync.',
    },
    sources: [{ title: 'NASA HRP Hazards', url: 'https://www.nasa.gov/hrp/hazards/', institution: 'NASA HRP' }],
  },
  {
    id: 'gravity',
    title: { es: 'Gravedad alterada', en: 'Altered gravity' },
    summary: {
      es: 'Microgravedad o gravedad parcial cambian carga ósea, muscular y cardiovascular.',
      en: 'Microgravity or partial gravity changes bone, muscle and cardiovascular loading.',
    },
    relatedRisks: {
      es: 'Pérdida ósea/muscular, cambios cardiovasculares y de equilibrio (contexto HRP/OSDR).',
      en: 'Bone/muscle loss, cardiovascular and balance changes (HRP/OSDR context).',
    },
    heliosContext: {
      es: 'Indicadores de FC/presión/sueño y biblioteca de riesgos; evidencia OSDR como contexto científico.',
      en: 'HR/BP/sleep indicators and risk library; OSDR evidence as scientific context.',
    },
    limits: {
      es: 'Una FC en reposo “aceptable” no demuestra densidad ósea adecuada.',
      en: 'An “acceptable” resting HR does not prove adequate bone density.',
    },
    prepFollowUp: {
      es: 'Preparación: ejercicio y recursos. Seguimiento: síntomas músculo-esqueléticos en el mapa corporal.',
      en: 'Prep: exercise and resources. Follow-up: musculoskeletal symptoms on the body map.',
    },
    sources: [
      { title: 'NASA HRP Hazards', url: 'https://www.nasa.gov/hrp/hazards/', institution: 'NASA HRP' },
      { title: 'NASA OSDR', url: 'https://osdr.nasa.gov/bio/repo/', institution: 'NASA Ames' },
    ],
  },
  {
    id: 'closed_hostile',
    title: { es: 'Entornos cerrados y hostiles', en: 'Closed and hostile environments' },
    summary: {
      es: 'Hábitats sellados enfrentan calidad del aire, polvo, ruido y sistemas de soporte vital.',
      en: 'Sealed habitats face air quality, dust, noise and life-support systems.',
    },
    relatedRisks: {
      es: 'Exposición ambiental, irritación, fatiga y dependencia de inventarios.',
      en: 'Environmental exposure, irritation, fatigue and inventory dependence.',
    },
    heliosContext: {
      es: 'Inventario, preparación crítica y síntomas con región corporal (p. ej. ojos/respiratorio).',
      en: 'Inventory, critical prep and symptoms with body region (e.g. eyes/respiratory).',
    },
    limits: {
      es: 'HELIOS no mide CO₂ en tiempo real salvo integración futura explícita.',
      en: 'HELIOS does not measure real-time CO₂ unless an explicit future integration exists.',
    },
    prepFollowUp: {
      es: 'Preparación: checklist de hábitat. Seguimiento: reportar síntomas y revisar recursos.',
      en: 'Prep: habitat checklist. Follow-up: report symptoms and review resources.',
    },
    sources: [
      { title: 'NASA HRP Hazards', url: 'https://www.nasa.gov/hrp/hazards/', institution: 'NASA HRP' },
      { title: 'CSA · Space science research', url: 'https://www.asc-csa.gc.ca/eng/sciences/', institution: 'Canadian Space Agency' },
    ],
  },
]
