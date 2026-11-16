import type { Lang } from '../locale'
import {
  DATA_SOURCES,
  DIFFERENTIATORS,
  DOCUMENTS,
  QUIRON_PRINCIPLES,
  QUIRON_QUESTIONS,
  STAGES,
  TEAM,
  type DataSource,
  type DocCard,
  type TeamMember,
} from './landing'

const NAV_EN = ['Home', 'The project', 'How it works', 'About us', 'Video', 'Documents', 'Data'] as const

const STAGES_EN = [
  {
    title: 'Preflight',
    lead: 'Prepare the mission with organized information and resources.',
    items: [
      'Record the mission characteristics.',
      'Review authorized individual needs.',
      'Identify proposed, approved, and missing resources.',
      'Prepare reviews for the responsible team.',
    ],
  },
  {
    title: 'In Flight',
    lead: 'Support follow-up during the mission.',
    items: [
      'Check indicators and changes.',
      'Review how recent and reliable the measurements are.',
      'Record symptoms and consult resources.',
      'Enable specialized support when it applies.',
    ],
  },
  {
    title: 'Completed',
    lead: 'Keep continuity after return.',
    items: [
      'Review progress.',
      'Keep episodes and pending reviews.',
      'Review resources that were used.',
      'Organize professional follow-up.',
    ],
  },
] as const

const DIFFERENTIATORS_EN = [
  { title: 'Full mission cycle', text: 'Support from preparation through return, without treating each stage as a separate system.' },
  { title: 'Preparation and inventory', text: 'Review of authorized individual needs and of proposed, approved, or missing resources.' },
  { title: 'Indicators with context', text: 'Measurements are shown with age, quality, and integrity, not as a lone number.' },
  { title: 'Wellbeing and consent', text: 'A private space for emotional wellbeing, with an editable summary before sharing.' },
  { title: 'Continuity through interruptions', text: 'Essential functions can continue locally and sync when the link is available again.' },
  { title: 'Mission Review', text: 'Keeps episodes, pending reviews, and used resources after return.' },
] as const

const QUESTIONS_EN = [
  'What should I review before boarding?',
  'Which resources are still pending approval?',
  'What changed compared with my earlier measurements?',
  'What information still needs to be checked?',
  'What follow-up is still open after return?',
] as const

const PRINCIPLES_EN = [
  { title: 'Visible sources', text: 'Information is tied to evidence and context available in the prototype.' },
  { title: 'Missing data', text: 'The assistant says what is not confirmed instead of inventing certainty.' },
  { title: 'Human authorization', text: 'Private summaries need review and authorization before they are shared.' },
] as const

const CAPABILITIES_EN = [
  { title: 'Quirón Bot', text: 'A query assistant aimed at the evidence available in the prototype. It answers with visible sources, recognizes missing data, and does not invent clinical certainty.' },
  { title: 'Data quality', text: 'Demonstration measurements include age, integrity, and context so an isolated number is not read as absolute truth.' },
  { title: 'Inventory and resources', text: 'Tracking of proposed, approved, or missing resources tied to mission preparation.' },
  { title: 'Specialized support', text: 'Flows that make human review easier when the context suggests it, without replacing professional judgment.' },
  { title: 'Privacy and consent', text: 'A private space for emotional wellbeing with an editable summary before any authorized sharing.' },
  { title: 'Local continuity and sync', text: 'Essential functions can continue locally and sync when the link is available again.' },
] as const

const DOCS_EN: Record<string, { title: string; description: string; language: string }> = {
  proposal: { title: 'Project proposal', description: 'Scope, problem, and vision of HELIOS as a support platform.', language: 'Spanish' },
  presentation: { title: 'Presentation', description: 'Support material for demos and talks about the prototype.', language: 'Spanish' },
  costs: { title: 'Costs', description: 'Quote and cost breakdown for the HELIOS project.', language: 'Spanish' },
  technical: { title: 'Technical documentation', description: 'Contracts, commands, variables, and implementation decisions of the prototype.', language: 'Spanish' },
  architecture: { title: 'System architecture', description: 'Boundaries of the frontend, NestJS backend, local persistence, and simulator.', language: 'Spanish' },
  tests: { title: 'Prototype tests and validation', description: 'Plan and evidence for simulator tests and the demonstration experience.', language: 'Spanish' },
  references: { title: 'References and sources', description: 'Scientific documents and official portals used as design context.', language: 'Spanish' },
}

