import type { ReactNode } from 'react'

/** Escapa HTML y formatea Markdown básico seguro (sin HTML arbitrario). */
export function formatQuironReply(text: string): ReactNode {
  const blocks = text.split(/\n{2,}/)
  return blocks.map((block, index) => {
    const lines = block.split('\n')
    const listLines = lines.filter((line) => /^[-*•]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim()))
    if (listLines.length === lines.length && lines.length > 1) {
      const first = lines[0] ?? ''
      const ordered = /^\d+\.\s+/.test(first.trim())
      const Tag = ordered ? 'ol' : 'ul'
      return (
        <Tag key={index} className="quiron-md-list">
          {lines.map((line, i) => (
            <li key={i}>{inline(line.replace(/^([- *•]|\d+\.)\s+/, ''))}</li>
          ))}
        </Tag>
      )
    }
    return (
      <p key={index} className="quiron-md-p">
        {lines.map((line, i) => (
          <span key={i}>
            {i > 0 ? <br /> : null}
            {inline(line)}
          </span>
        ))}
      </p>
    )
  })
}

function inline(raw: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s<]+)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  const pushText = (value: string) => {
    if (!value) return
    // Span wrapper: keeps a stable element if auto-translate rewrites the text node.
    nodes.push(<span key={`t${key++}`}>{value}</span>)
  }
  while ((match = pattern.exec(raw))) {
    if (match.index > last) pushText(raw.slice(last, match.index))
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key++}>{token.slice(1, -1)}</code>)
    } else {
      const href = sanitizeUrl(token)
      if (href) {
        nodes.push(
          <a key={key++} href={href} target="_blank" rel="noopener noreferrer">
            {token}
          </a>,
        )
      } else {
        pushText(token)
      }
    }
    last = match.index + token.length
  }
  if (last < raw.length) pushText(raw.slice(last))
  return nodes
}

function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href
  } catch {
    /* */
  }
  return null
}
