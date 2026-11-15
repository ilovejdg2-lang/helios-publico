/** Contenido editable de la página pública HELIOS. */

export const LANDING_VIDEO = {
  /** URL de YouTube/Vimeo o ruta local. Vacío = estado “próximamente”. */
  src: '',
  kind: 'none' as 'none' | 'youtube' | 'vimeo' | 'file',
  title: 'Video del proyecto HELIOS',
}

/** Sitio público: la simulación vive en el dashboard desplegado. */
export const SIMULATION_ORIGIN = 'https://helios-gilt-iota.vercel.app'
export const DASHBOARD_PATH = `${SIMULATION_ORIGIN}/app`

export const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/proyecto', label: 'El proyecto', end: false },
  { to: '/como-funciona', label: 'Cómo funciona', end: false },
  { to: '/nosotros', label: 'Acerca de nosotros', end: false },
  { to: '/video', label: 'Video', end: false },
  { to: '/documentos', label: 'Documentos', end: false },
  { to: '/datos', label: 'Datos', end: false },
] as const

/** Video decorativo del hero (distinto del video de presentación). */
export const HERO_MEDIA = {
  kind: 'animation' as 'animation' | 'video',
  src: '',
  poster: '/brand/helios-ecg-bg.jpg',
  credit: 'Escena animada provisional · telemetría simulada',
}

export const DIFFERENTIATORS = [
  {
    title: 'Ciclo completo de la misión',
    text: 'Acompañamiento desde la preparación hasta el regreso, sin tratar cada etapa como un sistema aislado.',
  },
  {
    title: 'Preparación e inventario',
    text: 'Revisión de necesidades individuales autorizadas y de recursos propuestos, aprobados o faltantes.',
  },
  {
    title: 'Indicadores con contexto',
    text: 'Las mediciones se muestran con antigüedad, calidad e integridad, no solo como un número suelto.',
  },
  {
    title: 'Bienestar y consentimiento',
    text: 'Espacio privado para el bienestar emocional, con resumen editable antes de compartir.',
  },
  {
    title: 'Continuidad ante interrupciones',
    text: 'Funciones esenciales pueden seguir en local y sincronizar cuando el enlace vuelve a estar disponible.',
  },
  {
    title: 'Seguimiento posmisión',
    text: 'Conserva episodios, revisiones pendientes y recursos utilizados después del regreso.',
  },
] as const

export const STAGES = [
  {
    id: 'preembarque',
    title: 'Preembarque',
    lead: 'Preparar la misión con información y recursos organizados.',
    items: [
      'Registrar características de la misión.',
      'Revisar necesidades individuales autorizadas.',
      'Identificar recursos propuestos, aprobados y faltantes.',
      'Preparar revisiones para el equipo responsable.',
    ],
  },
  {
    id: 'a-bordo',
    title: 'A bordo',
    lead: 'Acompañar el seguimiento durante la misión.',
    items: [
      'Consultar indicadores y cambios.',
      'Revisar la antigüedad y calidad de las mediciones.',
      'Registrar síntomas y consultar recursos.',
      'Facilitar apoyo especializado cuando corresponda.',
    ],
  },
  {
    id: 'posmision',
    title: 'Posmisión',
    lead: 'Mantener la continuidad después del regreso.',
    items: [
      'Consultar la evolución.',
      'Conservar episodios y revisiones pendientes.',
      'Revisar recursos utilizados.',
      'Organizar el seguimiento profesional.',
    ],
  },
] as const

export const QUIRON_QUESTIONS = [
  '¿Qué debo revisar antes de abordar?',
  '¿Qué recursos siguen pendientes de aprobación?',
  '¿Qué cambió respecto a mis mediciones anteriores?',
  '¿Qué información falta comprobar?',
  '¿Qué seguimiento tengo pendiente después del regreso?',
] as const

