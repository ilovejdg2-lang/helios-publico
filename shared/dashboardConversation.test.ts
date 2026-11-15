import { expect, it } from 'vitest'
import { dashboardConversationFallback } from './dashboardConversation'

it.each([['me siento mal', 'es'], ["I don't feel well", 'en']] as const)('responds to %s without a data warning', (question, locale) => {
  const text = dashboardConversationFallback(question, locale)
  expect(text).toMatch(/físico|physical/)
  expect(text).not.toMatch(/consent|permiso|registro|record|Mi espacio|My space/i)
})
it.each([['Quiero hablar en privado', 'es'], ['Can we review my medical history?', 'en']] as const)('directs %s to the personal module', (question, locale) => {
  expect(dashboardConversationFallback(question, locale)).toMatch(/Mi espacio|My space/)
})
it('does not intercept actual indicator requests, definitions or detailed symptoms', () => {
  expect(dashboardConversationFallback('¿Qué es una alerta?', 'es')).toBeUndefined()
  expect(dashboardConversationFallback('¿Cómo está mi pulso?', 'es')).toBeUndefined()
  expect(dashboardConversationFallback('Me siento mal, tengo dolor fuerte en el pecho', 'es')).toBeUndefined()
})

it.each(['es', 'en'] as const)('keeps physical symptom follow-ups in context (%s)', (locale) => {
  const history = [{ role: 'user', content: locale === 'es' ? 'me siento mal' : "I don't feel well" }]
  const physical = locale === 'es' ? 'fisico' : 'physical'
  expect(dashboardConversationFallback(physical, locale, history)).toMatch(/molestia física|physical discomfort/)
  const symptom = locale === 'es' ? 'dolor de cabeza' : 'headache'
  expect(dashboardConversationFallback(symptom, locale, history)).toMatch(/cuándo|When/)
  history.push({ role: 'user', content: symptom })
  const next = dashboardConversationFallback(locale === 'es' ? 'fisica' : 'physical', locale, history)
  expect(next).toMatch(/dolor de cabeza|headache/)
  expect(next).not.toMatch(/emocional|emotional|orbital/)
})

it('does not fabricate context when history is absent or force an explicit science question into health', () => {
  expect(dashboardConversationFallback('fisica', 'es')).toContain('como tema')
  expect(dashboardConversationFallback('¿Qué es la física orbital?', 'es')).toBeUndefined()
})
