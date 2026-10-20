/*
================================================================================
File: source/services/templateService.js
Description: Service for managing personal checklist templates in localStorage.
             Provides CRUD, snapshot from existing checklists, and template
             application to create new checklists.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { Template } from '../models/Template';
import { STORAGE_KEYS } from '../utils/constants.js';
import { instantiateTemplateContent } from '../utils/instantiateTemplate.js';

// -----------------------------------------------------------------------------
// Class definition
// -----------------------------------------------------------------------------

/**
 * Service for managing personal checklist templates in localStorage
 */
export class TemplateService {
  /**
   * Create a new TemplateService instance
   */
  constructor() {
    this.STORAGE_KEY = STORAGE_KEYS.TEMPLATES;
    this._cache = null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Read all templates from localStorage (with caching)
   * @returns {Array} Array of template objects
   */
  _loadTemplates() {
    if (this._cache) {
      return this._cache;
    }
    const raw = localStorage.getItem(this.STORAGE_KEY);
    try {
      const parsed = JSON.parse(raw || '[]');
      this._cache = Array.isArray(parsed) ? parsed : [];
    } catch {
      this._cache = [];
    }
    return this._cache;
  }

  /**
   * Persist templates to localStorage and update cache
   * @param {Array} templates - Array of template objects
   */
  _saveTemplates(templates) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    this._cache = templates;
  }

  /**
   * Read full app data from localStorage
   * @returns {object} App data object with checklists, categories and items arrays
   */
  _loadAppData() {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_DATA);
    try {
      const parsed = JSON.parse(raw || '{}');
      return {
        checklists: Array.isArray(parsed?.checklists) ? parsed.checklists : [],
        categories: Array.isArray(parsed?.categories) ? parsed.categories : [],
        items: Array.isArray(parsed?.items) ? parsed.items : [],
      };
    } catch {
      return {
        checklists: [],
        categories: [],
        items: [],
      };
    }
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  /**
   * Get all templates sorted by order
   * @returns {Array} Array of template objects
   */
  getTemplates() {
    return this._loadTemplates()
      .map((t) => Template.fromJSON(t).toJSON())
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Get a single template by ID
   * @param {string} id - Template ID
   * @returns {object|null} Template object or null
   */
  getTemplateById(id) {
    const templates = this._loadTemplates();
    const found = templates.find((t) => t.id === id);
    return found ? Template.fromJSON(found).toJSON() : null;
  }

  /**
   * Create a new template
   * @param {object} templateData - Template data
   * @returns {object} Created template
   */
  createTemplate(templateData) {
    const templates = this._loadTemplates();
    const newTemplate = new Template(templateData);
    templates.push(newTemplate.toJSON());
    this._saveTemplates(templates);
    return newTemplate.toJSON();
  }

  /**
   * Update an existing template
   * @param {object} templateData - Updated template data (must include id)
   * @returns {object} Updated template
   */
  updateTemplate(templateData) {
    const templates = this._loadTemplates();
    const index = templates.findIndex((t) => t.id === templateData.id);
    if (index === -1) {
      throw new Error(`Template with id ${templateData.id} not found`);
    }
    const updated = new Template(templateData);
    templates[index] = updated.toJSON();
    this._saveTemplates(templates);
    return updated.toJSON();
  }

  /**
   * Delete a template by ID
   * @param {string} id - Template ID to delete
   */
  deleteTemplate(id) {
    const templates = this._loadTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    if (filtered.length === templates.length) {
      throw new Error(`Template with id ${id} not found`);
    }
    this._saveTemplates(filtered);
  }

  /**
   * Reorder templates based on an ordered array of IDs
   * @param {Array<string>} orderedIds - Array of template IDs in desired order
   */
  reorderTemplates(orderedIds) {
    const templates = this._loadTemplates();
    const idToTemplate = Object.fromEntries(templates.map((t) => [t.id, t]));
    const reordered = orderedIds
      .map((id, index) => {
        const tpl = idToTemplate[id];
        if (tpl) {
          return { ...tpl, order: index };
        }
        return null;
      })
      .filter(Boolean);

    // Append any templates not in orderedIds at the end
    const orderedSet = new Set(orderedIds);
    templates.forEach((t) => {
      if (!orderedSet.has(t.id)) {
        reordered.push({ ...t, order: reordered.length });
      }
    });

    this._saveTemplates(reordered);
  }

  // ---------------------------------------------------------------------------
  // Snapshot & Apply
  // ---------------------------------------------------------------------------

  /**
   * Create a template from an existing checklist by snapshotting its
   * categories and items (stripping runtime-only fields).
   *
   * @param {string} checklistId - Source checklist ID
   * @param {string} templateName - Name for the new template
   * @param {object} appData - The full app data { checklists, categories, items }
   * @returns {object} Created template
   */
  createFromChecklist(checklistId, templateName, appData) {
    // Prefer the provided appData, but gracefully fall back to persisted app data
    // when the provided data is partial/stale (e.g., UI only loaded selected checklist).
    const safeAppData = {
      checklists: Array.isArray(appData?.checklists) ? appData.checklists : [],
      categories: Array.isArray(appData?.categories) ? appData.categories : [],
      items: Array.isArray(appData?.items) ? appData.items : [],
    };

    let srcCategories = safeAppData.categories.filter((c) => c.checklistId === checklistId);
    let srcItems = safeAppData.items.filter((i) => i.checklistId === checklistId);

    const shouldFallbackToStorage =
      srcCategories.length === 0 && srcItems.length === 0 && checklistId != null;

    if (shouldFallbackToStorage) {
      const persisted = this._loadAppData();
      srcCategories = persisted.categories.filter((c) => c.checklistId === checklistId);
      srcItems = persisted.items.filter((i) => i.checklistId === checklistId);
    }

    // Snapshot categories: keep id (for internal FK), name, order
    const snapshotCategories = srcCategories.map((c) => ({
      id: c.id,
      name: c.name,
      order: c.order ?? 0,
    }));

    // Snapshot items: keep name, quantity, categoryId, order (strip id, isPacked, isPending, checklistId)
    const snapshotItems = srcItems.map((i) => ({
      name: i.name,
      quantity: i.quantity ?? 1,
      categoryId: i.categoryId,
      order: i.order ?? 0,
    }));

    // Determine order for new template
    const templates = this._loadTemplates();
    const maxOrder = templates.length > 0 ? Math.max(...templates.map((t) => t.order || 0)) : -1;

    return this.createTemplate({
      name: templateName,
      order: maxOrder + 1,
      categories: snapshotCategories,
      items: snapshotItems,
    });
  }

  /**
   * Apply a template to produce new categories and items for a new checklist.
   * Generates new IDs and remaps categoryId foreign keys.
   *
   * @param {string} templateId - Template ID to apply
   * @param {string} checklistId - Target checklist ID
   * @returns {object} { categories: Category[], items: Item[] }
   */
  applyToNewChecklist(templateId, checklistId) {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }
    return instantiateTemplateContent(template, checklistId);
  }

  /**
   * Invalidate cache (for cross-tab sync)
   */
  clearCache() {
    this._cache = null;
  }
}
