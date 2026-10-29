/*
================================================================================
File: source/composables/useTemplates.js
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

import { TemplateService } from '../services/templateService';
import { STORAGE_KEYS } from '../utils/constants';

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

  const templates = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const storageHealth = ref(null);
  const operationError = ref(null);
  const refreshAfterSaveFailed = ref(false);

  const handleStorageEvent = (event) => {
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
  function loadTemplates() {
    try {
      templates.value = templateService.getTemplates();
      storageHealth.value = null;
      refreshAfterSaveFailed.value = false;
      return true;
    } catch (e) {
      storageHealth.value = e.code || 'unavailable';
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
  async function saveAsTemplate(checklistId, templateName) {
    try {
      const result = await templateService.createFromChecklist(checklistId, templateName);
      operationError.value = null;
      refreshAfterSaveFailed.value = !loadTemplates();
      return result;
    } catch (e) {
      operationError.value = e.code || 'unavailable';
      error.value = `Error saving template: ${e.message}`;
      return null;
    }
  }

  /**
   * Delete a template by ID
   * @param {string} templateId - Template ID to delete
   * @returns {Promise<boolean>} Whether the template was deleted
   */
  async function deleteTemplate(templateId) {
    try {
      await templateService.deleteTemplate(templateId);
      operationError.value = null;
      refreshAfterSaveFailed.value = !loadTemplates();
      return true;
    } catch (e) {
      operationError.value = e.code || 'unavailable';
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
  async function renameTemplate(templateId, newName) {
    try {
      const existing = templateService.getTemplateById(templateId);
      if (!existing) return null;
      const result = await templateService.updateTemplate({ ...existing, name: newName }, existing);
      operationError.value = null;
      refreshAfterSaveFailed.value = !loadTemplates();
      return result;
    } catch (e) {
      operationError.value = e.code || 'unavailable';
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
  function applyTemplate(templateId, checklistId) {
    try {
      return templateService.applyToNewChecklist(templateId, checklistId);
    } catch (e) {
      operationError.value = e.code || 'unavailable';
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
  async function updateTemplate(templateData, expectedTemplate) {
    try {
      const result = await templateService.updateTemplate(templateData, expectedTemplate);
      operationError.value = null;
      refreshAfterSaveFailed.value = !loadTemplates();
      return result;
    } catch (e) {
      operationError.value = e.code || 'unavailable';
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
