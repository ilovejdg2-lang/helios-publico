import { expect, test, type Page } from '@playwright/test'

async function enterRole(page: Page, role: string) {
  await page.goto('/entrar')
  await page.getByRole('button', { name: 'ES', exact: true }).click()
  await page.getByRole('button', { name: `Explorar como ${role}`, exact: true }).click()
  await expect(page).toHaveURL(/\/misiones$/)
  await page.getByRole('button', { name: 'Entrar al tablero', exact: true }).first().click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.locator('.role-switch-trigger')).toBeVisible()
}

for (const [role, heading] of [
  ['jefe', /Elena Torres/],
  ['tripulante', /Hola, Mateo/],
  ['médico', /Atención médica/],
  ['psicólogo', /Bienestar y acompañamiento/],
] as const) {
  test(`roles branch: enter ${role} with real platform API`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await enterRole(page, role)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    const session = await page.evaluate(() => ({
      token: localStorage.getItem('helios-demo-session')!,
      mission: localStorage.getItem('helios-active-mission')!,
    }))
    const response = await page.request.get(`/api/platform/missions/${session.mission}`, {
      headers: { 'X-Helios-Session': session.token },
    })
    expect(response.ok()).toBe(true)
    expect(errors).toEqual([])
  })
}

test('roles branch: switch roles without losing mission or leaking a care thread', async ({ page }) => {
  await enterRole(page, 'tripulante')
  const mission = await page.evaluate(() => localStorage.getItem('helios-active-mission'))
  await page.getByRole('button', { name: 'Bienestar emocional', exact: true }).click()
  await expect(page.locator('.quiron-care-chip')).toContainText('Bienestar emocional')
  const input = page.getByRole('textbox', { name: 'Mensaje para Quirón' })
  await input.fill('ROLE-INTEGRATION-PRIVATE-CREW')
  await page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click()
  await expect(page.locator('.quiron-msg.is-user .quiron-bubble').getByText('ROLE-INTEGRATION-PRIVATE-CREW', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar chat de Quirón' }).click()
  for (const [label, heading] of [
    ['Médico', /Atención médica/],
    ['Psicólogo', /Bienestar y acompañamiento/],
    ['Jefe de misión', /Elena Torres/],
  ] as const) {
    await page.locator('.role-switch-trigger').click()
    await page.getByRole('dialog', { name: 'Elegí un rol' }).getByRole('button', { name: new RegExp(label) }).click()
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('helios-active-mission'))).toBe(mission)
    await page.getByRole('button', { name: 'Abrir chat con Quirón' }).click()
    await expect(page.locator('.quiron-panel')).not.toContainText('ROLE-INTEGRATION-PRIVATE-CREW')
    await page.getByRole('button', { name: 'Cerrar chat de Quirón' }).click()
  }
})

test('dashboard explains history consent and sends the full symptom conversation when enabled', async ({ page }) => {
  const requests: Array<{ question: string; history: Array<{ role: string; content: string }> }> = []
  await page.route('**/api/ai/dialogue', async (route) => {
    const body = route.request().postDataJSON() as typeof requests[number]
    requests.push(body)
    await route.fulfill({ json: { source: 'model', model: 'fixture', result: {
      text: `Respuesta de prueba ${requests.length}`, sources: [],
    } } })
  })
  await enterRole(page, 'tripulante')
  await page.getByRole('button', { name: 'Abrir chat con Quirón' }).click()
  await page.getByRole('checkbox', { name: 'Usar Gemini: enviar mis mensajes' }).check()
  await expect(page.getByText(/El historial está desactivado:/)).toBeVisible()
  await page.getByRole('checkbox', { name: 'Incluir conversación reciente' }).check()
  await expect(page.getByText(/El historial está desactivado:/)).toHaveCount(0)
  const previous: Array<{ role: string; content: string }> = []
  for (const question of ['hola', 'me siento mal', 'fisico', 'dolor de cabeza', 'fisica']) {
    await page.getByRole('textbox', { name: 'Mensaje para Quirón' }).fill(question)
    await page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click()
    await expect(page.locator('.quiron-bubble').getByText(`Respuesta de prueba ${previous.length / 2 + 1}`, { exact: true })).toBeVisible()
    expect(requests.at(-1)?.history).toEqual(previous)
    previous.push({ role: 'user', content: question }, { role: 'assistant', content: `Respuesta de prueba ${requests.length}` })
  }
})