export const QUIRON_PRINCIPLES = [
  {
    title: 'Fuentes visibles',
    text: 'La información se vincula a evidencias y contexto disponibles en el prototipo.',
  },
  {
    title: 'Datos faltantes',
    text: 'El asistente reconoce qué no está comprobado en lugar de inventar certeza.',
  },
  {
    title: 'Autorización humana',
    text: 'Los resúmenes privados requieren revisión y autorización antes de compartirse.',
  },
] as const

export interface TeamMember {
  id: string
  slug: string
  name: string
  firstName: string
  title: string
  summary: string
  bio: string
  tags: string[]
  linkedin: string
  initials: string
  photo: string
  accent: 'mint' | 'lilac' | 'rose' | 'warm'
  highlights?: string[]
}

export const TEAM: TeamMember[] = [
  {
    id: 'maria',
    slug: 'maria-del-mar-diaz-ruiz',
    name: 'María del Mar Díaz Ruiz',
    firstName: 'María del Mar',
    title: 'Estudiante de Ingeniería en Sistemas | Desarrollo Full Stack | Liderazgo y tutoría académica',
    summary: 'Liderazgo académico, desarrollo full stack e interés por tecnología con propósito en exploración espacial.',
    bio: `Estudiante de tercer año de Ingeniería en Sistemas en la Universidad Nacional de Costa Rica, Sede Regional Chorotega, con formación de diplomado en el área de programación. Su trayectoria combina excelencia académica, liderazgo y participación en proyectos internacionales.

Obtuvo el reconocimiento al mejor promedio de la carrera en 2024 y 2025 y fue reconocida como Modelo Estudiantil en 2025. Además, ha participado en proyectos internacionales destacados que han recibido premios y reconocimientos.

Cuenta con conocimientos de desarrollo frontend y backend, bases de datos y herramientas de colaboración. Trabaja con JavaScript, TypeScript, C#, C++, HTML, CSS, Node.js, .NET, React, Next.js y NestJS, además de SQL, MySQL y PostgreSQL. Utiliza Git, GitHub, Docker y autenticación mediante JWT, y cuenta con certificaciones en Scrum y desarrollo Full Stack.

Se distingue por su capacidad para liderar y organizar equipos, resolver problemas e incorporar herramientas de inteligencia artificial en sus procesos de trabajo. También se desempeña como tutora de Cálculo, Álgebra, Programación I y Fundamentos de Programación.

Su interés por NASA nace de una curiosidad por el universo y la exploración espacial que la acompaña desde niña. En HELIOS, esa motivación se conecta con su interés por desarrollar tecnología con propósito.`,
    tags: ['Full Stack', 'Liderazgo', 'Scrum', 'IA', 'Tutoría académica'],
    linkedin: 'https://www.linkedin.com/in/maria-del-mar-d%C3%ADaz-ruiz-336369410/',
    initials: 'MD',
    photo: '/brand/team/maria-del-mar.png',
    accent: 'rose',
    highlights: [
      'Mejor promedio de carrera en 2024 y 2025',
      'Modelo Estudiantil 2025',
      'Participación en proyectos internacionales',
      'Liderazgo y organización de equipos',
      'Desarrollo Full Stack',
      'Tutorías académicas',
      'Interés por NASA y el espacio desde la infancia',
    ],
  },
  {
    id: 'david',
    slug: 'david-rojas-montero',
    name: 'David Rojas Montero',
    firstName: 'David',
    title: 'Director de Arte | Estratega Visual | Diseñador Gráfico Senior',
    summary: 'Más de 15 años transformando objetivos de negocio en identidades visuales coherentes y de alto impacto.',
    bio: `Con más de 15 años de experiencia en la industria creativa, David transforma objetivos de negocio complejos en narrativas visuales de alto impacto. Su enfoque integra dirección de arte, pensamiento estratégico y ejecución técnica para desarrollar identidades que comuniquen los valores de una organización y respondan a sus desafíos de comunicación.

Se especializa en sistemas de identidad visual donde cada color, tipografía y composición cumple una función dentro del ecosistema de marca. Concibe el diseño como una herramienta estratégica para fortalecer la presencia de las organizaciones mediante propuestas coherentes, innovadoras y orientadas a resultados.`,
    tags: ['Dirección de arte', 'Identidad visual', 'Estrategia de marca', 'Diseño gráfico'],
    linkedin: 'https://www.linkedin.com/in/david-rojas-montero-50b556192/',
    initials: 'DR',
    photo: '/brand/team/david-rojas.png',
    accent: 'lilac',
  },
  {
    id: 'daniel',
    slug: 'daniel-elizondo-gutierrez',
    name: 'Daniel Emilio Elizondo Gutiérrez',
    firstName: 'Daniel',
    title: 'Desarrollador Full Stack Junior | Ingeniería de Software',
    summary: 'Bases sólidas en frontend, backend, APIs REST y arquitectura mantenible.',
    bio: `Desarrollador Full Stack Junior con bases en desarrollo frontend y backend, gestión de bases de datos y arquitectura de software. Cuenta con conocimientos de JavaScript, TypeScript, Node.js, NestJS, .NET, HTML, CSS, SQL y PostgreSQL, y experiencia en la construcción de APIs REST y aplicaciones mantenibles.

Trabaja con Git, GitHub, Docker y Scrum, y posee conocimientos fundamentales de DevOps, integración y entrega continuas, ciberseguridad y hacking ético.

Su motivación combina la resolución de problemas, el aprendizaje continuo y la creación de soluciones eficientes, seguras y confiables. Tiene especial interés en ingeniería backend, sistemas distribuidos y arquitectura de software moderna.`,
    tags: ['Full Stack', 'Backend', 'APIs REST', 'Docker', 'Arquitectura'],
    linkedin: 'https://www.linkedin.com/in/daniel-elizondo-b48072407/',
    initials: 'DE',
    photo: '/brand/team/daniel-elizondo.png',
    accent: 'mint',
  },
  {
    id: 'nohelia',
    slug: 'nohelia-blanco-baltodano',
    name: 'Nohelia Blanco Baltodano',
    firstName: 'Nohelia',
    title: 'Especialista en Servicios de Planos | Técnica en Redes | Estudiante de Ciberseguridad',
    summary: 'Organización, redes y formación continua hacia la seguridad de la información.',
    bio: `Con formación en Secretariado Ejecutivo y preparación técnica en Redes de Computadoras, Nohelia combina habilidades organizativas, conocimientos técnicos y un interés creciente por la tecnología.

Actualmente trabaja como Floorplan Services Specialist en la industria del software, donde fortalece su atención al detalle, adaptabilidad y capacidad para resolver problemas.

Impulsada por la curiosidad y el aprendizaje continuo, continúa su formación en Ciberseguridad con el objetivo de ampliar sus conocimientos en seguridad de la información y explorar nuevas oportunidades en el sector tecnológico.`,
    tags: ['Redes', 'Ciberseguridad', 'Organización', 'Atención al detalle'],
    linkedin: 'https://www.linkedin.com/in/nohelia-b-5a1a59271/',
    initials: 'NB',
    photo: '/brand/team/nohelia-blanco.jpg',
    accent: 'mint',
  },
  {
    id: 'elian',
    slug: 'elian-fajardo-gutierrez',
    name: 'Elián Camilo Fajardo Gutiérrez',
    firstName: 'Elián',
    title: 'Estudiante de Ingeniería en Sistemas | Desarrollador Full Stack en formación',
    summary: 'Aplicaciones web con React, NestJS y PostgreSQL, más tutoría académica y formación Scrum.',
    bio: `Estudiante de Ingeniería en Sistemas y desarrollador Full Stack en formación, con experiencia práctica construyendo aplicaciones web que conectan frontend, backend y bases de datos relacionales mediante APIs REST. Actualmente desarrolla una plataforma de gestión para la Parroquia San Blas de Nicoya como proyecto universitario de graduación.

Trabaja con JavaScript, TypeScript, React, Vite, Node.js, NestJS, SQL y PostgreSQL, y utiliza Git, GitHub y prácticas ágiles. Cuenta con una certificación en Scrum Fundamentals y un Diplomado en Programación de Aplicaciones Informáticas de la Universidad Nacional de Costa Rica.

Además, se desempeña como tutor de Cálculo y Álgebra y como asistente de Vida Estudiantil, apoyando la organización de actividades y la mejora de procesos administrativos. En 2026 recibió un reconocimiento universitario por su participación y excelencia académica.

Obtuvo una beca para estudiar inglés en el Centro Cultural Costarricense Norteamericano por su desempeño académico y, en 2024, alcanzó el cuarto lugar nacional entre estudiantes del programa Bridge for English en el TOEIC.

Le interesan la ingeniería de software, los datos y la ciberseguridad. Busca una oportunidad de práctica profesional en tecnologías de información o desarrollo de software.`,
    tags: ['React', 'TypeScript', 'NestJS', 'PostgreSQL', 'Tutoría académica'],
    linkedin: 'https://www.linkedin.com/in/eli%C3%A1n-fajardo-guti%C3%A9rrez-9606aa317/',
    initials: 'EF',
    photo: '/brand/team/elian-fajardo.jpg',
    accent: 'warm',
  },
]

