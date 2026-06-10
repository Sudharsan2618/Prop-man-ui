import { test, expect } from '@playwright/test'

/**
 * Smoke test — verifies the app boots and the welcome screen renders.
 * Add per-role happy-path tests in adjacent files:
 *   tenant.spec.js     — login → dashboard → pay rent
 *   owner.spec.js      — login → portfolio → approve invoice
 *   provider.spec.js   — login → jobs → submit work report
 *   manager.spec.js    — login → finance → process split
 *   super-admin.spec.js — login → users → create manager
 *
 * These require a seeded dev backend with deterministic test credentials.
 */
test('welcome screen renders', async ({ page }) => {
  await page.goto('/')
  // Unauthenticated should redirect to /welcome
  await expect(page).toHaveURL(/\/welcome$/)
})

test('login screen is reachable', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login$/)
})
