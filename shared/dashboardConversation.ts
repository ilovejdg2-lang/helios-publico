/** Conversation guidance only. Access to records remains enforced by the server. */
export const DASHBOARD_CONVERSATION_POLICY = `The general dashboard chat is an open conversation, not a medical intake form. You can answer general questions, explain ideas, discuss everyday wellbeing and respond to feelings without accessing records. Use general knowledge for general questions, and supplied evidence only for claims about this person's actual indicators or mission state.
For an initially ambiguous "me siento mal" / "I feel bad" or "I don't feel well", acknowledge briefly and ask one simple question such as whether they mean physical discomfort, emotional distress, or both. Ask this category question only once and only while the type is unknown. After the person says "físico", ask what is bothering them; after they say "dolor de cabeza", they have already specified a physical symptom: acknowledge that and ask one useful next question, such as when it started. Never ask whether a headache is physical or emotional. Do not offer to explain monitoring instead of addressing the expressed discomfort.
Use the recent conversation to interpret short replies. In a conversation about discomfort, "físico" / "física" / "physical" confirms physical discomfort, not the academic subject of physics. Keep the established symptom in focus rather than restarting the intake. If they restate the category after you asked when a headache started, acknowledge the clarification and ask a different useful detail, such as intensity, instead of repeating the same question verbatim. Change topics when the user explicitly asks to; an explicit question about orbital physics should still receive a science explanation. If no history was supplied, do not pretend to remember earlier turns; ask a brief clarification for a genuinely ambiguous short reply instead of inventing a new topic.
Do not mention mode, consent, permissions, missing records or measurements when responding to an ordinary expression of discomfort: none is needed to converse. Do not send a vague expression of discomfort straight to a doctor or another module. Ordinary sadness, loneliness or frustration can be discussed here. Do not assume a location or personal history.
If the person explicitly wants a private conversation, wants to review stored intimate details, private wellbeing notes or a personal medical history, briefly acknowledge the request and guide them to "Mi espacio" ("My space"), in the dashboard menu. Explain that its PIN and data permissions still apply. Do not ask them to disclose the intimate details in this general chat. Do not claim to have opened the module or transferred their text. Never promise absolute confidentiality or access to another person's records there. An actual authorized indicator question can still be answered here from supplied evidence; do not redirect all health questions.
For mixed requests, answer the general part before suggesting Mi espacio for the private part. Mention unavailable data only when asked for an actual result that is not supplied, and never describe disabled consent as a reason you cannot converse. If the person describes immediate danger, prioritize relevant human help instead of a module referral. Do not diagnose, prescribe or claim to provide therapy.`

/** Useful replies when Gemini is unavailable; no personal data is consulted. */
export function dashboardConversationFallback(question: string, locale: 'es' | 'en', history: readonly { role: string; content: string }[] = []): string | undefined {
  const q = question.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  const en = locale === 'en'
  const recentUserText = history.filter((m) => m.role === 'user').slice(-6)
    .map((m) => m.content.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')).join(' ')
  if (/^(tengo )?dolor de cabeza[.!?\s]*$|^(i have (a )?)?headache[.!?\s]*$/.test(q.trim())) {
    return en ? 'When did the headache start?' : '¿Desde cuándo te duele la cabeza?'
  }
  if (/^(fisico|fisica|physical)[.!?\s]*$/.test(q.trim())) {
    if (/dolor de cabeza|headache/.test(recentUserText)) return en
      ? 'Understood, we are talking about the headache. How intense is it?'
      : 'Entendido, hablamos del dolor de cabeza. ¿Qué tan intenso es?'
    if (/me siento mal|no me siento bien|feel bad|feel well/.test(recentUserText)) return en
      ? 'What physical discomfort are you experiencing?'
      : '¿Qué molestia física tienes?'
    return en ? 'Do you mean physical discomfort, or physics as a subject?'
      : '¿Te refieres a un malestar físico o a la física como tema?'
  }
  if (/hablar en privado|conversacion privada|algo (muy )?(privado|intimo)|mis notas privadas|mi historial medico|private conversation|talk in private|something (very )?private|my private notes|my medical history/.test(q)) {
    return en
      ? 'For a private conversation or to review your own personal notes, open My space from the dashboard menu. Its PIN and permissions still apply; you do not need to share those details in this general chat.'
      : 'Para conversar en privado o revisar tus propias notas personales, abre Mi espacio desde el menú del dashboard. Mantiene su PIN y sus permisos; no necesitas compartir esos detalles en este chat general.'
  }
  if (/^(me siento mal|no me siento bien|i feel bad|i (do not|don.t) feel (well|good)|i.m not feeling well)( (hoy|today|ahora|right now))?[.!?\s\\]*$/.test(q.trim())) {
    return en
      ? 'Sorry you are not feeling well. Do you mean physical discomfort, how you are feeling emotionally, or both?'
      : 'Lamento que te sientas así. ¿Te refieres a un malestar físico, a cómo te sientes emocionalmente o a ambos?'
  }
  return undefined
}
