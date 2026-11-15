import { describe, expect, it } from 'vitest'
import { assertPublicClientEnv } from '../../scripts/client-env'
describe('client environment boundary', () => {
  it('accepts public Supabase configuration', () => {
    expect(() =>
      assertPublicClientEnv({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
      }),
    ).not.toThrow()
  })
  it('rejects private variables without printing their values', () => {
    for (const name of [
      'VITE_AI_API_KEY',
      'VITE_NASA_API_KEY',
      'VITE_SUPABASE_DB_PASSWORD',
      'VITE_SUPABASE_SERVICE_ROLE_KEY',
    ]) {
      expect(() =>
        assertPublicClientEnv({ [name]: 'sensitive-fixture' }),
      ).toThrow('Private credentials')
      try {
        assertPublicClientEnv({ [name]: 'sensitive-fixture' })
      } catch (error) {
        expect(String(error)).not.toContain('sensitive-fixture')
      }
    }
  })
  it('rejects known private token prefixes under innocuous variable names', () => {
    for (const value of [
      'sb_secret_fixture',
      'sk-proj-fixture',
      'ghp_fixture',
    ]) {
      expect(() =>
        assertPublicClientEnv({ VITE_DISPLAY_SETTING: value }),
      ).toThrow('Private credentials')
    }
  })
  it('rejects a service-role JWT disguised as a publishable key', () => {
    const payload = btoa(JSON.stringify({ role: 'service_role' }))
    expect(() =>
      assertPublicClientEnv({
        VITE_SUPABASE_PUBLISHABLE_KEY: `eyJhbGciOiJIUzI1NiJ9.${payload}.fixture`,
      }),
    ).toThrow('service role')
  })
})
