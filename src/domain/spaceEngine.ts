import { textSafetyCategories } from '../../shared/spaceSafety'
import type { SpaceProposal } from '../../shared/spaceSchema'
import type { AppState, CrewId } from '../../shared/types'
import type { SpaceDataUse, SpaceShareLevel } from '../persistence/space'
import { uiLang } from '../locale'
import { crewPosture, latestReliable, vitalTrends, measurementQuality, activeHealthAlerts } from './selectors'

const HR_HIGH = 150
const HR_LOW = 40

export interface SpaceTurn {
  assistantText: string
  requiereHumanoAhora: boolean
  suggestedLevel: SpaceShareLevel
  categories: string[]
}

export function applySpaceProposal(
  local: SpaceTurn,
  proposal: SpaceProposal | null,
  selectedLevel: SpaceShareLevel = local.suggestedLevel,
): { text: string; level: SpaceShareLevel; source: 'local_engine' | 'model' } {
  if (local.requiereHumanoAhora || !proposal) {
    return {
      text: local.assistantText,
      level: selectedLevel,
      source: 'local_engine',
    }
  }
  return { text: proposal.respuesta, level: selectedLevel, source: 'model' }
}

export function openSpace(
  state: AppState,
  crewId: CrewId,
  dataUse: SpaceDataUse,
  locale: 'es' | 'en' = uiLang(),
): string {
  if (locale === 'en')
    return 'This is your space to talk about how you feel. We can talk without biometric data. What would be helpful today?'
  if (!dataUse.pulse && !dataUse.sleep && !dataUse.symptoms)
    return 'Este es tu espacio para hablar de lo que sientes. Podemos conversar sin datos biométricos. ¿Qué te ayudaría hoy?'
  const posture = crewPosture(state, crewId)
  if (posture.observed === 'no_recent_evaluation') {
    return 'No tengo datos recientes tuyos, así que no puedo comparar. ¿Cómo te sientes ahora?'
  }
  if (posture.observed === 'stable') {
    return 'Tus datos recientes están en tu línea base. No voy a suponer un problema. ¿Cómo te sientes ahora?'
  }
  const bits: string[] = []
  if (dataUse.pulse) {
    const pulse = latestReliable(state, crewId, 'heart_rate')
    if (pulse)
      bits.push(`pulso ${Math.round(pulse.value)} ${pulse.unit} (${pulse.id})`)
  }
  if (dataUse.sleep) {
    const sleep = latestReliable(state, crewId, 'sleep_hours')
    if (sleep) bits.push(`descanso ${sleep.value} ${sleep.unit} (${sleep.id})`)
  }
  if (dataUse.symptoms) {
    const reports = state.symptoms.filter((item) => item.crewId === crewId)
    if (reports.length > 0) {
      bits.push(
        `síntomas ya registrados: ${reports.flatMap((item) => item.symptoms).join(', ')} (${reports.map((item) => item.id).join(', ')})`,
      )
    }
  }
  const used =
    bits.length > 0
      ? ` Uso lo que dejaste activo: ${bits.join('; ')}.`
      : ' Los interruptores de datos están apagados, así que no comparo cifras.'
  return `Hay un cambio respecto de tu línea base.${used} Motor local, simulación. ¿Cómo te sientes ahora?`
}

