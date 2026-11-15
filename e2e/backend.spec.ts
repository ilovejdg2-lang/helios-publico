import { expect, test } from '@playwright/test'

test('NestJS persiste síntomas y conserva la sesión al recargar', async ({ page, request }) => {
  await page.goto('/app')
  await expect(page.getByTestId('backend-mode')).toHaveText('NestJS conectado')
  await page.getByTestId('open-symptom').click()
  await page.getByTestId('symptom-cansancio').check()
  await page.getByTestId('symptom-note').fill('Prueba integrada con NestJS')
  await page.getByTestId('save-symptom').click()
  await expect(page.getByText('Prueba integrada con NestJS')).toBeVisible()
  const session = await page.evaluate(() => sessionStorage.getItem('vitalink-simulation-id'))
  const response = await request.get('/api/simulation', { headers: { 'X-Simulation-Id': session! } })
  expect(response.ok()).toBe(true)
  expect(
    (await response.json()).state.symptoms.some((s: { note: string }) => s.note === 'Prueba integrada con NestJS'),
  ).toBe(true)
  await page.reload()
  await expect(page.getByTestId('backend-mode')).toHaveText('NestJS conectado')
  await expect(page.getByText('Prueba integrada con NestJS')).toBeVisible()
})

test('la pérdida de API activa el simulador y permite continuar', async ({ page }) => {
  await page.goto('/app')
  await expect(page.getByTestId('backend-mode')).toHaveText('NestJS conectado')
  const previous = await page.evaluate(() => sessionStorage.getItem('vitalink-simulation-id'))
  await page.route('**/api/simulation/actions', (route) => route.abort('failed'))
  await page.getByTestId('open-symptom').click()
  await page.getByTestId('symptom-cansancio').check()
  await page.getByTestId('symptom-note').fill('Reporte en simulador local')
  await page.getByTestId('save-symptom').click()
  await expect(page.getByTestId('backend-mode')).toHaveText('Simulador local')
  const detached = await page.evaluate(() => sessionStorage.getItem('vitalink-simulation-id'))
  expect(detached).not.toBe(previous)
  await expect(page.getByText('Reporte en simulador local')).toBeVisible()
  await page.waitForTimeout(500)
  await page.unroute('**/api/simulation/actions')
  await page.reload()
  await expect(page.getByTestId('backend-mode')).toHaveText('NestJS conectado')
  await expect(page.getByText('Reporte en simulador local')).toBeVisible()
})

test('session throttling is visible with its retry delay', async ({ page }) => {
  await page.route('**/api/simulation', (route) => route.fulfill({status: 429, headers: {'Retry-After':'25'}, json:{code:'rate_limit'}}))
  await page.goto('/app')
  await expect(page.getByTestId('backend-mode')).toBeVisible()
  await expect(page.getByTestId('backend-mode')).toHaveText('Simulador local')
  await expect(page.locator('.connection-notices')).toContainText('25s')
})
