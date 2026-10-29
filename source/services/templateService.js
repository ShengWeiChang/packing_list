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
import {
  decodeAppData,
  decodeTemplates,
  readStorage,
  StorageError,
  withStorageLock,
  writeStorage,
} from './storageTransaction.js';

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
    this._cacheRaw = null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Read all templates from localStorage (with caching)
   * @returns {Array} Array of template objects
   */
  _loadTemplates() {
    const raw = readStorage(this.STORAGE_KEY);
    if (!this._cache || raw !== this._cacheRaw) {
      this._cache = decodeTemplates(raw);
      this._cacheRaw = raw;
    }
    return JSON.parse(JSON.stringify(this._cache));
  }

  /**
   * Persist templates to localStorage and update cache
   * @param {Array} templates - Array of template objects
   */
  _saveTemplates(templates) {
    const candidate = decodeTemplates(JSON.stringify(templates));
    const raw = writeStorage(this.STORAGE_KEY, candidate);
    this._cache = decodeTemplates(raw);
    this._cacheRaw = raw;
  }

  /**
   * Read full app data from localStorage
   * @returns {object} App data object with checklists, categories and items arrays
   */
  _loadAppData() {
    return decodeAppData(readStorage(STORAGE_KEYS.APP_DATA));
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
   * @returns {Promise<object>} Created template
   */
  async createTemplate(templateData) {
    return withStorageLock(() => this._createTemplate(templateData));
  }

  /**
   * Create a template while the caller holds the shared write lock.
   * @param {object} templateData - Template data.
   * @returns {object} Created template.
   */
  _createTemplate(templateData) {
    const templates = this._loadTemplates();
    const newTemplate = new Template(templateData);
    templates.push(newTemplate.toJSON());
    this._saveTemplates(templates);
    return newTemplate.toJSON();
  }

  /**
   * Update an existing template
   * @param {object} templateData - Updated template data (must include id)
   * @param {object} [expectedTemplate] - Original template state before editing.
   * @returns {Promise<object>} Updated template
   */
  async updateTemplate(templateData, expectedTemplate) {
    return withStorageLock(() => {
      const templates = this._loadTemplates();
      const index = templates.findIndex((t) => t.id === templateData.id);
      if (index === -1) {
        throw new StorageError('conflict', `Template with id ${templateData.id} not found`);
      }
      if (!expectedTemplate) {
        throw new StorageError('conflict', 'A template edit baseline is required');
      }
      if (
        JSON.stringify(Template.fromJSON(templates[index]).toJSON()) !==
        JSON.stringify(Template.fromJSON(expectedTemplate).toJSON())
      ) {
        throw new StorageError('conflict', 'Template changed while it was being edited');
      }
      const updated = new Template(templateData);
      templates[index] = { ...templates[index], ...updated.toJSON() };
      this._saveTemplates(templates);
      return updated.toJSON();
    });
  }

  /**
   * Delete a template by ID
   * @param {string} id - Template ID to delete
   * @returns {Promise<void>} Resolves after the write.
   */
  async deleteTemplate(id) {
    return withStorageLock(() => {
      const templates = this._loadTemplates();
      const filtered = templates.filter((t) => t.id !== id);
      if (filtered.length === templates.length) {
        throw new Error(`Template with id ${id} not found`);
      }
      this._saveTemplates(filtered);
    });
  }

  /**
   * Reorder templates based on an ordered array of IDs
   * @param {Array<string>} orderedIds - Array of template IDs in desired order
   * @returns {Promise<void>} Resolves after the write.
   */
  async reorderTemplates(orderedIds) {
    return withStorageLock(() => {
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
    });
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
   * @returns {Promise<object>} Created template
   */
  async createFromChecklist(checklistId, templateName) {
    return withStorageLock(() => {
      const appData = this._loadAppData();
      if (!appData.checklists.some((checklist) => checklist.id === checklistId)) {
        throw new Error(`Checklist with id ${checklistId} not found`);
      }
      const srcCategories = appData.categories.filter((c) => c.checklistId === checklistId);
      const srcItems = appData.items.filter((i) => i.checklistId === checklistId);

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

      return this._createTemplate({
        name: templateName,
        order: maxOrder + 1,
        categories: snapshotCategories,
        items: snapshotItems,
      });
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
    this._cacheRaw = null;
  }
}
