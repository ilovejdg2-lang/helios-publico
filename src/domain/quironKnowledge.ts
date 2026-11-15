/** General explanations contain no session records and require no data permission. */
export function generalQuironExplanation(question: string, en: boolean): string | undefined {
  const q = question.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  // Requests for actual records must keep going through the authorized context.
  if (/\b(mi|mis|my|our|nuestro|actual|actuales|current|latest|ultima|ultimo|elena|marco|sofia)\b/.test(q)) return undefined
  const explanatory = /que (es|son|significa|mide)|como (funciona|se)|por que|what (is|are|does)|how (does|do)|why|explica|explain|diferencia|difference/.test(q)
  if (!explanatory) return undefined
  if (/alert/.test(q)) return en
    ? 'An alert flags something worth reviewing; it is not a diagnosis. In HELIOS, the deterministic engine evaluates simulated data. Review the reading, its time and sensor quality before interpreting a change.'
    : 'Una alerta señala algo que conviene revisar; no es un diagnóstico. En HELIOS el motor determinista evalúa datos simulados. Para entender un cambio, se revisan la medición, su antigüedad y la calidad del sensor.'
  if (/sensor|calidad|quality|integridad|integrity/.test(q)) return en
    ? 'Sensor quality describes how usable a signal is. Age tells you when it was measured, while integrity concerns message validation. A recent reading can still have poor quality; these checks answer different questions.'
    : 'La calidad del sensor describe qué tan aprovechable es la señal. La antigüedad indica cuándo se midió y la integridad se refiere a la validación del mensaje. Una lectura reciente puede tener mala calidad: son comprobaciones distintas.'
  if (/linea base|baseline/.test(q)) return en
    ? 'A baseline is an individual reference for comparison. A change from it deserves context: when the reading was taken, how reliable it is and whether other observations support it. A difference alone does not explain its cause.'
    : 'La línea base es una referencia individual para comparar mediciones. Un cambio necesita contexto: cuándo se midió, qué tan confiable es la lectura y si hay otras observaciones que lo acompañen. La diferencia por sí sola no explica la causa.'
  if (/pulso|frecuencia cardiaca|heart rate|pulse/.test(q)) return en
    ? 'Heart rate is the number of heartbeats per minute. HELIOS compares simulated readings with an individual baseline and checks their quality and age. One value alone does not explain why it changed.'
    : 'La frecuencia cardíaca es el número de latidos por minuto. HELIOS compara las lecturas simuladas con una referencia individual y revisa su calidad y antigüedad. Un valor aislado no explica por qué cambió.'
  if (/medici|measurement|indicador|indicator/.test(q)) return en
    ? 'An indicator summarizes an observation, such as heart rate or hours of sleep. In HELIOS these are simulated readings: their time, quality and context matter as much as the number. Explaining an indicator does not require access to personal records.'
    : 'Un indicador resume una observación, como el pulso o las horas de sueño. En HELIOS las mediciones son simuladas: su momento, calidad y contexto importan tanto como el número. Explicar un indicador no requiere abrir registros personales.'
  return undefined
}
