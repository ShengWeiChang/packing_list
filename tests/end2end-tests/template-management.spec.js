/*
================================================================================
File: tests/end2end-tests/template-management.spec.js
Description: E2E tests for personal template browsing and isolated editing.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

import { expect, test } from '@playwright/test';

const appData = {
  checklists: [
    {
      id: 'checklist-1',
      name: 'Existing Trip',
      startDate: '2026-10-13',
      endDate: '2026-10-13',
      order: 0,
    },
  ],
  categories: [],
  items: [],
  selectedChecklistId: 'checklist-1',
};

const templates = [
  {
    id: 'template-1',
    name: 'Weekend',
    order: 0,
    categories: [{ id: 'category-1', name: 'Clothes', order: 0 }],
    items: [{ name: 'Shirt', quantity: 1, categoryId: 'category-1', order: 0 }],
  },
];

test.describe('Template Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.addInitScript(
      ({ initialAppData, initialTemplates }) => {
        localStorage.setItem('packingListApp', JSON.stringify(initialAppData));
        localStorage.setItem('packingListTemplates', JSON.stringify(initialTemplates));
      },
      { initialAppData: appData, initialTemplates: templates }
    );
    await page.goto('/');
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Template Menu and Editor Workflow
  // ---------------------------------------------------------------------------

  // Test Case 1: Should close the templates menu after an outside click
  test('should close the templates menu after an outside click', async ({ page }) => {
    await page.getByTestId('sidebar-templates-button').click();
    await expect(page.getByTestId('sidebar-templates-dropdown')).toBeVisible();

    await page.locator('main').click({ position: { x: 400, y: 500 } });

    await expect(page.getByTestId('sidebar-templates-dropdown')).toBeHidden();
  });

  // Test Case 2: Should distinguish Back from canceling checklist creation
  test('should distinguish Back from canceling checklist creation', async ({ page }) => {
    await page.getByTestId('sidebar-new-checklist').click();
    await page.getByTestId('new-checklist-option-template').click();

    await expect(page.getByTestId('new-checklist-back')).toHaveText('Back');
    await expect(page.getByText('Select a template')).toBeVisible();
    await expect(page.getByTestId('new-checklist-template-template-1')).toContainText('1 category');
    await page.getByTestId('new-checklist-back').click();
    await expect(page.getByTestId('new-checklist-option-template')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('new-checklist-dialog')).toHaveCount(0);
  });

  // Test Case 3: Should edit a template without creating a checklist
  test('should edit a template without creating a checklist', async ({ page }) => {
    const checklistCountBefore = await page.getByTestId('sidebar-checklist-item').count();
    const appDataBefore = await page.evaluate(() => localStorage.getItem('packingListApp'));

    await page.getByTestId('sidebar-templates-button').click();
    await page.getByTestId('sidebar-template-use-template-1').click();
    await expect(page.getByText('Editing template: Weekend')).toBeVisible();
    await expect(
      page.getByTestId('overflow-menu-checklist-template-editor-template-1')
    ).toHaveCount(0);

    await page.getByTestId('checklist-name').click();
    await page.getByTestId('checklist-name-input').fill('Beach Weekend');
    await page.getByTestId('checklist-name-input').press('Enter');
    await page.getByTestId('template-editor-save').click();

    await expect(page.getByTestId('sidebar-checklist-item')).toHaveCount(checklistCountBefore);
    const persisted = await page.evaluate(() => ({
      appData: localStorage.getItem('packingListApp'),
      templates: JSON.parse(localStorage.getItem('packingListTemplates')),
    }));
    expect(persisted.appData).toBe(appDataBefore);
    expect(persisted.templates[0].name).toBe('Beach Weekend');
  });

  // Test Case 4: Should delete the active template from the editor
  test('should delete the active template from the editor', async ({ page }) => {
    await page.getByTestId('sidebar-templates-button').click();
    await page.getByTestId('sidebar-template-use-template-1').click();
    page.once('dialog', (dialog) => dialog.accept());

    await page.getByTestId('template-editor-delete').click();

    await expect(page.getByText('Editing template: Weekend')).toHaveCount(0);
    const persistedTemplates = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('packingListTemplates'))
    );
    expect(persistedTemplates).toEqual([]);
  });

  // Test Case 5: Should keep narrow template rows free of overflow menus
  test('should keep narrow template rows free of overflow menus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 720 });
    await page.getByTestId('topbar-toggle').click();
    await page.getByTestId('sidebar-templates-button').click();

    await expect(page.getByTestId('sidebar-template-use-template-1')).toBeVisible();
    await expect(page.locator('[data-testid^="overflow-menu-template-"]')).toHaveCount(0);
  });

  // Test Case 6: Should save a checklist as a named template without changing checklist data
  test('should save a checklist as a named template without changing checklist data', async ({
    page,
  }) => {
    const checklistCountBefore = await page.getByTestId('sidebar-checklist-item').count();
    const appDataBefore = await page.evaluate(() => localStorage.getItem('packingListApp'));

    const checklistOverflow = page
      .getByRole('main')
      .getByTestId('overflow-trigger-checklist-checklist-1');
    await checklistOverflow.click();
    await page
      .getByRole('main')
      .getByTestId('overflow-action-save-template-checklist-checklist-1')
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByTestId('save-template-name').fill('Saved Trip');
    await page.getByTestId('save-template-confirm').click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('sidebar-checklist-item')).toHaveCount(checklistCountBefore);
    const persisted = await page.evaluate(() => ({
      appData: localStorage.getItem('packingListApp'),
      templates: JSON.parse(localStorage.getItem('packingListTemplates')),
    }));
    expect(persisted.appData).toBe(appDataBefore);
    expect(persisted.templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Saved Trip', categories: [], items: [] }),
      ])
    );
  });

  // Test Case 7: Should create an isolated checklist from a selected template
  test('should create an isolated checklist from a selected template', async ({ page }) => {
    const templateSnapshot = await page.evaluate(() =>
      localStorage.getItem('packingListTemplates')
    );

    await page.getByTestId('sidebar-new-checklist').click();
    await page.getByTestId('new-checklist-option-template').click();
    await page.getByTestId('new-checklist-template-template-1').click();

    await expect(page.getByTestId('sidebar-checklist-item')).toHaveCount(2);

    const persisted = await page.evaluate(() => ({
      appData: JSON.parse(localStorage.getItem('packingListApp')),
      templates: localStorage.getItem('packingListTemplates'),
    }));
    const createdChecklist = persisted.appData.checklists.find(
      (checklist) => checklist.id !== 'checklist-1'
    );
    const createdCategory = persisted.appData.categories.find(
      (category) => category.checklistId === createdChecklist.id
    );
    const createdItem = persisted.appData.items.find(
      (item) => item.checklistId === createdChecklist.id
    );

    expect(createdChecklist).toEqual(
      expect.objectContaining({ name: 'New Checklist (Template: Weekend)' })
    );
    expect(createdCategory).toEqual(
      expect.objectContaining({ name: 'Clothes', checklistId: createdChecklist.id })
    );
    expect(createdCategory.id).not.toBe('category-1');
    expect(createdItem).toEqual(
      expect.objectContaining({ name: 'Shirt', categoryId: createdCategory.id, isPacked: false })
    );
    expect(persisted.templates).toBe(templateSnapshot);
  });
});
