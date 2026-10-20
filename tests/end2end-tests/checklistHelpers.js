/*
================================================================================
File: tests/end2end-tests/checklistHelpers.js
Description: Shared Playwright helpers for checklist creation workflows.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-15
================================================================================
*/

/**
 * Choose the general recommended list after the new-checklist dialog opens.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 */
export async function selectGeneralRecommendedList(page) {
  await page.getByTestId('new-checklist-option-recommended').click();
  await page.getByTestId('new-checklist-recommended-general').click();
}
