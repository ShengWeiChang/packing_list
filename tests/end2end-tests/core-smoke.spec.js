/* Shared desktop smoke for core checklist and item behavior. */
import { expect, test } from '@playwright/test';

import { selectGeneralRecommendedList } from './checklistHelpers.js';

test.use({ viewport: { width: 1280, height: 720 }, hasTouch: false, isMobile: false });

// Test Case 1: Core checklist and item operations survive reload and deletion.
test(
  'creates, edits, packs and deletes a persisted item',
  { tag: '@core-smoke' },
  async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sidebar-new-checklist').click();
    await selectGeneralRecommendedList(page);
    const checklistInput = page.getByTestId('checklist-name-input');
    await checklistInput.fill('Core smoke trip');
    await checklistInput.press('Enter');
    await expect(page.getByTestId('checklist-name')).toHaveText('Core smoke trip');

    await page.getByTestId('add-category-button').click();
    const categoryInput = page.getByTestId('category-name-input').last();
    await categoryInput.fill('Core smoke category');
    await categoryInput.press('Enter');
    const category = page.getByTestId('category-card').filter({ hasText: 'Core smoke category' });
    await expect(category).toHaveCount(1);
    await category.getByTestId('add-item-button').click();
    const input = category.getByTestId('item-edit-input');
    await input.fill('Original item');
    await input.press('Enter');
    const row = category.getByTestId('item-row').filter({ hasText: 'Original item' });
    await expect(row).toHaveCount(1);
    const id = await row.getAttribute('data-item-id');
    const savedRow = page.locator(`[data-testid="item-row"][data-item-id="${id}"]`);
    await savedRow.getByTestId('item-name').click();
    await savedRow.getByTestId('item-edit-input').fill('Edited item');
    await savedRow.getByTestId('item-edit-input').press('Enter');
    await expect(savedRow.getByTestId('item-name')).toHaveText('Edited item');
    await savedRow.hover();
    await savedRow.getByTestId('item-quantity-increment').click();
    await expect(savedRow.getByTestId('item-quantity-value')).toHaveText('x2');
    await savedRow.getByTestId('item-pending-toggle').click();
    await expect(savedRow.getByTestId('item-pending-toggle')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await savedRow.getByTestId('item-checkbox').click();
    await expect(savedRow.getByTestId('item-checkbox')).toBeChecked();
    await expect(savedRow.getByTestId('item-pending-toggle')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    await page.reload();
    await expect(page.getByTestId('checklist-name')).toHaveText('Core smoke trip');
    await expect(savedRow.getByTestId('item-name')).toHaveText('Edited item');
    await expect(savedRow.getByTestId('item-checkbox')).toBeChecked();
    await savedRow.hover();
    await expect(savedRow.getByTestId('item-quantity-value')).toHaveText('x2');
    await expect(savedRow.getByTestId('item-pending-toggle')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    await savedRow.getByTestId('item-quantity-decrement').click();
    await expect(savedRow.getByTestId('item-quantity-value')).toHaveText('x1');
    await savedRow.getByTestId('item-quantity-decrement').click();
    await expect(savedRow).toHaveCount(0);
    await page.reload();
    await expect(savedRow).toHaveCount(0);
  }
);