const SOURCES_EN: Record<string, Pick<DataSource, 'name' | 'type' | 'description' | 'useInHelios' | 'versionNote' | 'terms' | 'limitations'>> = {
  'hrp-hazards': {
    name: 'NASA HRP · Hazards',
    type: 'Scientific documentation',
    description: 'The five hazards of human spaceflight: radiation, isolation, distance, gravity, and closed environment.',
    useInHelios: 'Dashboard · Risks, body map, indicators, and Quirón context.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA page.',
    limitations: 'Educational frame. Not personal dose or a diagnosis.',
  },
  'hrp-risks': {
    name: 'NASA HRP · Risks',
    type: 'Scientific documentation',
    description: 'Human research risks tied to those hazards, including behavioral health.',
    useInHelios: 'Dashboard · Risks, pulse, sleep and mood indicators, and Quirón.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA page.',
    limitations: 'Does not calibrate clinical thresholds in the prototype.',
  },
  'hrr-evidence': {
    name: 'Human Research Roadmap · Evidence',
    type: 'Scientific documentation',
    description: 'Evidence linked to human health risks in space.',
    useInHelios: 'Dashboard · risk library and evidence screen.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public Human Research Roadmap content.',
    limitations: 'Explains risks; it does not diagnose a crew member.',
  },
  'hrr-sleep': {
    name: 'Human Research Roadmap · Sleep Risk',
    type: 'Scientific documentation',
    description: 'Risk of sleep loss, circadian desynchrony, and work overload.',
    useInHelios: 'Dashboard · sleep card in the risk library.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public Human Research Roadmap content.',
    limitations: 'Does not calibrate clinical thresholds or train models.',
  },
  'med-ops': {
    name: 'Medical Operations (6.0)',
    type: 'Medical operations',
    description: 'Reference for crew medical operations.',
    useInHelios: 'Dashboard · operational risks, prep checklist, and Quirón.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA page.',
    limitations: 'Operational context. Check the cited version; it is not a HELIOS clinical protocol.',
  },
  ochmo: {
    name: 'OCHMO Technical Briefs',
    type: 'Technical documentation',
    description: 'Technical briefs on space health and medical care.',
    useInHelios: 'Dashboard · risk library and evidence.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA OCHMO catalog.',
    limitations: 'The catalog does not replace a specific brief.',
  },
  osdr: {
    name: 'Biological & Physical Sciences / OSDR',
    type: 'Open data',
    description: 'Portal for spaceflight biological and physical data, including OSDR.',
    useInHelios: 'Dashboard · Risks (gravity) and study lookup. No bulk ingestion.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA Science portal.',
    limitations: 'Not every study is human or clinical. Not simulator biometrics.',
  },
  'osdr-api': {
    name: 'OSDR BioData API',
    type: 'Live API',
    description: 'Public OSDR study API queried by the backend.',
    useInHelios: 'Dashboard · Risks, demo studies via Nest /api/nasa/osdr.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA OSDR API.',
    limitations: 'A sample study is not an astronaut record.',
  },
  donki: {
    name: 'DONKI',
    type: 'Live API',
    description: 'Space-weather event database (flares and related events).',
    useInHelios: 'Dashboard · environmental alerts and Risks (radiation). Nest /api/nasa/donki.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA CCMC data.',
    limitations: 'Space weather, not a crew member’s personal dose.',
  },
  radlab: {
    name: 'RadLab',
    type: 'Live API',
    description: 'Radiation research measurements for environmental context.',
    useInHelios: 'Dashboard · Risks, radiation analysis. Nest /api/nasa/radlab.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA RadLab API.',
    limitations: 'Does not compute a person’s dose on the demo mission.',
  },
  'ntrs-eva': {
    name: 'NTRS 20220009964 · EVA',
    type: 'Technical report',
    description: 'Context for metabolic monitoring during extravehicular activity.',
    useInHelios: 'Dashboard · EVA risk in the risk library.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NTRS report.',
    limitations: 'Reference bands for the simulation; no live EMU telemetry.',
  },
  'csa-radiation': {
    name: 'How radiation affects the human body in space',
    type: 'Partner resource',
    description: 'Space radiation types, effects, and the ALARA approach.',
    useInHelios: 'Dashboard · radiation hazard on Risks and evidence.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public CSA education page. Images are not copied.',
    limitations: 'Tabular limits are not applied as the demo crew member’s dose.',
  },
  'csa-sciences': {
    name: 'Space science research',
    type: 'Partner resource',
    description: 'CSA science research portal.',
    useInHelios: 'Dashboard · closed-environment hazard on Risks.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public CSA portal.',
    limitations: 'Context link only. No datasets are imported.',
  },
}

