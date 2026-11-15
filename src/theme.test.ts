// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, readThemeChoice } from './theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  afterEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('defaults to dark when no theme is stored', () => {
    expect(readThemeChoice()).toBe('dark')
  })

  it('reads light when stored as light', () => {
    localStorage.setItem('helios-theme', 'light')
    expect(readThemeChoice()).toBe('light')
  })

  it('reads legacy vitalink-theme key', () => {
    localStorage.setItem('vitalink-theme', 'light')
    expect(readThemeChoice()).toBe('light')
  })

  it('applies dark theme and persists it', () => {
    expect(applyTheme('dark')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('helios-theme')).toBe('dark')
  })

  it('applies light theme and persists it', () => {
    expect(applyTheme('light')).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('helios-theme')).toBe('light')
  })
})
