import { describe, expect, it } from 'vitest'
import { answerPublicLocal, dashboardSuggestions, isPresetQuestion, publicSuggestions } from './quironPublic'

describe('answerPublicLocal', () => {
  it.each([
    ['¿Qué es una alerta?', 'es', /motor determinista/],
    ['What is a measurement?', 'en', /observation/],
    ['¿Cómo funciona la calidad del sensor?', 'es', /señal/],
    ['What is a baseline?', 'en', /individual reference/],
  ] as const)('explains %s without a privacy refusal', (question, locale, expected) => {
    const answer = answerPublicLocal(question, locale)
    expect(answer.text).toMatch(expected)
    expect(answer.text).not.toMatch(/no puedo|cannot|autoriza|permission/i)
  })

  it.each(['es', 'en'] as const)('adds context on a follow-up in %s', (locale) => {
    const question = locale === 'es' ? '¿Qué es una alerta?' : 'What is an alert?'
    const first = answerPublicLocal(question, locale)
    const next = answerPublicLocal(locale === 'es' ? '¿Y eso por qué?' : 'Why?', locale, [
      { role: 'user', content: question }, { role: 'assistant', content: first.text },
    ])
    expect(next.text).not.toBe(first.text)
    expect(next.text).toMatch(/ejemplo|example/i)
    expect(next.text).not.toMatch(/no puedo|cannot/i)
  })

  it('supports loneliness without asking for measurements or inventing memories', () => {
    const answer = answerPublicLocal('Me siento sola', 'es')
    expect(answer.text).toContain('compañía')
    expect(answer.text).not.toMatch(/tu pulso|tu sueño|recuerdo|diagnóstico/i)
  })
  it('explains HELIOS without private dashboard claims', () => {
    const answer = answerPublicLocal('¿Qué es HELIOS?', 'es')
    expect(answer.demo).toBe(true)
    expect(answer.text.toLowerCase()).toContain('helios')
    expect(answer.text.toLowerCase()).not.toContain('elena torres')
  })

  it('refuses private records on the public site', () => {
    const answer = answerPublicLocal('Ayudame a entender mis registros.', 'es')
    expect(answer.text.toLowerCase()).toMatch(/no puedo|sitio público|public site|no puedo ver/)
  })

  it('answers feature questions in English', () => {
    const answer = answerPublicLocal('What can I do in HELIOS?', 'en')
    expect(answer.demo).toBe(true)
    expect(answer.text).toMatch(/mission|dashboard|prototype/i)
  })
})

describe('isPresetQuestion', () => {
  it('matches suggestion chips and ignores free-form text', () => {
    for (const item of [...publicSuggestions('en'), ...publicSuggestions('es'), ...dashboardSuggestions('en'), ...dashboardSuggestions('es')]) {
      expect(isPresetQuestion(item)).toBe(true)
      expect(isPresetQuestion(`  ${item}  `)).toBe(true)
    }
    expect(isPresetQuestion('How is Elena feeling today?')).toBe(false)
    expect(isPresetQuestion('me duele la cabeza')).toBe(false)
  })
})