const TEAM_EN: Record<string, Pick<TeamMember, 'title' | 'summary' | 'bio' | 'tags'> & { highlights?: string[] }> = {
  maria: {
    title: 'Systems Engineering student | Full-stack development | Leadership and academic tutoring',
    summary: 'Academic leadership, full-stack development, and an interest in technology with purpose in space exploration.',
    tags: ['Full stack', 'Leadership', 'Scrum', 'AI', 'Academic tutoring'],
    highlights: [
      'Highest program GPA in 2024 and 2025',
      'Student Role Model 2025',
      'Participation in international projects',
      'Team leadership and organization',
      'Full-stack development',
      'Academic tutoring',
      'Interest in NASA and space since childhood',
    ],
    bio: `Third-year Systems Engineering student at the Universidad Nacional de Costa Rica, Chorotega Regional Campus, with a diploma in programming. Her path combines academic excellence, leadership, and participation in international projects.

She received the highest program GPA award in 2024 and 2025 and was recognized as a Student Role Model in 2025. She has also taken part in international projects that earned awards and recognition.

She works across frontend and backend development, databases, and collaboration tools, including JavaScript, TypeScript, C#, C++, HTML, CSS, Node.js, .NET, React, Next.js, and NestJS, plus SQL, MySQL, and PostgreSQL. She uses Git, GitHub, Docker, and JWT authentication, and holds certifications in Scrum and full-stack development.

She stands out for leading and organizing teams, solving problems, and bringing artificial-intelligence tools into her work. She also tutors Calculus, Algebra, Programming I, and Programming Fundamentals.

Her interest in NASA comes from a curiosity about the universe and space exploration that she has had since childhood. In HELIOS, that motivation connects with her interest in building technology with purpose.`,
  },
  david: {
    title: 'Art director | Visual strategist | Senior graphic designer',
    summary: 'More than 15 years turning business goals into coherent, high-impact visual identities.',
    tags: ['Art direction', 'Visual identity', 'Brand strategy', 'Graphic design'],
    bio: `With more than 15 years in the creative industry, David turns complex business goals into high-impact visual narratives. His approach combines art direction, strategic thinking, and technical execution to build identities that communicate an organization’s values and answer its communication challenges.

He specializes in visual identity systems where every color, typeface, and composition has a role in the brand ecosystem. He treats design as a strategic tool for strengthening an organization’s presence through coherent, innovative, results-oriented work.`,
  },
  daniel: {
    title: 'Junior full-stack developer | Software engineering',
    summary: 'Solid foundations in frontend, backend, REST APIs, and maintainable architecture.',
    tags: ['Full stack', 'Backend', 'REST APIs', 'Docker', 'Architecture'],
    bio: `Junior full-stack developer with foundations in frontend and backend development, database management, and software architecture. He works with JavaScript, TypeScript, Node.js, NestJS, .NET, HTML, CSS, SQL, and PostgreSQL, and has experience building REST APIs and maintainable applications.

He uses Git, GitHub, Docker, and Scrum, and has foundational knowledge of DevOps, continuous integration and delivery, cybersecurity, and ethical hacking.

His motivation combines problem solving, continuous learning, and building efficient, secure, reliable solutions. He is especially interested in backend engineering, distributed systems, and modern software architecture.`,
  },
  nohelia: {
    title: 'Floorplan services specialist | Networking technician | Cybersecurity student',
    summary: 'Organization, networks, and ongoing training toward information security.',
    tags: ['Networks', 'Cybersecurity', 'Organization', 'Attention to detail'],
    bio: `With training in executive secretarial work and technical preparation in computer networks, Nohelia combines organizational skills, technical knowledge, and a growing interest in technology.

She currently works as a Floorplan Services Specialist in the software industry, where she strengthens her attention to detail, adaptability, and problem solving.

Driven by curiosity and continuous learning, she is continuing her studies in cybersecurity in order to deepen her knowledge of information security and explore new opportunities in technology.`,
  },
  elian: {
    title: 'Systems Engineering student | Full-stack developer in training',
    summary: 'Web applications with React, NestJS, and PostgreSQL, plus academic tutoring and Scrum training.',
    tags: ['React', 'TypeScript', 'NestJS', 'PostgreSQL', 'Academic tutoring'],
    bio: `Systems Engineering student and full-stack developer in training, with practical experience building web applications that connect frontend, backend, and relational databases through REST APIs. He is currently developing a management platform for Parroquia San Blas de Nicoya as a university graduation project.

He works with JavaScript, TypeScript, React, Vite, Node.js, NestJS, SQL, and PostgreSQL, and uses Git, GitHub, and agile practices. He holds a Scrum Fundamentals certification and a diploma in computer-application programming from the Universidad Nacional de Costa Rica.

He also tutors Calculus and Algebra and assists Student Life, supporting event organization and administrative process improvement. In 2026 he received a university recognition for his participation and academic excellence.

He earned a scholarship to study English at the Centro Cultural Costarricense Norteamericano for his academic performance and, in 2024, placed fourth nationally among Bridge for English students on the TOEIC.

He is interested in software engineering, data, and cybersecurity, and is looking for a professional internship in information technology or software development.`,
  },
}

