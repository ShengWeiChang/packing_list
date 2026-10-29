/*
================================================================================
File: source/services/localStorageService.js
Description: LocalStorage implementation of DataService providing persistent
             storage for checklists, categories and items.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import en from '../locales/en.json';
import zhTW from '../locales/zh-TW.json';
import { Category } from '../models/Category';
import { Checklist } from '../models/Checklist';
import { Item } from '../models/Item';
import { Template } from '../models/Template';
import { STORAGE_KEYS, VALIDATION } from '../utils/constants.js';
import { instantiateTemplateContent } from '../utils/instantiateTemplate.js';
import { DataService } from './dataService';
import { RecommendedListService } from './recommendedListService.js';
import {
  decodeAppData,
  decodeTemplates,
  readStorage,
  StorageError,
  withStorageLock,
  writeStorage,
} from './storageTransaction.js';

/**
 * Merge only fields changed by the caller, rejecting stale same-field edits.
 * @param {object} current - Latest stored entity.
 * @param {object} desired - Requested entity.
 * @param {object} expected - Entity observed before editing.
 * @returns {object} Merged entity.
 */
function mergeIntent(current, desired, expected) {
  if (!expected) {
    throw new StorageError('conflict', 'An edit baseline is required');
  }
  const merged = { ...current };
  for (const key of Object.keys(desired)) {
    if (key === 'id' || key === 'checklistId' || desired[key] === expected[key]) continue;
    if (current[key] !== expected[key]) {
      throw new StorageError('conflict', `The ${key} field changed in another tab`);
    }
    merged[key] = desired[key];
  }
  return merged;
}

/**
 * Merge item edits while treating packing and pending as one state.
 * @param {object} current - Latest stored item.
 * @param {object} desired - Requested item or partial item update.
 * @param {object} expected - Item observed before editing.
 * @returns {object} Merged item.
 */
function mergeItemIntent(current, desired, expected) {
  if (!expected) return mergeIntent(current, desired, expected);
  const statusFields = ['isPacked', 'isPending'];
  const statusChanged = statusFields.some(
    (field) => Object.hasOwn(desired, field) && desired[field] !== expected[field]
  );
  if (statusChanged && statusFields.some((field) => current[field] !== expected[field])) {
    throw new StorageError('conflict', 'The item status changed in another tab');
  }
  const merged = mergeIntent(current, desired, expected);
  if (statusChanged && merged.isPacked && merged.isPending) {
    throw new StorageError('conflict', 'An item cannot be both packed and pending');
  }
  return merged;
}

// -----------------------------------------------------------------------------
// Class definition
// -----------------------------------------------------------------------------

/**
 * LocalStorage implementation of the DataService
 */
export class LocalStorageService extends DataService {
  /**
   * Initialize the LocalStorage service with caching and cross-tab sync
   */
  constructor() {
    super();
    this.STORAGE_KEY = STORAGE_KEYS.APP_DATA;
    this._cache = null; // simple in-memory cache to avoid repeated JSON.parse on startup
    this._cacheRaw = null;
    this._initialized = false; // track if storage has been initialized
    // Invalidate in-memory cache when localStorage is changed in another tab/window
    // (the storage event is fired on other windows, not the originator window)
    if (typeof window !== 'undefined' && window.addEventListener) {
      this._storageListener = (e) => {
        if (e.key === this.STORAGE_KEY || e.key === null) {
          this._cache = null;
          this._cacheRaw = null;
          if (e.newValue === null) {
            this._initialized = false;
          }
        }
      };
      window.addEventListener('storage', this._storageListener);
    }
  }

  /** Initialize the in-memory state without writing to storage. */
  initializeStorage() {
    this._initialized = true;
  }

  // ---------------------------------------------------------------------------
  // Private helper methods
  // ---------------------------------------------------------------------------

  /**
   * Ensure storage is initialized before first access
   */
  async _ensureInitialized() {
    if (!this._initialized) {
      this.initializeStorage();
    }
  }