export function teamBySlug(slug: string): TeamMember | undefined {
  return TEAM.find((member) => member.slug === slug)
}

export interface DocCard {
  id: string
  title: string
  description: string
  format: string
  language: string
  href: string | null
  status: 'available' | 'soon'
}

export const DOCUMENTS: DocCard[] = [
  {
    id: 'proposal',
    title: 'Propuesta del proyecto',
    description: 'Alcance, problema y visión de HELIOS como plataforma de acompañamiento.',
    format: 'PDF',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'presentation',
    title: 'Presentación',
    description: 'Material de apoyo para demos y espacios de divulgación del prototipo.',
    format: 'PDF',
    language: 'Español',
    href: '/docs/presentacion-helios.pdf',
    status: 'available',
  },
  {
    id: 'costs',
    title: 'Costos',
    description: 'Cotización y desglose de costos del proyecto HELIOS.',
    format: 'DOCX',
    language: 'Español',
    href: '/docs/cotizacion.docx',
    status: 'available',
  },
  {
    id: 'technical',
    title: 'Documentación técnica',
    description: 'Contratos, comandos, variables y decisiones de implementación del prototipo.',
    format: 'Markdown',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'architecture',
    title: 'Arquitectura del sistema',
    description: 'Límites del frontend, backend NestJS, persistencia local y simulador.',
    format: 'Markdown',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'tests',
    title: 'Pruebas y validación del prototipo',
    description: 'Plan y evidencia de pruebas del simulador y de la experiencia de demostración.',
    format: 'Markdown',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'references',
    title: 'Referencias y fuentes',
    description: 'Documentos científicos y portales oficiales usados como contexto de diseño.',
    format: 'DOCX',
    language: 'Español',
    href: '/docs/fuentes-dashboard.docx',
    status: 'available',
  },
]

