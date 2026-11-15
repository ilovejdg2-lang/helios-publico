import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
it('routes API requests to Render before applying the SPA fallback', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'))
  expect(config.rewrites[0]).toEqual({ source: '/api/:path*', destination: 'https://helios-api-d2ah.onrender.com/api/:path*' })
  expect(config.rewrites[1].source).toContain('(?!api')
})
