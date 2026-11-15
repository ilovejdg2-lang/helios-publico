/* global process, console, AbortController */
// Uses only synthetic in-memory records; no writes, real user records or secret output.
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
const backend = resolve(import.meta.dirname, '../../NASA_SPACE_APP-BACKEND')
const backendRequire = createRequire(resolve(backend, 'package.json'))
backendRequire('ts-node').register({ project: resolve(backend, 'tsconfig.json'), transpileOnly: true })
const load = (file) => backendRequire(resolve(backend, file))
process.chdir(backend)
load('src/config/env.ts').loadBackendEnv()
const { resolveProvider } = load('src/ai/provider.ts')
const { AiService } = load('src/ai/ai.service.ts')
const { DialogueService } = load('src/ai/dialogue.service.ts')
const { dialogueContextKey } = load('src/ai/dialogue.contract.ts')
const { SpaceToolsService } = load('src/ai/space-tools.service.ts')
const { SpaceConversationService } = load('src/ai/space-conversation.service.ts')
const { createInitialState } = load('src/simulation/domain/scenarios.ts')

async function main() {
  const runtime = resolveProvider()
  if (runtime.provider?.name !== 'gemini') throw new Error('gemini_not_configured')
  if (process.argv.includes('--diagnostic') && runtime.provider.converse) {
    const original = runtime.provider.converse.bind(runtime.provider)
    runtime.provider.converse = async (input) => {
      const reply = await original(input)
      console.log(JSON.stringify({ syntheticProviderReply: reply.text }))
      return reply
    }
  }
  const ai = new AiService(runtime)
  const state = createInitialState('baseline')
  state.role = 'astronaut'
  state.sessionCrewId = 'elena-torres'
  state.selectedEpisodeId = null
  const sessions = { get: () => ({ state }) }
  const sid = randomUUID()
  const dialogue = new DialogueService(ai, sessions)
  const tools = new SpaceToolsService(sessions)
  const space = new SpaceConversationService(ai, tools)
  const token = tools.issue(sid, {
    crewId: state.sessionCrewId, pin: '1001', modelConsent: true, historyConsent: true,
    dataUse: { pulse: false, sleep: false, symptoms: false, mission: false },
  }).token
  const openDashboard = process.argv.includes('--case=dashboard-open')
  const symptomFollowup = process.argv.includes('--case=symptom-followup')
  const conversations = symptomFollowup ? {
    es: ['hola', 'me siento mal', 'fisico', 'dolor de cabeza', 'fisica', 'Cambiemos de tema: ¿qué es la física orbital?'],
    en: ['hi', "I don't feel well", 'physical', 'headache', 'physical', 'Change of topic: what is orbital physics?'],
  } : openDashboard ? {
    es: ['me siento mal', 'Es más emocional, estoy frustrado con el trabajo', 'Quiero hablar en privado sobre mi historial médico', '¿Qué es una alerta?'],
    en: ["I don't feel well", 'It is emotional, I am frustrated with work', 'I want to review my medical history in private', 'What is an alert?'],
  } : {
    es: ['Hola', '¿Qué es una alerta y por qué importa la calidad del sensor?', '¿Y eso por qué?', 'No entiendo, explícamelo más sencillo'],
    en: ['Hi', 'What is an alert and why does sensor quality matter?', 'Why is that?', 'I still do not understand, please simplify'],
  }
  // These are behavioral screens, not proof against all factual hallucinations.
  for (const mode of ['public', 'dashboard', 'space']) {
    const selectedMode = process.argv.find((arg) => arg.startsWith('--mode='))?.slice(7)
    if (selectedMode && mode !== selectedMode) continue
    for (const locale of ['es', 'en']) {
      const selectedLocale = process.argv.find((arg) => arg.startsWith('--locale='))?.slice(9)
      if (selectedLocale && selectedLocale !== locale) continue
      let questions = mode === 'space'
        ? locale === 'es' ? ['Me siento sola', '¿Qué podemos hacer?', 'No quiero seguir hablando']
          : ['I feel lonely', 'What can we do?', 'I want to stop talking']
        : conversations[locale]
      const history = []
      if (symptomFollowup && process.argv.includes('--from-symptom')) {
        const replies = locale === 'es'
          ? ['Hola, ¿en qué te ayudo?', '¿Es físico, emocional o ambos?', '¿Qué molestia física tienes?', '¿Desde cuándo te duele la cabeza?']
          : ['Hi, how can I help?', 'Is it physical, emotional, or both?', 'What physical discomfort do you have?', 'When did the headache start?']
        for (let i = 0; i < 4; i++) history.push({ role: 'user', content: questions[i] }, { role: 'assistant', content: replies[i] })
        questions = questions.slice(4)
      }
      for (const question of questions) {
        const response = mode === 'space'
          ? await space.respond({ crewId: state.sessionCrewId, textoPersona: question, locale, selectedLevel: 'solo_yo', history }, sid, token, new AbortController().signal)
          : await dialogue.respond({ mode, question, locale, modelConsent: true, historyConsent: true, dataConsent: false, history,
            ...(mode === 'dashboard' ? { contextKey: dialogueContextKey(state) } : {}) }, mode === 'dashboard' ? sid : '', new AbortController().signal)
        const text = mode === 'space' ? response.result.respuesta : response.result.text
        const previous = history.filter((m) => m.role === 'assistant').map((m) => m.content)
        const repeated = previous.includes(text)
        const blanketRefusal = /cannot (discuss|talk about)|no puedo (hablar|conversar|explicar)/i.test(text)
        console.log(JSON.stringify({ mode, locale, question, text, repeated, blanketRefusal, toolsUsed: response.toolsUsed ?? [] }))
        if (symptomFollowup && mode === 'dashboard') {
          const turn = history.length / 2
          if (turn >= 2 && turn <= 4 && /emocional|emotional|orbital|radiaci[oó]n|physics/.test(text)) throw new Error('lost_physical_symptom_context')
          if (turn === 4 && !/cabeza|headache|head pain/i.test(text)) throw new Error('forgot_headache')
          if (turn === 5 && !/orbital|orbit|[oó]rbita/i.test(text)) throw new Error('ignored_explicit_topic_change')
        }
        if (openDashboard && mode === 'dashboard') {
          const turn = history.length / 2
          if (turn < 2 && /consent|permis|registros|records|Mi espacio|My space|data access/i.test(text)) throw new Error('unnecessary_privacy_warning')
          if (turn === 2 && !/Mi espacio|My space/i.test(text)) throw new Error('missing_private_module_referral')
        }
        if (repeated || blanketRefusal) throw new Error('behavioral_screen_failed')
        history.push({ role: 'user', content: question }, { role: 'assistant', content: text })
      }
    }
  }
  tools.revoke(sid, token)
}
main().catch((error) => {
  const body = typeof error.getResponse === 'function' ? error.getResponse() : null
  console.error(JSON.stringify({ verified: false, code: body?.code ?? 'evaluation_failed', status: typeof error.getStatus === 'function' ? error.getStatus() : undefined }))
  process.exitCode = 1
})
