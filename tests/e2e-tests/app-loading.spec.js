/*
================================================================================
File: tests/end2end/app-loading.spec.js
Description: E2E tests for basic app loading and initial state.
             Verifies the app renders correctly on first visit.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-06
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { expect, test } from '@playwright/test';

// -----------------------------------------------------------------------------
// App Loading Tests
// -----------------------------------------------------------------------------

test.describe('App Loading', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Initial Page Load
  // ---------------------------------------------------------------------------

  test.describe('initial page load', () => {
    // Test Case 1: App should load and display the title
    test('should load the app with correct title', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle('Packing List');
    });

    // Test Case 2: Should show sidebar on desktop viewport
    test('should show sidebar on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await expect(page.locator('aside')).toBeVisible();
    });

    // Test Case 3: Should show empty state when no checklists exist
    test('should show empty state when no checklists exist', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      // On fresh start with empty localStorage, the empty state should be visible
      await expect(page.getByTestId('empty-state')).toBeVisible();
    });

    // Test Case 4: Should show checklist content after creating a checklist
    test('should show checklist content after creating a checklist', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      // Create a checklist via sidebar
      await page.getByTestId('sidebar-new-checklist').click();

      // Confirm the default name by pressing Enter on the auto-focused input
      const nameInput = page.getByTestId('checklist-name-input');
      await expect(nameInput).toBeVisible();
      await nameInput.press('Enter');

      // Checklist name (h2), progress bar, and categories should be visible
      await expect(page.getByTestId('checklist-name')).toBeVisible();
      await expect(page.getByTestId('progress-bar').first()).toBeVisible();
      await expect(page.getByTestId('category-name').first()).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Responsive Layout
  // ---------------------------------------------------------------------------

  test.describe('responsive layout', () => {
    // Test Case 5: Should show topbar on mobile viewport
    test('should show topbar on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await expect(page.locator('header')).toBeVisible();
    });
  });
});
