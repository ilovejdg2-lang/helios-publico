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

test('el PDF se visualiza dentro de HELIOS y conserva la descarga', async ({ page }) => {
  await page.goto('/documentos')
  const card = page.locator('.doc-card').filter({ has: page.locator('a[href="/docs/ppt-helios.pdf"]') })
  await card.getByRole('button').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const canvas = dialog.locator('.pdf-preview-pages canvas').first()
  await expect(canvas).toBeVisible({ timeout: 45_000 })
  const colors = await canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement
    const context = canvas.getContext('2d')!
    return new Set(context.getImageData(0, 0, canvas.width, canvas.height).data).size
  })
  expect(colors).toBeGreaterThan(10)
  await expect(dialog.locator('a[download]')).toHaveAttribute('href', '/docs/ppt-helios.pdf')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})
