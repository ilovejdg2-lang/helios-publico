/** Respuestas locales del sitio público — sin datos privados del dashboard. */

import { generalQuironExplanation } from './quironKnowledge'

export type QuironPublicLocale = 'en' | 'es'

export interface QuironPublicAnswer {
  text: string
  sources: string[]
  demo: true
}

function match(q: string, ...keys: string[]) {
  return keys.some((key) => q.includes(key))
}

export function answerPublicLocal(question: string, locale: QuironPublicLocale, history: { role: string; content: string }[] = []): QuironPublicAnswer {
  let q = question.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/^[¿¡\s]+/, '')
  const en = locale === 'en'

  const simple = (text: string): QuironPublicAnswer => ({ text, sources: [], demo: true })
  const explanation = generalQuironExplanation(question, en)
  if (explanation) return simple(explanation)
  if (/^(hola|hey|buenas|hello|hi)[!¡?.\s]*$/.test(q))
    return simple(en ? 'Hi! What would you like to explore in HELIOS?' : '¡Hola! ¿Qué te gustaría explorar de HELIOS?')
  if (/^(gracias|thanks|thank you)[!.\s]*$/.test(q))
    return simple(en ? 'You’re welcome.' : 'Con gusto.')
  if (/^(basta|para|stop|no quiero seguir)[!.\s]*$/.test(q))
    return simple(en ? 'We can leave it here.' : 'Lo dejamos aquí.')
  if (match(q, 'me siento solo', 'me siento sola', 'soledad', 'feel lonely', 'feel alone', 'miss home'))
    return simple(en
      ? 'Being far from familiar people can be hard. If you want company, you could ask a trusted person for a short conversation. We can also talk about what you miss; no measurements are needed for that.'
      : 'Estar lejos de las personas cercanas puede pesar. Si te ayudaría tener compañía, puedes proponerle a alguien de confianza hablar un rato. También podemos conversar sobre lo que extrañas; no hacen falta mediciones para eso.')
  if (match(q, 'no entiendo', 'no me ayuda', 'frustr', 'robot', 'don’t understand', "don't understand"))
    return simple(en ? 'Let’s try a simpler explanation. Which part should I clarify?' : 'Probemos con una explicación más sencilla. ¿Qué parte quieres aclarar?')
  if (/^(y eso por que|por que|explicame mejor|que podemos hacer|why is that|why|explain more|what can we do)[?¿!.\s]*$/.test(q)) {
    const previous = [...history].reverse().find((m) => m.role === 'user' && !/^(y eso|por que|explicame|why|explain)/i.test(m.content))
    const previousExplanation = previous && generalQuironExplanation(previous.content, en)
    if (previousExplanation) return simple(en
      ? 'For example, two identical readings can mean different things if one is older or has a poor signal. That is why HELIOS checks context before interpreting the number. This explains the method, not a personal result.'
      : 'Por ejemplo, dos lecturas iguales pueden tener distinto valor si una es antigua o tiene mala señal. Por eso HELIOS comprueba el contexto antes de interpretar el número. Esto explica el método, sin atribuirte un resultado personal.')
    if (previous && /alert|medici|record|registro/i.test(previous.content))
      return simple(en ? 'The public chat has no access to those records. Open the authorized dashboard to review the available evidence.' : 'Este chat público no tiene acceso a esos registros. En el panel autorizado puedes revisar la evidencia disponible.')
    if (previous) q = previous.content.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    else return simple(en ? 'Which part would you like me to explain?' : '¿Qué parte quieres que te explique mejor?')
  }

  if (match(q, 'que puedo', 'what can', 'funciones', 'features', 'hacer en helios', 'do in helios')) {
    return {
      demo: true,
      sources: ['HELIOS · sitio público'],
      text: en
        ? 'In HELIOS you can explore the mission cycle (pre-flight, aboard, post-mission), see how indicators and inventory are presented, review documents, and enter the demonstration dashboard. Quirón on the public site explains the prototype — it does not open private crew records.'
        : 'En HELIOS podés explorar el ciclo de misión (preembarque, a bordo, posmisión), ver cómo se presentan indicadores e inventario, revisar documentos y entrar al panel de demostración. En el sitio público Quirón explica el prototipo; no abre registros privados de tripulación.',
    }
  }

  if (match(q, 'abord', 'board', 'preembar', 'antes de', 'before', 'prepar')) {
    return {
      demo: true,
      sources: ['HELIOS · etapas de misión'],
      text: en
        ? 'Before boarding, HELIOS focuses on preparation: proposed resources, pending reviews, and checks that authorized staff still need to close. The public pages describe the stage; personal prep lists live only inside the dashboard after you sign in to a demo case.'
        : 'Antes de abordar, HELIOS se centra en la preparación: recursos propuestos, revisiones pendientes y comprobaciones que el personal autorizado aún debe cerrar. Las páginas públicas describen la etapa; las listas personales viven solo en el panel, al abrir un caso de demostración.',
    }
  }

  if (match(q, 'registro', 'record', 'historial', 'history', 'medicion', 'measurement', 'alerta', 'alert')) {
    return {
      demo: true,
      sources: ['HELIOS · límite del sitio público'],
      text: en
        ? 'To understand a record, start with what was measured, when, its signal quality and how it compares with the individual baseline. I cannot open your personal records from this public chat; those are reviewed in the authorized dashboard.'
        : 'Para entender un registro, empieza por qué se midió, cuándo, la calidad de la señal y su comparación con la referencia individual. No puedo abrir tus registros personales desde este chat público; se revisan en el panel autorizado.',
    }
  }

  if (match(q, 'recurso', 'resource', 'inventario', 'inventory', 'equipo', 'equipment', 'documento', 'document')) {
    return {
      demo: true,
      sources: ['HELIOS · Documentos / Datos'],
      text: en
        ? 'Public resources include project pages, how-it-works, team, video, documents, and the data story. Inventory quantities and locations appear in the dashboard Resources view — not as live private stock from this chat.'
        : 'Los recursos públicos incluyen las páginas del proyecto, cómo funciona, el equipo, video, documentos y la historia de datos. Cantidades y ubicaciones del inventario aparecen en Recursos del panel — no como existencias privadas en vivo desde este chat.',
    }
  }

  if (match(q, 'helios', 'que es', 'what is', 'proyecto', 'project', 'mision', 'mission')) {
    return {
      demo: true,
      sources: ['HELIOS · El proyecto'],
      text: en
        ? 'HELIOS (Health Evaluation & Life Indicators Observation System) is an independent prototype for space-health support across the mission cycle. It is not an official NASA product. Indicators show age, quality, and integrity; Quirón cites available evidence and never closes alerts or changes inventory by itself.'
        : 'HELIOS (Health Evaluation & Life Indicators Observation System) es un prototipo independiente de acompañamiento en salud espacial a lo largo del ciclo de misión. No es un producto oficial de NASA. Los indicadores muestran antigüedad, calidad e integridad; Quirón cita evidencia disponible y nunca cierra alertas ni cambia inventario por sí solo.',
    }
  }

  if (match(q, 'naveg', 'pagina', 'page', 'donde', 'where', 'menu')) {
    return {
      demo: true,
      sources: ['HELIOS · navegación'],
      text: en
        ? 'Use the top navigation for Home, Project, How it works, About us, Video, Documents, and Data. “Enter the system” opens the demonstration dashboard.'
        : 'Usá la navegación superior para Inicio, El proyecto, Cómo funciona, Acerca de nosotros, Video, Documentos y Datos. “Acceder al sistema” abre el panel de demostración.',
    }
  }

  return {
    demo: true,
    sources: ['Quirón · modo demostración (sitio público)'],
    text: en
      ? 'I can help you explore what HELIOS is, the mission stages, public documentation, and site navigation. I do not access private dashboard data from here. Try a suggestion below, or ask about HELIOS features or stages.'
      : 'Puedo ayudarte a explorar qué es HELIOS, las etapas de misión, la documentación pública y la navegación del sitio. Desde aquí no accedo a datos privados del panel. Probá una sugerencia o preguntá por funciones o etapas de HELIOS.',
  }
}

