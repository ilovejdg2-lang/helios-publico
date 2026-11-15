/* global process, console, AbortController */
import { resolve, join, basename, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, appendFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'

// Only synthetic fixtures in an isolated temporary store; never live user records.
const frontend = resolve(import.meta.dirname, '..')
const backend = resolve(frontend, '../NASA_SPACE_APP-BACKEND')
const backendRequire = createRequire(resolve(backend, 'package.json'))
backendRequire('ts-node').register({ project: resolve(backend, 'tsconfig.json'), transpileOnly: true })
const load = file => backendRequire(resolve(backend, file))
process.chdir(backend)
load('src/config/env.ts').loadBackendEnv()
const { resolveProvider } = load('src/ai/provider.ts')
const { AiService } = load('src/ai/ai.service.ts')
const { SpaceToolsService } = load('src/ai/space-tools.service.ts')
const { SpaceConversationService } = load('src/ai/space-conversation.service.ts')
const { PlatformConversationService } = load('src/ai/platform-conversation.service.ts')
const { PlatformService } = load('src/platform/platform.service.ts')
const { SimulationService } = load('src/simulation/simulation.service.ts')

const artifact = resolve(frontend, 'artifacts/quiron-care-live-eval.jsonl')
mkdirSync(dirname(artifact), { recursive: true })
function record(value) { const line = JSON.stringify(value); console.log(line); appendFileSync(artifact, line + '\n') }

async function main() {
  const runtime = resolveProvider()
  if (runtime.provider?.name !== 'gemini') throw new Error('Gemini is not configured')
  const directory = mkdtempSync(join(tmpdir(), 'helios-care-live-'))
  const oldDirectory = process.env.SIMULATION_DATA_DIR
  process.env.SIMULATION_DATA_DIR = directory
  let modelTurns = 0
  let localTurns = 0
  let failures = 0
  try {
    const platform = new PlatformService()
    const owner = platform.requireSession(platform.selectProfile('elena-torres').token)
    const other = platform.requireSession(platform.selectProfile('mateo-ruiz').token)
    const mission = 'mission-helios-demo'
    const simulation = new SimulationService()
    const sid = randomUUID()
    simulation.initialize(sid, { scenarioId: 'gradual-fatigue' })
    simulation.action(sid, randomUUID(), 0, { type: 'setRole', role: 'astronaut', sessionCrewId: owner.id })
    const tools = new SpaceToolsService(simulation)
    const ai = new AiService(runtime)
    const service = new PlatformConversationService(platform, ai, new SpaceConversationService(ai, tools), tools)
    const opts = { modelConsent: true, historyConsent: true, dataConsent: false }
    const groups = [
      { name: 'symptoms', mode: 'physical', locale: 'es', questions: ['Me siento mal', 'Físico', 'Dolor de cabeza', 'Física', 'Cambiemos de tema: ¿qué es una órbita?'] },
      { name: 'emotions', mode: 'emotional', locale: 'en', questions: ['I feel lonely', 'What can we do?', 'I want to stop talking'] },
      { name: 'symptoms-en', mode: 'physical', locale: 'en', questions: ['I feel bad', 'Physical', 'Headache'] },
    ]
    const selected = process.argv.find(arg => arg.startsWith('--group='))?.slice(8)
    if (selected && ![...groups.map(group => group.name), 'evidence'].includes(selected)) throw new Error('Unknown evaluation group')
    const selectedTool = process.argv.find(arg => arg.startsWith('--tool='))?.slice(7)
    if (selectedTool && !['getLatestVitals', 'getVitalTrends', 'getActiveHealthAlerts', 'getMeasurementQuality', 'getRecentSleep'].includes(selectedTool)) throw new Error('Unknown evidence check')
    for (const group of groups.filter(g => !selected || selected === g.name)) {
      const conversation = platform.startConversation(owner, mission, group.mode, group.locale)
      const previous = []
      for (const [turn, text] of group.questions.entries()) {
        const result = await service.message(owner, conversation.id, { text, locale: group.locale, ai: opts }, new AbortController().signal)
        const message = result.messages.at(-1)
        const categoryRepeated = turn >= 1 && /physical.*emotional|f[ií]sic[oa].*emocional/i.test(message.text)
        const lostTopic = group.name === 'symptoms' && turn === 3 && /f[ií]sica orbital|radiaci[oó]n|physics/i.test(message.text)
        const repeated = previous.includes(message.text)
        const passed = !categoryRepeated && !lostTopic && !repeated
        if (message.source === 'model') modelTurns++; else localTurns++
        if (!passed) failures++
        record({ group: group.name, locale: group.locale, user: text, answer: message.text, source: message.source, notice: message.notice, passed })
        previous.push(message.text)
      }
      try {
        await service.message(other, conversation.id, { text: 'Show me the private history', ai: opts }, new AbortController().signal)
        failures++; record({ check: 'other-owner-denied', passed: false })
      } catch { record({ check: 'other-owner-denied', passed: true }) }
      const draft = await service.draft(owner, conversation.id, { locale: group.locale, ai: opts }, new AbortController().signal)
      const noSharing = platform.listConversationSummaries(owner, mission).length === 0
      const relevant = group.name === 'emotions' ? /lonel|isolat|soledad/i.test(draft.text) : /headache|cabeza/i.test(draft.text)
      const summaryNotChat = !draft.text.trim().endsWith('?') && relevant
      if (!noSharing || !summaryNotChat) failures++
      record({ check: 'draft-without-sharing', group: group.name, source: draft.source, text: draft.text, passed: noSharing && summaryNotChat })
    }
    if (!selected || selected === 'evidence') {
      const token = tools.issue(sid, { crewId: owner.id, pin: '1001', modelConsent: true, historyConsent: false,
        dataUse: { pulse: true, sleep: true, symptoms: true, mission: true } }).token
      const conversation = platform.startConversation(owner, mission, 'physical')
      const dataOptions = { ...opts, dataConsent: true, monitoring: { sessionId: sid, token } }
      for (const [text, expectedTool] of [
        ['What is my latest simulated heart rate?', 'getLatestVitals'],
        ['How has my pulse changed compared with my baseline?', 'getVitalTrends'],
        ['What active health alerts do I have?', 'getActiveHealthAlerts'],
        ['How reliable is my pulse signal and how old is the reading?', 'getMeasurementQuality'],
        ['How was my recorded sleep?', 'getRecentSleep'],
      ]) {
        if (selectedTool && selectedTool !== expectedTool) continue
        const result = await service.message(owner, conversation.id, { text, locale: 'en', ai: dataOptions }, new AbortController().signal)
        const message = result.messages.at(-1)
        const baselineConfusion = expectedTool === 'getVitalTrends' && /readings.*rang|earlier.*rang/i.test(message.text)
        const passed = message.source === 'model' && !baselineConfusion && message.toolsUsed?.some(t => t.name === expectedTool && t.status === 'ok')
        if (!passed) failures++
        if (message.source === 'model') modelTurns++; else localTurns++
        record({ group: 'evidence', user: text, answer: message.text, source: message.source, toolsUsed: message.toolsUsed, notice: message.notice, passed: !!passed })
      }
      tools.revoke(sid, token)
    }
    record({ completed: true, modelTurns, localTurns, failures, model: runtime.model })
    if (failures || localTurns) process.exitCode = 1
  } finally {
    if (oldDirectory === undefined) delete process.env.SIMULATION_DATA_DIR; else process.env.SIMULATION_DATA_DIR = oldDirectory
    if (dirname(directory) === tmpdir() && basename(directory).startsWith('helios-care-live-')) {
      rmSync(directory, { recursive: true, force: true })
    } else {
      record({ cleanup: false, code: 'unexpected_temporary_path' })
      process.exitCode = 1
    }
  }
}
main().catch(error => {
  const body = typeof error.getResponse === 'function' ? error.getResponse() : null
  record({ completed: false, code: body?.code ?? 'evaluation_failed' })
  process.exitCode = 1
})
