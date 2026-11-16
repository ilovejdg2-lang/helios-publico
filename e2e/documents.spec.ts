import { expect, test } from '@playwright/test'

test('un DOCX se abre en el visor interno y renderiza contenido', async ({ page }) => {
  await page.goto('/documentos')

  const viewButtons = page.locator('.doc-card button.pub-btn-ghost')
  await expect(viewButtons.first()).toBeVisible()
  const total = await viewButtons.count()
  expect(total).toBeGreaterThan(0)

  await viewButtons.first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('section.docx-content').first()).toBeVisible({ timeout: 45_000 })

  const text = await dialog.locator('.docx-content-wrapper').innerText()
  expect(text.trim().length).toBeGreaterThan(200)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('el visor no genera desplazamiento horizontal en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/documentos')

  await page.locator('.doc-card button.pub-btn-ghost').first().click()
  const body = page.locator('.doc-viewer-body')
  await expect(body).toBeVisible()
  await expect(page.locator('.doc-viewer-doc section.docx-content').first()).toBeVisible({ timeout: 45_000 })

  const overflow = await body.evaluate((el) => el.scrollWidth - el.clientWidth)
  expect(overflow).toBeLessThanOrEqual(2)
})

test('los PDF siguen abriéndose con el archivo original', async ({ page }) => {
  await page.goto('/documentos')

  const pdfLink = page.locator('.doc-card a[href$=".pdf"]').first()
  await expect(pdfLink).toBeVisible()
  await expect(pdfLink).toHaveAttribute('target', '_blank')
  await expect(pdfLink).toHaveAttribute('href', /\/docs\/.+\.pdf$/)
})