export function answerSpace(
  state: AppState,
  crewId: CrewId,
  dataUse: SpaceDataUse,
  text: string,
  history: readonly { role: 'user' | 'assistant'; text: string }[] = [],
  locale: 'es' | 'en' = uiLang(),
): SpaceTurn {
  const categories = escalationCategories(state, crewId, dataUse, text)
  if (categories.length > 0) {
    return {
      assistantText:
        locale === 'en'
          ? 'This matters and should not stay only between you and me. Connect with the flight surgeon or a crewmate now. This chat cannot ensure your safety and has not notified anyone. Local simulation.'
          : 'Esto es importante y no debe quedarse solo entre tú y yo. Conecta con el médico de vuelo o con un compañero. Motor local, simulación.',
      requiereHumanoAhora: true,
      suggestedLevel: 'medico',
      categories,
    }
  }
  // Local read-only fallback: no external model and no modification of state.
  if (state.role === 'astronaut' && state.sessionCrewId === crewId) {
    const intent = fold(text)
    let explanation: string | null = null
    if (dataUse.pulse && /tendencia|trend/.test(intent)) {
      const t = vitalTrends(state, crewId)
      explanation = t.currentHr === null
        ? (locale === 'en' ? 'There is not enough reliable recent evidence to calculate a trend.' : 'No hay evidencia reciente confiable suficiente para calcular una tendencia.')
        : (locale === 'en' ? `Heart rate ${t.currentHr} bpm; baseline ${t.hrMin}–${t.hrMax} bpm. Difference from the upper limit: ${t.deltaHr} bpm. Slope over 30 minutes: ${t.slopeBpmPerMinute ?? 'not enough samples'} bpm/min. This does not establish a cause.` : `Pulso ${t.currentHr} lpm; línea base ${t.hrMin}–${t.hrMax} lpm. Diferencia respecto al límite superior: ${t.deltaHr} lpm. Pendiente en 30 minutos: ${t.slopeBpmPerMinute ?? 'sin muestras suficientes'} lpm/min. Esto no establece una causa.`)
    } else if (dataUse.pulse && /calidad|quality|sensor/.test(intent)) {
      const q = measurementQuality(state, crewId)
      explanation = locale === 'en'
        ? `Measurement quality: ${q.status}; signal ${q.signalQuality ?? 'not supplied'}/100. Resting control: ${q.restControl ? 'available' : 'missing'}. Repeated values require verification. Quality is not clinical certainty.`
        : `Calidad de medición: ${q.status}; señal ${q.signalQuality ?? 'sin datos'}/100. Control en reposo: ${q.restControl ? 'disponible' : 'faltante'}. Los valores repetidos requieren verificación. Calidad no equivale a certeza clínica.`
    } else if ((dataUse.pulse || dataUse.symptoms) && /alerta|alert/.test(intent)) {
      const alerts = activeHealthAlerts(state, crewId).filter((a) => a.type === 'change' ? dataUse.pulse : dataUse.symptoms)
      explanation = locale === 'en' ? `${alerts.length} active health notices within your allowed data. These are simulated findings, not diagnoses.` : `${alerts.length} avisos de salud activos dentro de tus datos autorizados. Son hallazgos simulados, no diagnósticos.`
    }
    if (explanation) return { assistantText: explanation, requiereHumanoAhora: false, suggestedLevel: 'solo_yo', categories: [] }
  }
  const conversation = conversationalTurn(text, history, locale)
  if (conversation)
    return {
      assistantText: conversation,
      requiereHumanoAhora: false,
      suggestedLevel: 'solo_yo',
      categories: [],
    }
  if (!dataUse.pulse)
    return {
      assistantText:
        locale === 'en'
          ? 'We can take this at your pace. Would you prefer to talk, take a short pause, or ask someone you trust for company?'
          : 'Podemos ir a tu ritmo. ¿Prefieres conversar, hacer una pausa breve o pedir compañía a alguien de confianza?',
      requiereHumanoAhora: false,
      suggestedLevel: 'solo_yo',
      categories: [],
    }
  return guidedTurn(state, crewId, text, locale)
}

export function escalationCategories(
  state: AppState,
  crewId: CrewId,
  dataUse: SpaceDataUse,
  text: string,
): string[] {
  const found = textSafetyCategories(text)
  if (dataUse.pulse) {
    const pulse = latestReliable(state, crewId, 'heart_rate')
    if (pulse && (pulse.value >= HR_HIGH || pulse.value <= HR_LOW))
      found.push('pulso fuera del umbral fijo')
  }
  return found
}

