/*
================================================================================
File: tests/end2end-tests/language-switch.spec.js
Description: E2E tests for language switching functionality.
             Verifies that switching from English to Traditional Chinese
             updates all UI labels correctly.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { expect, test } from '@playwright/test';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Create a checklist and confirm it appears in view mode.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 * @param {string} [name] - Optional checklist name
 */
async function createAndConfirmChecklist(page, name) {
  await page.getByTestId('sidebar-new-checklist').click();
  const nameInput = page.getByTestId('checklist-name-input');
  await expect(nameInput).toBeVisible();
  if (name) {
    await nameInput.fill(name);
  }
  await nameInput.press('Enter');
  if (name) {
    await expect(page.getByTestId('checklist-name')).toHaveText(name);
  } else {
    await expect(page.getByTestId('checklist-name')).toBeVisible();
  }
}

/**
 * Switch language via sidebar language button.
 * Clicks the globe/language icon, then selects the target language.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 * @param {string} langLabel - The label text of the language to select (e.g. '繁體中文', 'English')
 */
async function switchLanguage(page, langLabel) {
  // The language button has aria-label containing "Switch language" or "切換語言"
  const langButton = page.locator('button[aria-label*="anguage"], button[aria-label*="語言"]');
  await expect(langButton).toBeVisible();
  await langButton.click();

  // Click the desired language option
  const langOption = page.locator('button', { hasText: langLabel });
  await expect(langOption).toBeVisible();
  await langOption.click();
}

// -----------------------------------------------------------------------------
// Language Switch Tests
// -----------------------------------------------------------------------------

test.describe('Language Switch', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Switch to Traditional Chinese
  // ---------------------------------------------------------------------------

  test.describe('switch to Traditional Chinese', () => {
    // Test Case 1: Should change sidebar title to Chinese
    test('should update sidebar title after switching to zh-TW', async ({ page }) => {
      // First verify English sidebar title
      await expect(page.locator('aside')).toContainText('Checklists');

      // Switch to Chinese
      await switchLanguage(page, '繁體中文');

      // Sidebar title should now be Chinese
      await expect(page.locator('aside')).toContainText('清單列表');
    });

    // Test Case 2: Should change new checklist button label
    test('should update new checklist button text after language switch', async ({ page }) => {
      await switchLanguage(page, '繁體中文');

      const newBtn = page.getByTestId('sidebar-new-checklist');
      await expect(newBtn).toContainText('新增清單');
    });

    // Test Case 3: Should change empty state message
    test('should update empty state text after language switch', async ({ page }) => {
      await switchLanguage(page, '繁體中文');

      const emptyState = page.getByTestId('empty-state');
      await expect(emptyState).toContainText('請先建立一個新清單');
    });

    // Test Case 4: Should change category-related labels after creating a checklist
    test('should show Chinese labels in categories after language switch', async ({ page }) => {
      await switchLanguage(page, '繁體中文');

      // Create a checklist — default items should now have Chinese category names
      await createAndConfirmChecklist(page);

      // Add category button should be in Chinese
      const addCatBtn = page.getByTestId('add-category-button');
      await expect(addCatBtn).toContainText('新增分類');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Switch Back to English
  // ---------------------------------------------------------------------------

  test.describe('switch back to English', () => {
    // Test Case 5: Should revert UI to English after switching back
    test('should revert all labels to English after switching back from zh-TW', async ({
      page,
    }) => {
      // Switch to Chinese first
      await switchLanguage(page, '繁體中文');
      await expect(page.locator('aside')).toContainText('清單列表');

      // Switch back to English
      await switchLanguage(page, 'English');
      await expect(page.locator('aside')).toContainText('Checklists');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Language Persistence
  // ---------------------------------------------------------------------------

  test.describe('language persistence', () => {
    // Test Case 6: Should persist language choice across page reload
    test('should persist language selection after page reload', async ({ page }) => {
      // Switch to Chinese
      await switchLanguage(page, '繁體中文');
      await expect(page.locator('aside')).toContainText('清單列表');

      // Reload page
      await page.reload();

      // Should still be Chinese
      await expect(page.locator('aside')).toContainText('清單列表');
    });
  });
});
