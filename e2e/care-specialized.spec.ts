import { expect, test, type Page } from '@playwright/test'

async function openCare(page: Page) {
  await page.goto('/entrar')
  await page.getByRole('button', { name: 'ES', exact: true }).click()
  await page.getByRole('button', { name: 'Explorar como tripulante', exact: true }).click()
  await page.getByRole('button', { name: 'Entrar al tablero', exact: true }).first().click()
  await page.getByRole('button', { name: 'Bienestar emocional', exact: true }).click()
  await expect(page.locator('.quiron-care-chip')).toContainText('Bienestar emocional')
}

test('specialized controls retain their module and require their own AI consent', async ({ page }) => {
  await openCare(page)
  const model = page.getByRole('checkbox', { name: 'Usar Gemini: enviar mensajes de este módulo' })
  await expect(model).not.toBeChecked()
  await page.getByRole('textbox', { name: 'Mensaje para Quirón' }).fill('Me siento sola')
  await page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click()
  await expect(page.locator('.quiron-bubble').filter({ hasText: 'La soledad puede pesar' })).toBeVisible()
  await model.check()
  await page.getByRole('checkbox', { name: 'Incluir mensajes recientes solo de esta conversación' }).check()
  await expect(page.locator('.quiron-care-chip')).toContainText('Bienestar emocional')
  await expect(page.locator('.quiron-msg.is-user .quiron-bubble')).toHaveText('Me siento sola')
  await expect(page.getByRole('checkbox', { name: 'Incluir mis registros de descanso, síntomas y contexto de misión' })).not.toBeChecked()
  await model.uncheck()
  await expect(page.getByText('Motor local activo. No se envían mensajes a Gemini.')).toBeVisible()
})

test('summary stays private until edited and explicitly approved for the selected professional', async ({ page }) => {
  await openCare(page)
  const original = `PRIVATE-CARE-${Date.now()}`
  await page.getByRole('textbox', { name: 'Mensaje para Quirón' }).fill(original)
  await page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click()
  await expect(page.locator('.quiron-msg.is-bot')).toHaveCount(2)
  await page.getByRole('button', { name: 'Preparar resumen para revisión' }).click()
  await expect(page.getByRole('textbox', { name: 'Resumen para revisar' })).toBeVisible()
  const share = page.getByRole('button', { name: 'Aprobar y compartir este resumen' })
  await expect(share).toBeDisabled()
  const approved = `APPROVED-SUMMARY-${Date.now()}`
  await page.getByRole('textbox', { name: 'Resumen para revisar' }).fill(approved)
  await page.getByRole('combobox', { name: 'Profesional destinatario' }).selectOption('alex-morgan')
  const request = page.waitForRequest(req => /\/quiron\/[^/]+\/summary$/.test(new URL(req.url()).pathname))
  await share.click()
  expect((await request).postDataJSON()).toMatchObject({ body: approved, shareWith: 'alex-morgan' })
  await expect(page.getByText('Resumen aprobado para el profesional seleccionado. No se envió ninguna notificación.')).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar chat de Quirón' }).click()
  await page.locator('.role-switch-trigger').click()
  await page.getByRole('dialog', { name: 'Elegí un rol' }).getByRole('button', { name: /Psicólogo/ }).click()
  const panel = page.getByRole('region', { name: 'Resúmenes aprobados de Quirón' })
  await expect(panel).toContainText(approved)
  await expect(panel).not.toContainText(original)
})