function normQuestion(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[¿?¡!.,]/g, '')
    .replace(/\s+/g, ' ')
}

/** True only for the suggestion chips, in either language. */
export function isPresetQuestion(question: string): boolean {
  const target = normQuestion(question)
  if (!target) return false
  const presets = [
    ...publicSuggestions('en'),
    ...publicSuggestions('es'),
    ...dashboardSuggestions('en'),
    ...dashboardSuggestions('es'),
  ]
  return presets.some((item) => normQuestion(item) === target)
}

export function publicSuggestions(locale: QuironPublicLocale): string[] {
  return locale === 'en'
    ? [
        'What can I do in HELIOS?',
        'What should I review before boarding?',
        'Help me understand my records.',
        'What resources are available?',
      ]
    : [
        '¿Qué puedo hacer en HELIOS?',
        '¿Qué debo revisar antes de abordar?',
        'Ayudame a entender mis registros.',
        '¿Qué recursos están disponibles?',
      ]
}

export function dashboardSuggestions(locale: QuironPublicLocale): string[] {
  return locale === 'en'
    ? [
        'What can I do in HELIOS?',
        'What should I review before boarding?',
        'What information is missing?',
        'What resources are available?',
      ]
    : [
        '¿Qué puedo hacer en HELIOS?',
        '¿Qué debo revisar antes de abordar?',
        '¿Qué información falta?',
        '¿Qué recursos están disponibles?',
      ]
}
