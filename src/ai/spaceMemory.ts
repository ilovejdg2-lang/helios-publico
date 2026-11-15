import type { SpaceMessage } from '../persistence/space'
/** Memory is sent per request only, after opt-in. The current text is a separate message. */
export function recentSpaceMessages(
  messages: SpaceMessage[],
  currentText: string,
) {
  const history = messages
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.text.slice(0, 2000) }))
  if (
    history.at(-1)?.role === 'user' &&
    history.at(-1)?.content === currentText
  )
    history.pop()
  const size = () =>
    new TextEncoder().encode(JSON.stringify(history)).byteLength
  while (history.length && size() > 12000) history.shift()
  return history
}