  /**
   * Save all data to localStorage and update cache
   * @param {object} data - Data object to save
   */
  _saveData(data) {
    const candidate = decodeAppData(JSON.stringify(data));
    const raw = writeStorage(this.STORAGE_KEY, candidate);
    this._cache = decodeAppData(raw);
    this._cacheRaw = raw;
  }

  /**
   * Execute a mutation against data read while holding the shared write lock.
   * @param {Function} operation - Mutation to execute.
   * @returns {Promise<*>} Mutation result.
   */
  async _withWriteLock(operation) {
    return withStorageLock(async () => {
      this._cache = null;
      this._cacheRaw = null;
      return operation();
    });
  }

  /**
   * Create general recommended-list categories and items for a new checklist
   * @param {string} checklistId - The checklist ID
   * @returns {object} Object containing { categories: Array, items: Array }
   */
  _createRecommendedListData(checklistId) {
    const userLocale = this._getLocalePreference();
    return new RecommendedListService().applyGeneralToNewChecklist(checklistId, userLocale);
  }

  // ---------------------------------------------------------------------------
  // Bulk data access
  // ---------------------------------------------------------------------------

  /**
   * Get all data with automatic caching
   * @returns {Promise<object>} Object containing { checklists: Array, categories: Array, items: Array }
   */
  async getData() {
    await this._ensureInitialized();
    const raw = readStorage(this.STORAGE_KEY);
    if (!this._cache || raw !== this._cacheRaw) {
      this._cache = decodeAppData(raw);
      this._cacheRaw = raw;
    }
    return JSON.parse(JSON.stringify(this._cache));
  }

  // ---------------------------------------------------------------------------
  // Checklist CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new checklist with optional data source
   * @param {object} checklist - Checklist to create
   * @param {object} [options] - Creation options
   * @param {string} [options.source='recommended'] - Data source: 'recommended', 'empty', or 'template'
   * @param {object} [options.seedData] - Pre-generated { categories, items } from a selected source
   * @param {string} [options.templateId] - Personal template to read inside the write lock.
   * @param {object} [options.expectedTemplate] - Template observed when selected.
   * @returns {Promise<object>} Created checklist
   */
  async createChecklist(checklist, options = {}) {
    return this._withWriteLock(async () => {
      const { source = 'recommended', templateId, expectedTemplate } = options;
      let { seedData = null } = options;
      const data = await this.getData();
      const checklists = data.checklists || [];

      // Create a proper Checklist instance to ensure consistent structure
      const newChecklist = new Checklist(checklist);

      if (source === 'template') {
        const template = decodeTemplates(readStorage(STORAGE_KEYS.TEMPLATES)).find(
          (entry) => entry.id === templateId
        );
        if (
          !template ||
          !expectedTemplate ||
          JSON.stringify(Template.fromJSON(template).toJSON()) !==
            JSON.stringify(Template.fromJSON(expectedTemplate).toJSON())
        ) {
          throw new StorageError('conflict', 'The selected template changed or no longer exists');
        }
        seedData = instantiateTemplateContent(template, newChecklist.id);
      }

      checklists.push(newChecklist.toJSON());

      if (seedData) {
        // Use pre-generated source data (categories and items already have new IDs)
        data.categories = [
          ...(data.categories || []),
          ...seedData.categories.map((c) => (typeof c.toJSON === 'function' ? c.toJSON() : c)),
        ];
        data.items = [
          ...(data.items || []),
          ...seedData.items.map((i) => (typeof i.toJSON === 'function' ? i.toJSON() : i)),
        ];
      } else if (source !== 'empty') {
        // Generate the general recommended list when no explicit seed data was supplied.
        const { categories: newCategories, items: newItems } = this._createRecommendedListData(
          newChecklist.id
        );
        data.categories = [...(data.categories || []), ...newCategories.map((c) => c.toJSON())];
        data.items = [...(data.items || []), ...newItems.map((i) => i.toJSON())];
      }
      // source === 'empty': no categories or items added

      data.checklists = checklists;
      this._saveData(data);
      return newChecklist.toJSON();
    });
  }

