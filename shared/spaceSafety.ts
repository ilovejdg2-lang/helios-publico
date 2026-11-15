/** Existing local text safety checks; not a reliable emergency detector. */
const TEXT_SAFETY_RULES: { category: string; patterns: string[] }[] = [
  { category: 'dolor en el pecho', patterns: ['dolor en el pecho', 'dolor de pecho', 'dolor toracico', 'chest pain'] },
  { category: 'desmayo', patterns: ['desmay', 'faint', 'blackout'] },
  { category: 'dificultad para respirar', patterns: ['dificultad para respirar', 'no puedo respirar', 'me falta el aire', 'falta de aire', 'trouble breathing', 'cant breathe', "can't breathe"] },
  { category: 'confusión', patterns: ['confusion', 'confundid', 'confused'] },
  { category: 'hacerse daño o dañar a otros', patterns: ['hacerme dano', 'hacerse dano', 'matarme', 'suicid', 'danar a otros', 'herir a', 'lastimar a', 'hurt myself', 'hurt others'] },
  { category: 'riesgo para la nave', patterns: ['riesgo para la nave', 'peligro para la nave', 'risk to the ship'] },
]

export function textSafetyCategories(text: string): string[] {
  const folded = text.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '')
  const englishDanger = [
    'chest pain',
    'cannot breathe',
    "can't breathe",
    'hurt myself',
    'kill myself',
    'hurt someone',
    'danger to the spacecraft',
    'passed out',
  ].some((p) => folded.includes(p))
  const found = TEXT_SAFETY_RULES.filter((rule) =>
    rule.patterns.some((pattern) => folded.includes(pattern)),
  ).map((rule) => rule.category)
  if (englishDanger) found.push('explicit safety concern')
  return found
}