export interface DataSource {
  id: string
  name: string
  institution: string
  type: string
  description: string
  useInHelios: string
  status: 'utilizado' | 'consultado' | 'propuesto'
  href: string
  versionNote: string
  terms: string
  limitations: string
  citation: string
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'hrp-hazards',
    name: 'NASA HRP · Hazards',
    institution: 'NASA Human Research Program',
    type: 'Documentación científica',
    description: 'Los cinco peligros del vuelo espacial humano: radiación, aislamiento, distancia, gravedad y ambiente cerrado.',
    useInHelios: 'Dashboard · Riesgos, mapa corporal, indicadores y contexto de Quirón.',
    status: 'consultado',
    href: 'https://www.nasa.gov/hrp/hazards/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Página pública de NASA.',
    limitations: 'Marco educativo. No es dosis personal ni diagnóstico.',
    citation: 'National Aeronautics and Space Administration. (s. f.). Hazards. https://www.nasa.gov/hrp/hazards/',
  },
  {
    id: 'hrp-risks',
    name: 'NASA HRP · Risks',
    institution: 'NASA Human Research Program',
    type: 'Documentación científica',
    description: 'Riesgos de investigación humana asociados a esos peligros, incluido el bienestar conductual.',
    useInHelios: 'Dashboard · Riesgos, indicadores de pulso, sueño y ánimo, y Quirón.',
    status: 'consultado',
    href: 'https://www.nasa.gov/hrp/risks/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Página pública de NASA.',
    limitations: 'No calibra umbrales clínicos del prototipo.',
    citation: 'National Aeronautics and Space Administration. (s. f.). Risks. https://www.nasa.gov/hrp/risks/',
  },
  {
    id: 'hrr-evidence',
    name: 'Human Research Roadmap · Evidence',
    institution: 'NASA Human Research Program',
    type: 'Documentación científica',
    description: 'Evidencia asociada a riesgos de salud humana en el espacio.',
    useInHelios: 'Dashboard · biblioteca de riesgos y pantalla de evidencia.',
    status: 'consultado',
    href: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Contenido público del Human Research Roadmap.',
    limitations: 'Explica riesgos; no diagnostica a un tripulante.',
    citation: 'National Aeronautics and Space Administration. (s. f.). Evidence. Human Research Roadmap. https://humanresearchroadmap.nasa.gov/Evidence/',
  },
  {
    id: 'hrr-sleep',
    name: 'Human Research Roadmap · Sleep Risk',
    institution: 'NASA Human Research Program',
    type: 'Documentación científica',
    description: 'Riesgo de pérdida de sueño, desincronización circadiana y sobrecarga de trabajo.',
    useInHelios: 'Dashboard · ficha de sueño en la biblioteca de riesgos.',
    status: 'consultado',
    href: 'https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=100',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Contenido público del Human Research Roadmap.',
    limitations: 'No calibra umbrales clínicos ni entrena modelos.',
    citation: 'National Aeronautics and Space Administration. (s. f.). Sleep risk. Human Research Roadmap. https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=100',
  },
  {
    id: 'med-ops',
    name: 'Medical Operations (6.0)',
    institution: 'NASA',
    type: 'Operaciones médicas',
    description: 'Referencia de operaciones médicas para tripulaciones.',
    useInHelios: 'Dashboard · riesgos operativos, checklist de preparación y Quirón.',
    status: 'consultado',
    href: 'https://www.nasa.gov/reference/6-0-medical-operations/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Página pública de NASA.',
    limitations: 'Contexto operativo. Verificar la versión citada; no es protocolo clínico de HELIOS.',
    citation: 'National Aeronautics and Space Administration. (s. f.). 6.0 Medical operations. https://www.nasa.gov/reference/6-0-medical-operations/',
  },
  {
    id: 'ochmo',
    name: 'OCHMO Technical Briefs',
    institution: 'NASA OCHMO',
    type: 'Documentación técnica',
    description: 'Resúmenes técnicos de salud y atención médica espacial.',
    useInHelios: 'Dashboard · biblioteca de riesgos y evidencia.',
    status: 'consultado',
    href: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Catálogo público de NASA OCHMO.',
    limitations: 'El catálogo no sustituye un brief concreto.',
    citation: 'National Aeronautics and Space Administration. (s. f.). OCHMO technical briefs. https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
  },
  {
    id: 'osdr',
    name: 'Biological & Physical Sciences / OSDR',
    institution: 'NASA',
    type: 'Datos abiertos',
    description: 'Portal de datos biológicos y físicos del vuelo espacial, incluido OSDR.',
    useInHelios: 'Dashboard · Riesgos (gravedad) y consulta de estudios. Sin ingestión masiva.',
    status: 'consultado',
    href: 'https://science.nasa.gov/biological-physical/data/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Portal público de NASA Science.',
    limitations: 'No todo estudio es humano ni clínico. No es biometría del simulador.',
    citation: 'National Aeronautics and Space Administration. (s. f.). Biological & physical sciences data. https://science.nasa.gov/biological-physical/data/',
  },
  {
    id: 'osdr-api',
    name: 'OSDR BioData API',
    institution: 'NASA',
    type: 'API en vivo',
    description: 'API pública de estudios OSDR que el backend consulta.',
    useInHelios: 'Dashboard · Riesgos, estudios de demostración vía Nest /api/nasa/osdr.',
    status: 'utilizado',
    href: 'https://visualization.osdr.nasa.gov/biodata/api/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'API pública de NASA OSDR.',
    limitations: 'Un estudio de ejemplo no es el expediente de un astronauta.',
    citation: 'National Aeronautics and Space Administration. (s. f.). OSDR BioData API. https://visualization.osdr.nasa.gov/biodata/api/',
  },
  {
    id: 'donki',
    name: 'DONKI',
    institution: 'NASA CCMC',
    type: 'API en vivo',
    description: 'Base de eventos de clima espacial (llamaradas y relacionados).',
    useInHelios: 'Dashboard · Alertas ambientales y Riesgos (radiación). Nest /api/nasa/donki.',
    status: 'utilizado',
    href: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Datos públicos de NASA CCMC.',
    limitations: 'Clima espacial, no dosis personal del tripulante.',
    citation: 'NASA Community Coordinated Modeling Center. (s. f.). Space Weather Database of Notifications, Knowledge, Information (DONKI). https://ccmc.gsfc.nasa.gov/tools/DONKI/',
  },
  {
    id: 'radlab',
    name: 'RadLab',
    institution: 'NASA',
    type: 'API en vivo',
    description: 'Mediciones de investigación en radiación para contexto ambiental.',
    useInHelios: 'Dashboard · Riesgos, análisis de radiación. Nest /api/nasa/radlab.',
    status: 'utilizado',
    href: 'https://visualization.osdr.nasa.gov/radlab/gui/data-api/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'API pública de NASA RadLab.',
    limitations: 'No calcula la dosis de una persona en la misión demo.',
    citation: 'National Aeronautics and Space Administration. (s. f.). RadLab data API. https://visualization.osdr.nasa.gov/radlab/gui/data-api/',
  },
  {
    id: 'ntrs-eva',
    name: 'NTRS 20220009964 · EVA',
    institution: 'NASA NTRS',
    type: 'Informe técnico',
    description: 'Contexto de monitoreo metabólico en actividad extravehicular.',
    useInHelios: 'Dashboard · riesgo de EVA en la biblioteca de riesgos.',
    status: 'consultado',
    href: 'https://ntrs.nasa.gov/citations/20220009964',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Informe público en NTRS.',
    limitations: 'Bandas de referencia para la simulación; no hay telemetría EMU en vivo.',
    citation: 'National Aeronautics and Space Administration. (s. f.). NTRS 20220009964. https://ntrs.nasa.gov/citations/20220009964',
  },
  {
    id: 'csa-radiation',
    name: 'Radiación y el cuerpo humano en el espacio',
    institution: 'Agencia Espacial Canadiense',
    type: 'Recurso partner',
    description: 'Tipos de radiación espacial, efectos y enfoque ALARA.',
    useInHelios: 'Dashboard · peligro de radiación en Riesgos y evidencia.',
    status: 'consultado',
    href: 'https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Contenido educativo público de la CSA. No se copian imágenes.',
    limitations: 'Los límites tabulares no se aplican como dosis del tripulante demo.',
    citation: 'Canadian Space Agency. (s. f.). How radiation affects the human body in space. https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp',
  },
  {
    id: 'csa-sciences',
    name: 'Investigación en ciencias espaciales',
    institution: 'Agencia Espacial Canadiense',
    type: 'Recurso partner',
    description: 'Portal de investigación científica de la CSA.',
    useInHelios: 'Dashboard · peligro de ambiente cerrado en Riesgos.',
    status: 'consultado',
    href: 'https://www.asc-csa.gc.ca/eng/sciences/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Portal público de la CSA.',
    limitations: 'Solo enlace de contexto. No se importan datasets.',
    citation: 'Canadian Space Agency. (s. f.). Space science research. https://www.asc-csa.gc.ca/eng/sciences/',
  },
]
