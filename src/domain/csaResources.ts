/** Canadian Space Agency resources used by HELIOS (challenge partner materials). */
export type CsaResource = {
  id: string
  title: { es: string; en: string }
  institution: string
  url: string
  versionNote: { es: string; en: string }
  description: { es: string; en: string }
  useInHelios: { es: string; en: string }
  terms: { es: string; en: string }
  limitations: { es: string; en: string }
  screens: string[]
}

export const CSA_RESOURCES: CsaResource[] = [
  {
    id: 'csa-radiation-health',
    title: {
      es: 'Cómo afecta la radiación al cuerpo humano en el espacio',
      en: 'How radiation affects the human body in space',
    },
    institution: 'Canadian Space Agency (CSA/ASC)',
    url: 'https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp',
    versionNote: { es: 'Página pública CSA · consultada 2026-11-15', en: 'CSA public page · consulted 2026-11-15' },
    description: {
      es: 'Explica tipos de radiación espacial (GCR, SPE, cinturones), efectos agudos/largo plazo y el enfoque ALARA. Incluye tabla de límites de exposición de referencia para astronautas canadienses (órganos hematopoyéticos, ojo, piel).',
      en: 'Explains space radiation types (GCR, SPE, belts), acute/long-term effects and ALARA. Includes reference exposure-limit table for Canadian astronauts (blood-forming organs, eye, skin).',
    },
    useInHelios: {
      es: 'Fundamenta el peligro “Radiación espacial”, textos educativos en Riesgos y el panel ambiental (DONKI/RadLab como clima, no dosis personal CSA).',
      en: 'Grounds the “Space radiation” hazard, educational copy on Risks, and the environmental panel (DONKI/RadLab as weather, not personal CSA dose).',
    },
    terms: {
      es: 'Contenido educativo público de la CSA. No se reutilizan imágenes sin revisar permisos de media.',
      en: 'Public educational CSA content. Images are not reused without checking media permissions.',
    },
    limitations: {
      es: 'Los límites tabulares son contexto educativo; HELIOS no calcula dosis personal ni aplica esos Sv a un tripulante demo.',
      en: 'Tabular limits are educational context; HELIOS does not compute personal dose nor apply those Sv to a demo crewmember.',
    },
    screens: ['/app/riesgos', '/datos', '/misiones/evidencia', 'RadiationPanel'],
  },
  {
    id: 'csa-space-science',
    title: {
      es: 'Investigación científica en el espacio (CSA)',
      en: 'Space science research (CSA)',
    },
    institution: 'Canadian Space Agency (CSA/ASC)',
    url: 'https://www.asc-csa.gc.ca/eng/sciences/',
    versionNote: { es: 'Portal CSA Sciences · consultado 2026-11-15', en: 'CSA Sciences portal · consulted 2026-11-15' },
    description: {
      es: 'Portal de investigación espacial canadiense: salud, ciencias de la vida y exploración como contexto de partner del reto.',
      en: 'Canadian space research portal: health, life sciences and exploration as challenge-partner context.',
    },
    useInHelios: {
      es: 'Enlace de partner en peligros de entorno cerrado y página Datos/Evidencia.',
      en: 'Partner link on closed-environment hazards and Datos/Evidence pages.',
    },
    terms: {
      es: 'Solo citas y enlaces oficiales; sin copiar datasets propietarios.',
      en: 'Official citations and links only; no copying of proprietary datasets.',
    },
    limitations: {
      es: 'No sustituye OSDR/DONKI como fuente de datos operativos del prototipo.',
      en: 'Does not replace OSDR/DONKI as the prototype’s operational data sources.',
    },
    screens: ['/app/riesgos', '/datos', '/misiones/evidencia'],
  },
]
