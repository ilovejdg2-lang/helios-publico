import type { SpaceShareLevel } from '../persistence/space'

export interface SpacePreview {
  teamLine: string | null
  cardText: string
}

export function spacePreview(firstName: string, level: SpaceShareLevel, text: string): SpacePreview {
  const body = text.trim()
  if (level === 'solo_yo') {
    return { teamLine: null, cardText: body ? `Solo tú lo ves: ${body}` : 'Solo tú lo ves.' }
  }
  if (level === 'generica') {
    const line = genericLine(firstName, body)
    return { teamLine: line, cardText: line }
  }
  const line = body ? `${firstName}: ${body}` : `${firstName}: sin texto`
  return { teamLine: line, cardText: line }
}

function genericLine(firstName: string, text: string): string {
  const lower = text.toLocaleLowerCase('es')
  if (lower.includes('descans') || lower.includes('cansad')) return `${firstName}: necesita un bloque de descanso`
  if (lower.includes('hablar')) return `${firstName}: quiere hablar con alguien`
  return `${firstName}: pide que alguien del equipo se acerque`
}