const NAV_ES = ['Inicio', 'El proyecto', 'Cómo funciona', 'Acerca de nosotros', 'Video', 'Documentos', 'Datos'] as const

export function publicNav(lang: Lang) {
  return [
    { to: '/', end: true },
    { to: '/proyecto', end: false },
    { to: '/como-funciona', end: false },
    { to: '/nosotros', end: false },
    { to: '/video', end: false },
    { to: '/documentos', end: false },
    { to: '/datos', end: false },
  ].map((item, index) => ({
    ...item,
    label: lang === 'es' ? NAV_ES[index] : NAV_EN[index],
  }))
}

export function publicStages(lang: Lang) {
  return STAGES.map((stage, index) => {
    const english = STAGES_EN[index]
    const enStage = {
      id: stage.id,
      title: english.title,
      lead: english.lead,
      items: [...english.items],
    }
    if (lang !== 'es') return enStage
    return {
      id: stage.id,
      title: stage.title || english.title,
      lead: stage.lead || english.lead,
      items: stage.items.length ? [...stage.items] : [...english.items],
    }
  })
}

export function publicDifferentiators(lang: Lang) {
  if (lang !== 'es') return DIFFERENTIATORS_EN
  return DIFFERENTIATORS_EN.map((item, index) => ({
    title: DIFFERENTIATORS[index]?.title || item.title,
    text: DIFFERENTIATORS[index]?.text || item.text,
  }))
}

