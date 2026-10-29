/*
================================================================================
File: source/composables/useTemplates.ts
Description: Composable to manage personal checklist templates state and CRUD
             operations using the TemplateService.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { getCurrentInstance, onMounted, onUnmounted, readonly, ref } from 'vue';

import type { TemplateDTO, TemplateInput } from '../models/contracts';
import type { StorageErrorCode } from '../services/storageTypes';
import { TemplateService } from '../services/templateService';
import { STORAGE_KEYS } from '../utils/constants';
import { describeOperationError } from '../utils/operationErrors';

/**
 * Composable for managing personal checklist templates
 * @returns {object} Templates management API with state and CRUD operations
 */
export function useTemplates() {
  // ---------------------------------------------------------------------------
  // Service initialization
  // ---------------------------------------------------------------------------

  const templateService = new TemplateService();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const templates = ref<TemplateDTO[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const storageHealth = ref<StorageErrorCode | null>(null);
  const operationError = ref<StorageErrorCode | null>(null);
  const refreshAfterSaveFailed = ref(false);

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEYS.TEMPLATES && event.key !== null) return;
    templateService.clearCache();
    loadTemplates();
  };

  if (getCurrentInstance()) {
    onMounted(() => window.addEventListener('storage', handleStorageEvent));
    onUnmounted(() => window.removeEventListener('storage', handleStorageEvent));
  }

  // ---------------------------------------------------------------------------
  // Functions
  // ---------------------------------------------------------------------------

  /**
   * Load all templates from storage
   * @returns {boolean} Whether the data was read successfully.
   */
  function loadTemplates(): boolean {
    try {
      templates.value = templateService.getTemplates();
      storageHealth.value = null;
      refreshAfterSaveFailed.value = false;
      return true;
    } catch (caught) {
      const e = describeOperationError(caught);
      storageHealth.value = e.code;
      error.value = `Error loading templates: ${e.message}`;
      return false;
    }
  }

  /**
   * Create a template from an existing checklist snapshot
   * @param {string} checklistId - Source checklist ID
   * @param {string} templateName - Name for the new template
   * @returns {Promise<object|null>} Created template or null on error
   */
  async function saveAsTemplate(
    checklistId: string,
    templateName: string
  ): Promise<TemplateDTO | null> {
    try {
      const result = await templateService.createFromChecklist(checklistId, templateName);
      operationError.value = null;
      refreshAfterSaveFailed.value = !loadTemplates();
      return result;
    } catch (caught) {
      const e = describeOperationError(caught);
      operationError.value = e.code;
      error.value = `Error saving template: ${e.message}`;
      return null;
    }
  }

  /**
   * Delete a template by ID
   * @param {string} templateId - Template ID to delete
   * @returns {Promise<boolean>} Whether the template was deleted
   */
  async function deleteTemplate(templateId: string): Promise<boolean> {
    try {
      await templateService.deleteTemplate(templateId);
      operationError.value = null;
      refreshAfterSaveFailed.value = !loadTemplates();
      return true;
    } catch (caught) {
      const e = describeOperationError(caught);
      operationError.value = e.code;
      error.value = `Error deleting template: ${e.message}`;
      return false;
    }
  }

  /**
   * Rename a template
   * @param {string} templateId - Template ID
   * @param {string} newName - New template name
   * @returns {Promise<object|null>} Updated template or null on error
   */
  async function renameTemplate(templateId: string, newName: string): Promise<TemplateDTO | null> {
    try {
      const existing = templateService.getTemplateById(templateId);
      if (!existing) return null;
      const result = await templateService.updateTemplate({ ...existing, name: newName }, existing);
      operationError.value = null;
      refreshAfterSaveFailed.value = !loadTemplates();
      return result;
    } catch (caught) {
      const e = describeOperationError(caught);
      operationError.value = e.code;
      error.value = `Error renaming template: ${e.message}`;
      return null;
    }
  }

  /**
   * Apply a template to a new checklist, generating categories and items
   * @param {string} templateId - Template ID to apply
   * @param {string} checklistId - Target checklist ID
   * @returns {object|null} Object with categories and items, or null on error
   */
  function applyTemplate(templateId: string, checklistId: string) {
    try {
      return templateService.applyToNewChecklist(templateId, checklistId);
    } catch (caught) {
      const e = describeOperationError(caught);
      operationError.value = e.code;
      error.value = `Error applying template: ${e.message}`;
      return null;
    }
  }

  /**
   * Save an edited template snapshot.
   * @param {object} templateData - Complete edited template data
   * @param {object} [expectedTemplate] - Template state at the start of editing
   * @returns {Promise<object|null>} Updated template or null on error
   */
  async function updateTemplate(
    templateData: TemplateInput & { id: string },
    expectedTemplate?: TemplateInput
  ): Promise<TemplateDTO | null> {
    try {
      const result = await templateService.updateTemplate(templateData, expectedTemplate);
      operationError.value = null;
      refreshAfterSaveFailed.value = !loadTemplates();
      return result;
    } catch (caught) {
      const e = describeOperationError(caught);
      operationError.value = e.code;
      error.value = `Error updating template: ${e.message}`;
      return null;
    }
  }

  /**
   * Get the TemplateService instance (for direct access when needed)
   * @returns {TemplateService} The template service instance
   */
  function getService() {
    return templateService;
  }

  return {
    // State
    templates: readonly(templates),
    isLoading: readonly(isLoading),
    error: readonly(error),
    storageHealth: readonly(storageHealth),
    operationError: readonly(operationError),
    refreshAfterSaveFailed: readonly(refreshAfterSaveFailed),

    // Operations
    loadTemplates,
    saveAsTemplate,
    deleteTemplate,
    renameTemplate,
    applyTemplate,
    updateTemplate,
    getService,
  };
}