  /**
   * Get all checklists
   * @returns {Promise<Array>} Array of Checklist objects
   */
  async getChecklists() {
    const data = await this.getData();
    return (data.checklists || []).map((cl) => Checklist.fromJSON(cl).toJSON());
  }

  /**
   * Get a specific checklist by ID
   * @param {string} id - Checklist ID
   * @returns {Promise<object | null>} Checklist object or null if not found
   */
  async getChecklistById(id) {
    const data = await this.getData();
    const checklistData = (data.checklists || []).find((cl) => cl.id === id);
    return checklistData ? Checklist.fromJSON(checklistData).toJSON() : null;
  }

  /**
   * Update an existing checklist
   * @param {object} checklist - Checklist to update (must include id)
   * @param {object} [expectedChecklist] - Checklist before editing.
   * @returns {Promise<object>} Updated checklist
   */
  async updateChecklist(checklist, expectedChecklist) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      const checklists = data.checklists || [];
      const index = checklists.findIndex((cl) => cl.id === checklist.id);

      if (index === -1) {
        throw new StorageError('conflict', `Checklist with id ${checklist.id} not found`);
      }

      // Create a proper Checklist instance to ensure consistent structure
      const updatedChecklist = new Checklist(
        mergeIntent(Checklist.fromJSON(checklists[index]).toJSON(), checklist, expectedChecklist)
      );
      checklists[index] = { ...checklists[index], ...updatedChecklist.toJSON() };
      data.checklists = checklists;
      this._saveData(data);
      return updatedChecklist.toJSON();
    });
  }

  /**
   * Delete a checklist and all associated categories and items
   * @param {string} id - Checklist ID to delete
   * @returns {Promise<void>}
   */
  async deleteChecklist(id) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      data.checklists = (data.checklists || []).filter((cl) => cl.id !== id);
      // Also remove categories and items associated with the checklist
      data.categories = (data.categories || []).filter((cat) => cat.checklistId !== id);
      data.items = (data.items || []).filter((item) => item.checklistId !== id);
      this._saveData(data);
    });
  }

  /**
   * Update multiple checklists in a single transaction
   * This prevents race conditions when updating multiple checklists in parallel
   * @param {Array<object>} checklists - Array of checklist objects to update
   * @param {Array<object>} [expectedChecklists] - Checklists before editing.
   * @returns {Promise<Array<object>>} Array of updated checklists
   */
  async updateMultipleChecklists(checklists, expectedChecklists) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      const checklistsArray = data.checklists || [];

      // Update each checklist in the array
      checklists.forEach((updatedChecklist) => {
        const index = checklistsArray.findIndex((cl) => cl.id === updatedChecklist.id);
        if (index === -1) {
          throw new StorageError('conflict', `Checklist with id ${updatedChecklist.id} not found`);
        }
        // Create a proper Checklist instance to ensure consistent structure
        const expected = expectedChecklists?.find((entry) => entry.id === updatedChecklist.id);
        if (expectedChecklists && !expected) {
          throw new StorageError(
            'conflict',
            `Checklist with id ${updatedChecklist.id} has no baseline`
          );
        }
        const checklist = new Checklist(
          mergeIntent(
            Checklist.fromJSON(checklistsArray[index]).toJSON(),
            updatedChecklist,
            expected
          )
        );
        checklistsArray[index] = { ...checklistsArray[index], ...checklist.toJSON() };
      });

      data.checklists = checklistsArray;
      this._saveData(data);

      // Return the updated checklists
      return checklists.map((cl) => checklistsArray.find((stored) => stored.id === cl.id));
    });
  }

  /**
   * Duplicate an existing checklist with all its categories and items
   * @param {string} id - Checklist ID to duplicate
   * @returns {Promise<object>} Duplicated checklist
   */
  async duplicateChecklist(id) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      const originalChecklist = (data.checklists || []).find((cl) => cl.id === id);

      if (!originalChecklist) {
        throw new Error(`Checklist with id ${id} not found`);
      }

      // Get the copy suffix from i18n
      const copySuffix = this._getCopySuffix();

      // Truncate name if necessary to fit within max length constraint
      const maxLength = VALIDATION.NAME_MAX_LENGTH;
      const truncatedName =
        originalChecklist.name.length + copySuffix.length > maxLength
          ? originalChecklist.name.slice(0, maxLength - copySuffix.length)
          : originalChecklist.name;

      // Create new checklist with original name + copy suffix and NEW ID
      // Insert right after the original checklist
      const newChecklist = new Checklist({
        name: `${truncatedName}${copySuffix}`,
        startDate: originalChecklist.startDate,
        endDate: originalChecklist.endDate,
        order: originalChecklist.order + 1,
      });

      // Reorder all checklists that come after the original
      data.checklists = (data.checklists || []).map((cl) => {
        if (cl.order > originalChecklist.order) {
          return { ...cl, order: cl.order + 1 };
        }
        return cl;
      });

      // Find the insertion index (right after the original checklist)
      const insertionIndex = data.checklists.findIndex((cl) => cl.id === id) + 1;

      // Get all categories and items for the original checklist
      const originalCategories = (data.categories || []).filter((cat) => cat.checklistId === id);
      const originalItems = (data.items || []).filter((item) => item.checklistId === id);

      // Create mapping of old category IDs to new ones
      const categoryIdMap = {};
      const newCategories = originalCategories.map((cat) => {
        const newCategory = new Category({
          name: cat.name,
          checklistId: newChecklist.id,
          order: cat.order,
        });
        categoryIdMap[cat.id] = newCategory.id;
        return newCategory;
      });

      // Duplicate items and map them to new category IDs
      const newItems = originalItems.map((item) => {
        return new Item({
          name: item.name,
          quantity: item.quantity,
          checklistId: newChecklist.id,
          categoryId: categoryIdMap[item.categoryId] || item.categoryId,
          order: item.order,
          isPacked: false, // Reset packed status for new checklist
        });
      });

      // Insert new checklist at the correct position (right after the original)
      data.checklists.splice(insertionIndex, 0, newChecklist.toJSON());
      data.categories = [...(data.categories || []), ...newCategories.map((c) => c.toJSON())];
      data.items = [...(data.items || []), ...newItems.map((i) => i.toJSON())];

      this._saveData(data);
      return newChecklist.toJSON();
    });
  }

  // ---------------------------------------------------------------------------
  // Category CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new category within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {object} category - Category to create
   * @returns {Promise<object>} Created category
   */
  async createCategory(checklistId, category) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      if (!data.checklists.some((checklist) => checklist.id === checklistId)) {
        throw new StorageError('conflict', 'The checklist no longer exists');
      }
      const categories = data.categories || [];

      // Create a proper Category instance to ensure consistent structure
      const newCategory = new Category({ ...category, checklistId });

      categories.push(newCategory.toJSON());
      data.categories = categories;
      this._saveData(data);
      return newCategory.toJSON();
    });
  }

  /**
   * Get all categories (optionally filtered by checklist)
   * @param {string} [checklistId] - Optional checklist ID to filter by
   * @returns {Promise<Array>} Array of Category objects
   */
  async getCategories(checklistId) {
    const data = await this.getData();
    return (data.categories || [])
      .map((cat) => Category.fromJSON(cat))
      .filter((cat) => (checklistId ? cat.checklistId === checklistId : true))
      .map((cat) => cat.toJSON());
  }

  /**
   * Get a specific category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<object | null>} Category object or null if not found
   */
  async getCategoryById(categoryId) {
    const data = await this.getData();
    const catData = (data.categories || []).find((c) => c.id === categoryId);
    return catData ? Category.fromJSON(catData).toJSON() : null;
  }

  /**
   * Update an existing category
   * @param {object} category - Category to update (must include id)
   * @param {object} [expectedCategory] - Category before editing.
   * @returns {Promise<object>} Updated category
   */
  async updateCategory(category, expectedCategory) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      const categories = data.categories || [];
      const index = categories.findIndex((cat) => cat.id === category.id);

      if (index === -1) {
        throw new StorageError('conflict', `Category with id ${category.id} not found`);
      }

      const updatedCategory = new Category(
        mergeIntent(Category.fromJSON(categories[index]).toJSON(), category, expectedCategory)
      );
      categories[index] = { ...categories[index], ...updatedCategory.toJSON() };
      data.categories = categories;
      this._saveData(data);
      return updatedCategory.toJSON();
    });
  }

  /**
   * Update categories as one all-or-nothing transaction.
   * @param {Array<object>} categories - Requested categories.
   * @param {Array<object>} expectedCategories - Categories before editing.
   * @returns {Promise<Array<object>>} Committed categories.
   */
  async updateMultipleCategories(categories, expectedCategories) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      const updated = categories.map((category) => {
        const index = data.categories.findIndex((stored) => stored.id === category.id);
        const expected = expectedCategories.find((entry) => entry.id === category.id);
        if (index === -1 || !expected) {
          throw new StorageError('conflict', `Category with id ${category.id} no longer exists`);
        }
        const current = data.categories[index];
        const merged = new Category(
          mergeIntent(Category.fromJSON(current).toJSON(), category, expected)
        );
        data.categories[index] = { ...current, ...merged.toJSON() };
        return data.categories[index];
      });
      this._saveData(data);
      return updated;
    });
  }

  /**
   * Delete a category and all associated items
   * @param {string} categoryId - Category ID to delete
   * @returns {Promise<void>}
   */
  async deleteCategory(categoryId) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      data.categories = (data.categories || []).filter((cat) => cat.id !== categoryId);
      // Also delete all items in this category across all checklists
      data.items = (data.items || []).filter((item) => item.categoryId !== categoryId);
      this._saveData(data);
    });
  }

  /**
   * Duplicate an existing category with all its items
   * @param {string} categoryId - Category ID to duplicate
   * @returns {Promise<object>} Duplicated category
   */
  async duplicateCategory(categoryId) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      const originalCategory = (data.categories || []).find((cat) => cat.id === categoryId);

      if (!originalCategory) {
        throw new Error(`Category with id ${categoryId} not found`);
      }

      // Get the copy suffix from i18n
      const copySuffix = this._getCopySuffix();

      // Truncate name if necessary to fit within max length constraint
      const maxLength = VALIDATION.NAME_MAX_LENGTH;
      const truncatedName =
        originalCategory.name.length + copySuffix.length > maxLength
          ? originalCategory.name.slice(0, maxLength - copySuffix.length)
          : originalCategory.name;

      // Create new category with original name + copy suffix and NEW ID
      // Insert right after the original category
      const newCategory = new Category({
        name: `${truncatedName}${copySuffix}`,
        checklistId: originalCategory.checklistId,
        order: originalCategory.order + 1,
      });

      // Reorder all categories in the same checklist that come after the original
      data.categories = (data.categories || []).map((cat) => {
        if (
          cat.checklistId === originalCategory.checklistId &&
          cat.order > originalCategory.order
        ) {
          return { ...cat, order: cat.order + 1 };
        }
        return cat;
      });

      // Get all items for the original category
      const originalItems = (data.items || []).filter((item) => item.categoryId === categoryId);

      // Duplicate items and assign to new category with NEW IDs
      const newItems = originalItems.map((item) => {
        return new Item({
          name: item.name,
          quantity: item.quantity,
          checklistId: item.checklistId,
          categoryId: newCategory.id,
          order: item.order,
          isPacked: false, // Reset packed status for new items
        });
      });

      // Add to storage
      data.categories = [...data.categories, newCategory.toJSON()];
      data.items = [...(data.items || []), ...newItems.map((i) => i.toJSON())];

      this._saveData(data);
      return newCategory.toJSON();
    });
  }

  // ---------------------------------------------------------------------------
  // Item CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new item within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {object} item - Item to create
   * @returns {Promise<object>} Created Item object
   */
  async createItem(checklistId, item) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      if (!data.checklists.some((checklist) => checklist.id === checklistId)) {
        throw new StorageError('conflict', 'The checklist no longer exists');
      }
      if (
        !data.categories.some(
          (category) => category.id === item.categoryId && category.checklistId === checklistId
        )
      ) {
        throw new StorageError('conflict', 'The category no longer exists');
      }
      const items = data.items || [];

      // Create a proper Item instance to ensure consistent structure
      const newItem = new Item({ ...item, checklistId });

      items.push(newItem.toJSON());
      data.items = items;
      this._saveData(data);
      return newItem.toJSON();
    });
  }

  /**
   * Get all items for a specific checklist
   * @param {string} checklistId - Checklist ID
   * @returns {Promise<Array>} Array of Item objects
   */
  async getItems(checklistId) {
    const data = await this.getData();
    return (data.items || [])
      .filter((item) => item.checklistId === checklistId)
      .map((item) => Item.fromJSON(item).toJSON());
  }

  /**
   * Get a specific item by ID within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {string} itemId - Item ID
   * @returns {Promise<object | null>} Item object or null if not found
   */
  async getItemById(checklistId, itemId) {
    const data = await this.getData();
    const itemData = (data.items || []).find(
      (i) => i.checklistId === checklistId && i.id === itemId
    );
    return itemData ? Item.fromJSON(itemData).toJSON() : null;
  }

  /**
   * Update an existing item within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {object} item - Item to update (must include id)
   * @param {object} [expectedItem] - Item before editing.
   * @returns {Promise<object>} Updated Item object
   */
  async updateItem(checklistId, item, expectedItem) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      const items = data.items || [];
      const index = items.findIndex((i) => i.id === item.id && i.checklistId === checklistId);

      if (index === -1) {
        throw new StorageError(
          'conflict',
          `Item with id ${item.id} not found in checklist ${checklistId}`
        );
      }

      // Create a proper Item instance to ensure consistent structure
      const updatedItem = new Item({
        ...mergeItemIntent(Item.fromJSON(items[index]).toJSON(), item, expectedItem),
        checklistId,
      });
      if (
        updatedItem.categoryId !== items[index].categoryId &&
        !data.categories.some(
          (category) =>
            category.id === updatedItem.categoryId && category.checklistId === checklistId
        )
      ) {
        throw new StorageError('conflict', 'The destination category no longer exists');
      }
      items[index] = { ...items[index], ...updatedItem.toJSON() };
      data.items = items;
      this._saveData(data);
      return updatedItem.toJSON();
    });
  }

  /**
   * Update multiple existing items within a checklist in one storage write
   * @param {string} checklistId - Checklist ID
   * @param {Array<object>} itemsToUpdate - Items to update (each must include id)
   * @param {Array<object>} [expectedItems] - Items before editing.
   * @returns {Promise<Array<object>>} Updated Item objects
   */
  async updateMultipleItems(checklistId, itemsToUpdate, expectedItems) {
    return this._withWriteLock(async () => {
      const currentData = await this.getData();
      const data = {
        ...currentData,
        items: (currentData.items || []).map((item) => ({ ...item })),
      };
      const items = data.items;
      const updatedItems = itemsToUpdate.map((item) => new Item({ ...item, checklistId }));
      const indexes = updatedItems.map((item) =>
        items.findIndex(
          (storedItem) => storedItem.id === item.id && storedItem.checklistId === checklistId
        )
      );

      const missingItemIndex = indexes.findIndex((index) => index === -1);
      if (missingItemIndex !== -1) {
        const missingItem = updatedItems[missingItemIndex];
        throw new StorageError(
          'conflict',
          `Item with id ${missingItem.id} not found in checklist ${checklistId}`
        );
      }

      updatedItems.forEach((item, index) => {
        const expected = expectedItems?.find((entry) => entry.id === item.id);
        if (expectedItems && !expected) {
          throw new StorageError('conflict', `Item with id ${item.id} has no baseline`);
        }
        const candidate = new Item(
          mergeItemIntent(Item.fromJSON(items[indexes[index]]).toJSON(), item.toJSON(), expected)
        ).toJSON();
        if (
          candidate.categoryId !== items[indexes[index]].categoryId &&
          !data.categories.some(
            (category) =>
              category.id === candidate.categoryId && category.checklistId === checklistId
          )
        ) {
          throw new StorageError('conflict', 'The destination category no longer exists');
        }
        items[indexes[index]] = {
          ...items[indexes[index]],
          ...candidate,
        };
      });
      data.items = items;
      this._saveData(data);
      return indexes.map((index) => items[index]);
    });
  }

  /**
   * Delete an item from a checklist
   * @param {string} checklistId - Checklist ID
   * @param {string} itemId - Item ID to delete
   * @returns {Promise<void>}
   */
  async deleteItem(checklistId, itemId) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      data.items = (data.items || []).filter(
        (item) => !(item.checklistId === checklistId && item.id === itemId)
      );
      this._saveData(data);
    });
  }

  /**
   * Duplicate an existing item within the same category
   * @param {string} checklistId - Checklist ID
   * @param {string} itemId - Item ID to duplicate
   * @returns {Promise<object>} Duplicated item
   */
  async duplicateItem(checklistId, itemId) {
    return this._withWriteLock(async () => {
      const data = await this.getData();
      const originalItem = (data.items || []).find(
        (item) => item.checklistId === checklistId && item.id === itemId
      );

      if (!originalItem) {
        throw new Error(`Item with id ${itemId} not found in checklist ${checklistId}`);
      }

      // Get the copy suffix from i18n
      const copySuffix = this._getCopySuffix();

      // Truncate name if necessary to fit within max length constraint
      const maxLength = VALIDATION.NAME_MAX_LENGTH;
      const truncatedName =
        originalItem.name.length + copySuffix.length > maxLength
          ? originalItem.name.slice(0, maxLength - copySuffix.length)
          : originalItem.name;

      // Create new item with original name + copy suffix and NEW ID
      // Insert right after the original item
      const newItem = new Item({
        name: `${truncatedName}${copySuffix}`,
        quantity: originalItem.quantity,
        checklistId: checklistId,
        categoryId: originalItem.categoryId,
        order: originalItem.order + 1,
        isPacked: false, // Reset packed status for new item
      });

      // Reorder all items in the same category that come after the original
      data.items = (data.items || []).map((item) => {
        if (
          item.checklistId === checklistId &&
          item.categoryId === originalItem.categoryId &&
          item.order > originalItem.order
        ) {
          return { ...item, order: item.order + 1 };
        }
        return item;
      });

      // Add to storage
      data.items = [...data.items, newItem.toJSON()];

      this._saveData(data);
      return newItem.toJSON();
    });
  }

  /**
   * Get the copy suffix from i18n based on locale
   * @param {string} [locale] - Optional locale code (e.g., 'en', 'zh-TW'). If not provided, reads from localStorage
   * @returns {string} The localized copy suffix
   * @private
   */
  _getCopySuffix(locale) {
    const userLocale = locale || this._getLocalePreference();
    const messages = {
      en,
      'zh-TW': zhTW,
    };
    return messages[userLocale]?.common?.copySuffix || ' (Copy)';
  }

  /** Read an optional locale preference without blocking data operations.
   * @returns {string} Preferred locale or the default.
   */
  _getLocalePreference() {
    try {
      return localStorage.getItem('user-locale') || 'en';
    } catch {
      return 'en';
    }
  }

  /**
   * Dispose service resources (e.g., remove event listeners)
   */
  dispose() {
    // Clear storage event listener if it exists
    const isBrowser =
      typeof window !== 'undefined' && typeof window.addEventListener === 'function';
    if (isBrowser) {
      window.removeEventListener('storage', this._storageListener);
      this._storageListener = null;
    }

    // Clear in-memory cache and reset initialization flag
    this._cache = null;
    this._cacheRaw = null;
    this._initialized = false;
  }
}
