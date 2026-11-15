import { SYSTEM_PROMPT, type AnalysisContextInput } from '../shared/aiSchema'
import { SPACE_SYSTEM_PROMPT, type SpaceContextInput } from '../shared/spaceSchema'

export function buildModelMessages(context: AnalysisContextInput): { system: string; user: string } {
  const { question, symptoms, ...rest } = context
  return {
    system: SYSTEM_PROMPT,
    user: JSON.stringify({
      task: question?.trim() || 'Resumí el episodio para una revisión humana.',
      data: rest,
      untrustedData: { symptoms },
    }),
  }
}

export function buildSpaceMessages(context: SpaceContextInput): { system: string; user: string } {
  const { textoPersona, ...rest } = context
  return {
    system: SPACE_SYSTEM_PROMPT,
    user: JSON.stringify({
      task: 'Propón una respuesta y una solicitud. No envíes nada.',
      data: rest,
      untrustedData: { textoPersona },
    }),
  }
}
