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

import { readonly, ref } from 'vue';

import { TemplateService } from '../services/templateService';

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

  // ---------------------------------------------------------------------------
  // Functions
  // ---------------------------------------------------------------------------

  /**
   * Load all templates from storage
   */
  function loadTemplates() {
    try {
      templates.value = templateService.getTemplates();
    } catch (e) {
      error.value = `Error loading templates: ${e.message}`;
    }
  }

  /**
   * Create a template from an existing checklist snapshot
   * @param {string} checklistId - Source checklist ID
   * @param {string} templateName - Name for the new template
   * @param {object} [appData] - Optional app data { checklists, categories, items }
   * @returns {object|null} Created template or null on error
   */
  function saveAsTemplate(checklistId, templateName, appData) {
    try {
      const result = templateService.createFromChecklist(checklistId, templateName, appData);
      loadTemplates();
      return result;
    } catch (e) {
      error.value = `Error saving template: ${e.message}`;
      return null;
    }
  }

  /**
   * Delete a template by ID
   * @param {string} templateId - Template ID to delete
   * @returns {boolean} Whether the template was deleted
   */
  function deleteTemplate(templateId) {
    try {
      templateService.deleteTemplate(templateId);
      loadTemplates();
      return true;
    } catch (e) {
      error.value = `Error deleting template: ${e.message}`;
      return false;
    }
  }

  /**
   * Rename a template
   * @param {string} templateId - Template ID
   * @param {string} newName - New template name
   * @returns {object|null} Updated template or null on error
   */
  function renameTemplate(templateId, newName) {
    try {
      const existing = templateService.getTemplateById(templateId);
      if (!existing) return null;
      const result = templateService.updateTemplate({ ...existing, name: newName });
      loadTemplates();
      return result;
    } catch (e) {
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
      error.value = `Error applying template: ${e.message}`;
      return null;
    }
  }

  /**
   * Save an edited template snapshot.
   * @param {object} templateData - Complete edited template data
   * @returns {object|null} Updated template or null on error
   */
  function updateTemplate(templateData) {
    try {
      const result = templateService.updateTemplate(templateData);
      loadTemplates();
      return result;
    } catch (e) {
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