function guidedTurn(state: AppState, crewId: CrewId, text: string, locale: 'es' | 'en'): SpaceTurn {
  const folded = fold(text)
  const english = locale === 'en'
  const posture = crewPosture(state, crewId)
  if (folded.includes('me siento mal') || folded.includes('mal ahora') || folded.includes('feel unwell') || folded.includes('feel bad')) {
    const assistantText = posture.observed === 'no_recent_evaluation'
      ? (english ? 'I do not have recent data for you, so I cannot compare. If you feel unwell, it helps to repeat a measurement at rest.' : 'No tengo datos recientes tuyos, así que no puedo comparar. Si te sientes mal, conviene repetir una medición en reposo.')
      : posture.observed === 'stable'
        ? (english ? 'Your recent numbers do not show a change. That does not contradict how you feel. It helps to repeat the measurement at rest.' : 'Tus cifras recientes no muestran un cambio. Eso no contradice cómo te sientes. Conviene repetir la medición en reposo.')
        : (english ? 'I noted that you feel unwell now. You can send the request to the flight surgeon with the text you choose.' : 'Anoté que te sientes mal ahora. Puedes enviar la solicitud al médico de vuelo con el texto que elijas.')
    return { assistantText, requiereHumanoAhora: false, suggestedLevel: 'medico', categories: [] }
  }
  if (folded.includes('hablar') || folded.includes('talk')) {
    return {
      assistantText: english ? 'You can ask to talk with someone. At the generic level the team would see only that, without the reason.' : 'Puedes pedir hablar con alguien. En nivel genérico el equipo vería solo eso, sin el motivo.',
      requiereHumanoAhora: false,
      suggestedLevel: 'generica',
      categories: [],
    }
  }
  if (folded.includes('descans') || folded.includes('cansad') || folded.includes('rest') || folded.includes('tired')) {
    return {
      assistantText: english ? 'I can draft a rest request. At the generic level the team would see that you need a rest block, without the reason.' : 'Puedo armar una solicitud de descanso. En nivel genérico el equipo vería que necesitas un bloque de descanso, sin el motivo.',
      requiereHumanoAhora: false,
      suggestedLevel: 'generica',
      categories: [],
    }
  }
  return {
    assistantText: english ? 'Noted in your space. Review the preview before sending. Local engine, simulation.' : 'Quedó anotado en tu espacio. Revisa la vista previa antes de enviar. Motor local, simulación.',
    requiereHumanoAhora: false,
    suggestedLevel: 'generica',
    categories: [],
  }
}

function fold(text: string): string {
  return text.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '')
}

function conversationalTurn(
  text: string,
  history: readonly { role: 'user' | 'assistant'; text: string }[],
  locale: 'es' | 'en',
) {
  const en = locale === 'en'
  const current = fold(text)
  if (
    /(no quiero (hablar|contar|compartir)|prefiero no|no mas preguntas|stop asking|don't want to (talk|share)|rather not)/.test(
      current,
    )
  )
    return en
      ? 'Of course. You do not need to explain anything else. We can pause here or simply keep you company.'
      : 'Claro. No necesitas contar nada más. Podemos hacer una pausa o quedarnos aquí sin preguntas.'
  const topics = [
    {
      pattern: /estres|agobiad|stress|overwhelm/,
      es: 'lo que te está sobrecargando',
      en: 'what has been overwhelming',
    },
    {
      pattern: /soledad|sol[oa]\b|lonely|alone/,
      es: 'la soledad que mencionaste',
      en: 'the loneliness you mentioned',
    },
    {
      pattern: /frustra|enoj|anger/,
      es: 'esa frustración',
      en: 'that frustration',
    },
    {
      pattern: /conflic|discut|companer|argument|crewmate/,
      es: 'la situación con tu compañero',
      en: 'the situation with your crewmate',
    },
    {
      pattern: /cansad|cansanc|agot|tired|fatigue|exhaust/,
      es: 'el cansancio',
      en: 'the tiredness',
    },
  ]
  const previous = [...history].reverse().find((m) => m.role === 'user')
  const topic =
    topics.find((t) => t.pattern.test(current)) ??
    (/^(si|yes|eso|that|lo mismo|sigo|todavia)/.test(current) && previous
      ? topics.find((t) => t.pattern.test(fold(previous.text)))
      : undefined)
  if (!topic) return null
  const last = [...history].reverse().find((m) => m.role === 'assistant')?.text
  const reply = en
    ? `I hear you about ${topic.en}. You do not have to handle it alone. Would it help to tell me what feels hardest right now?`
    : `Te escucho sobre ${topic.es}. No tienes que resolverlo todo ahora. ¿Te ayudaría contar qué se está haciendo más difícil?`
  return last === reply
    ? en
      ? 'We can go slowly. A short pause or some company might help; you choose what feels useful.'
      : 'Podemos ir despacio. Una pausa breve o algo de compañía podrían ayudarte; tú eliges lo que te resulte útil.'
    : reply
}