const CAPABILITIES_ES = [
  { title: 'Quirón Bot', text: 'Asistente de consulta orientado a evidencias disponibles en el prototipo. Responde con fuentes visibles, reconoce datos faltantes y no inventa certeza clínica.' },
  { title: 'Calidad de datos', text: 'Las mediciones de demostración se acompañan de antigüedad, integridad y contexto para evitar leer un número aislado como verdad absoluta.' },
  { title: 'Inventario y recursos', text: 'Seguimiento de recursos propuestos, aprobados o faltantes vinculados a la preparación de la misión.' },
  { title: 'Apoyo especializado', text: 'Flujos para facilitar revisión humana cuando el contexto lo sugiere, sin sustituir criterio profesional.' },
  { title: 'Privacidad y consentimiento', text: 'Espacio privado para bienestar emocional con resumen editable antes de cualquier compartición autorizada.' },
  { title: 'Continuidad local y sincronización', text: 'Funciones esenciales pueden continuar en local y sincronizar cuando el enlace vuelve a estar disponible.' },
] as const

export function publicQuestions(lang: Lang) {
  if (lang !== 'es') return QUESTIONS_EN
  return QUESTIONS_EN.map((item, index) => QUIRON_QUESTIONS[index] || item)
}

export function publicPrinciples(lang: Lang) {
  if (lang !== 'es') return PRINCIPLES_EN
  return PRINCIPLES_EN.map((item, index) => QUIRON_PRINCIPLES[index] ?? item)
}

export function publicCapabilities(lang: Lang) {
  const tones = ['lilac', 'mint', 'rose', 'warm', 'lilac', 'mint'] as const
  return CAPABILITIES_EN.map((item, index) => {
    const spanish = CAPABILITIES_ES[index]
    const copy = lang === 'es' && spanish ? spanish : item
    return { title: copy.title, text: copy.text, tone: tones[index] ?? 'mint' }
  })
}

export function publicTeam(lang: Lang): TeamMember[] {
  return TEAM.map((member) => publicMember(lang, member))
}

export function publicMember(lang: Lang, member: TeamMember): TeamMember {
  const english = TEAM_EN[member.id]
  const enMember: TeamMember = english
    ? {
        ...member,
        title: english.title,
        summary: english.summary,
        bio: english.bio,
        tags: [...english.tags],
        highlights: english.highlights ? [...english.highlights] : member.highlights,
      }
    : member
  if (lang !== 'es') return enMember
  return {
    ...enMember,
    title: member.title || enMember.title,
    summary: member.summary || enMember.summary,
    bio: member.bio || enMember.bio,
    tags: member.tags.length ? [...member.tags] : enMember.tags,
    highlights: member.highlights?.length ? [...member.highlights] : enMember.highlights,
  }
}

export function publicDocs(lang: Lang): DocCard[] {
  return DOCUMENTS.map((doc) => {
    const english = DOCS_EN[doc.id]
    const enDoc: DocCard = english
      ? { ...doc, title: english.title, description: english.description, language: english.language }
      : doc
    if (lang !== 'es') return enDoc
    return { ...enDoc, title: doc.title || enDoc.title, description: doc.description || enDoc.description, language: doc.language || enDoc.language }
  })
}

export function publicSources(lang: Lang): DataSource[] {
  return DATA_SOURCES.map((source) => {
    const english = SOURCES_EN[source.id]
    const enSource: DataSource = english ? { ...source, ...english } : source
    if (lang !== 'es') return enSource
    return { ...enSource, ...source, id: source.id, href: source.href, status: source.status, institution: source.institution, citation: source.citation }
  })
}

export function sourceStatus(lang: Lang, status: DataSource['status']) {
  const english = { utilizado: 'Used', consultado: 'Consulted', propuesto: 'Proposed' }[status]
  if (lang !== 'es') return english
  return { utilizado: 'Utilizado', consultado: 'Consultado', propuesto: 'Propuesto' }[status] || english
}
