import { expect, test } from '@playwright/test'

test('public conversation works after a failed health probe and sends only consented history', async ({ page }) => {
  const bodies: Array<Record<string, unknown>> = []
  await page.route('**/api/ai/health', (route) => route.fulfill({ status: 503, json: {} }))
  await page.route('**/api/ai/dialogue', async (route) => {
    bodies.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({ json: { source: 'model', model: 'fixture', result: {
      text: bodies.length === 1 ? 'Una alerta señala algo que conviene revisar.' : 'La señal necesita ser confiable para interpretar el cambio.', sources: [],
    } } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'ES', exact: true }).click()
  await page.getByRole('button', { name: 'Abrir chat con Quirón' }).click()
  await page.getByRole('checkbox', { name: 'Usar Gemini: enviar mis mensajes' }).check()
  await page.getByRole('checkbox', { name: 'Incluir conversación reciente' }).check()
  const input = page.getByRole('textbox', { name: 'Mensaje para Quirón' })
  await input.fill('¿Qué es una alerta?')
  await page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click()
  await expect(page.locator('.quiron-bubble').getByText('Una alerta señala algo que conviene revisar.', { exact: true })).toBeVisible()
  await input.fill('¿Y eso por qué?')
  await page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click()
  await expect(page.locator('.quiron-bubble').getByText('La señal necesita ser confiable para interpretar el cambio.', { exact: true })).toBeVisible()
  expect(bodies).toHaveLength(2)
  expect(bodies[0]).toMatchObject({ mode: 'public', history: [], dataConsent: false })
  expect(bodies[0]).not.toHaveProperty('contextKey')
  expect(bodies[1].history).toEqual([
    { role: 'user', content: '¿Qué es una alerta?' },
    { role: 'assistant', content: 'Una alerta señala algo que conviene revisar.' },
  ])
})
