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

import { getDefaultItems } from '../data/defaultItems';
import { Category } from '../models/Category';
import { Checklist } from '../models/Checklist';
import { Item } from '../models/Item';
import { STORAGE_KEYS } from '../utils/constants.js';
import { generateSecureId } from '../utils/helpers.js';
import { DataService } from './dataService';

/**
 * LocalStorage implementation of the DataService
 */
export class LocalStorageService extends DataService {
  constructor() {
    super();
    this.STORAGE_KEY = STORAGE_KEYS.APP_DATA;
    this._cache = null; // simple in-memory cache to avoid repeated JSON.parse on startup
    this._initialized = false; // track if storage has been initialized
    // Invalidate in-memory cache when localStorage is changed in another tab/window
    // (the storage event is fired on other windows, not the originator window)
    if (typeof window !== 'undefined' && window.addEventListener) {
      this._storageListener = (e) => {
        if (e.key === this.STORAGE_KEY) {
          this._cache = null;
          if (e.newValue === null) {
            this._initialized = false;
          }
        }
      };
      window.addEventListener('storage', this._storageListener);
    }
  }

  /**
   * Initialize storage with default data if empty
   */
  initializeStorage() {
    // Only initialize storage when there is no existing app data.
    // Previously this method unconditionally reset storage (destructive).
    // Now we preserve existing data on reload; initial data is created
    // only when the app key is missing (first run or after manual clear).
    const existing = localStorage.getItem(this.STORAGE_KEY);
    if (existing) {
      // keep existing data (do not overwrite)
      return;
    }

    const initialData = {
      // Start empty. Default categories/items are generated per-checklist
      // when a checklist is created (see createChecklist).
      checklists: [],
      categories: [],
      items: []
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Ensure storage is initialized before first access
   */
  async _ensureInitialized() {
    if (!this._initialized) {
      this.initializeStorage();
      this._initialized = true;
    }
  }

  /**
   * Save all data to localStorage and update cache
   * @param {Object} data - Data object to save
   */
  _saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      this._cache = data;
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
      throw new Error(`Storage operation failed: ${error.message}`);
    }
  }

    /**
   * Create default categories and items for a new checklist
   * @param {string} checklistId - The checklist ID
   * @returns {Object} Object containing { categories: Array, items: Array }
   */
  _createDefaultData(checklistId) {
    // Get user's locale preference for default items
    const userLocale = localStorage.getItem('user-locale') || 'en';
    const defaultItems = getDefaultItems(userLocale);
    
    // Extract unique category names from default items
    const categoryNames = [...new Set(defaultItems.map(item => item.category))];
    
    // Create Category objects with order
    const categories = categoryNames.map((name, index) => new Category({ 
      name, 
      checklistId,
      order: index 
    }));
    
    // Create a mapping from category name to category ID
    const categoryMap = Object.fromEntries(categories.map(cat => [cat.name, cat.id]));
    
    // Create Item objects mapped to the correct categories with order
    const items = defaultItems.map((item, index) => new Item({
      id: generateSecureId('item-'),
      name: item.name,
      quantity: item.quantity,
      categoryId: categoryMap[item.category],
      isPacked: false,
      checklistId: checklistId,
      order: index
    }));
    
    return { categories, items };
  }

  // ========================================
  // PUBLIC BULK DATA ACCESS
  // ========================================

  /**
   * Get all data with automatic caching
   * @returns {Promise<Object>} Object containing { checklists: Array, categories: Array, items: Array }
   */
  async getData() {
    await this._ensureInitialized();
    if (this._cache) {
      return this._cache;
    }
    const data = localStorage.getItem(this.STORAGE_KEY);
    try {
      const parsed = JSON.parse(data || '{}');

      // Validate structure and types
      const validatedData = {
        checklists: Array.isArray(parsed.checklists) ? parsed.checklists : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        items: Array.isArray(parsed.items) ? parsed.items : []
      };

      this._cache = validatedData;
      return validatedData;
    } catch (error) {
      console.warn('Corrupted localStorage data, reinitializing...', error);
      this.initializeStorage();
      return { checklists: [], categories: [], items: [] };
    }
  }

  // ========================================
  // PUBLIC CHECKLIST CRUD
  // ========================================

  /**
   * Create a new checklist with default categories and items
   * @param {Object} checklist - Checklist to create
   * @returns {Promise<Object>} Created checklist
   */
  async createChecklist(checklist) {
    const data = await this.getData();
    const checklists = data.checklists || [];

    // Create a proper Checklist instance to ensure consistent structure
    const newChecklist = new Checklist(checklist);

    checklists.push(newChecklist.toJSON());

    // Generate default categories and items for this checklist
    const { categories: newCategories, items: newItems } = this._createDefaultData(newChecklist.id);
    
    // Add categories and items to storage
    data.categories = [...(data.categories || []), ...newCategories.map(c => c.toJSON())];
    data.items = [...(data.items || []), ...newItems.map(i => i.toJSON())];

    data.checklists = checklists;
    this._saveData(data);
    return newChecklist.toJSON();
  }

  /**
   * Get all checklists
   * @returns {Promise<Array>} Array of Checklist objects
   */
  async getChecklists() {
    const data = await this.getData();
    return (data.checklists || []).map(cl => Checklist.fromJSON(cl).toJSON());
  }

  /**
   * Get a specific checklist by ID
   * @param {string} id - Checklist ID
   * @returns {Promise<Object|null>} Checklist object or null if not found
   */
  async getChecklistById(id) {
    const data = await this.getData();
    const checklistData = (data.checklists || []).find(cl => cl.id === id);
    return checklistData ? Checklist.fromJSON(checklistData).toJSON() : null;
  }

  /**
   * Update an existing checklist
   * @param {Object} checklist - Checklist to update (must include id)
   * @returns {Promise<Object>} Updated checklist
   */
  async updateChecklist(checklist) {
    const data = await this.getData();
    const checklists = data.checklists || [];
    const index = checklists.findIndex(cl => cl.id === checklist.id);

    if (index === -1) {
      throw new Error(`Checklist with id ${checklist.id} not found`);
    }

    // Create a proper Checklist instance to ensure consistent structure
    const updatedChecklist = new Checklist(checklist);
    checklists[index] = updatedChecklist.toJSON();
    data.checklists = checklists;
    this._saveData(data);
    return updatedChecklist.toJSON();
  }

  /**
   * Delete a checklist and all associated categories and items
   * @param {string} id - Checklist ID to delete
   * @returns {Promise<void>}
   */
  async deleteChecklist(id) {
    const data = await this.getData();
    data.checklists = (data.checklists || []).filter(cl => cl.id !== id);
    // Also remove categories and items associated with the checklist
    data.categories = (data.categories || []).filter(cat => cat.checklistId !== id);
    data.items = (data.items || []).filter(item => item.checklistId !== id);
    this._saveData(data);
  }

  // ========================================
  // PUBLIC CATEGORY CRUD
  // ========================================

  /**
   * Create a new category within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {Object} category - Category to create
   * @returns {Promise<Object>} Created category
   */
  async createCategory(checklistId, category) {
    const data = await this.getData();
    const categories = data.categories || [];

    // Create a proper Category instance to ensure consistent structure
    const newCategory = new Category({ ...category, checklistId });

    categories.push(newCategory.toJSON());
    data.categories = categories;
    this._saveData(data);
    return newCategory.toJSON();
  }

  /**
   * Get all categories (optionally filtered by checklist)
   * @param {string} [checklistId] - Optional checklist ID to filter by
   * @returns {Promise<Array>} Array of Category objects
   */
  async getCategories(checklistId) {
    const data = await this.getData();
    return (data.categories || [])
      .map(cat => Category.fromJSON(cat))
      .filter(cat => (checklistId ? cat.checklistId === checklistId : true))
      .map(cat => cat.toJSON());
  }

  /**
   * Get a specific category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object|null>} Category object or null if not found
   */
  async getCategoryById(categoryId) {
    const data = await this.getData();
    const catData = (data.categories || []).find(c => c.id === categoryId);
    return catData ? Category.fromJSON(catData).toJSON() : null;
  }

  /**
   * Update an existing category
   * @param {Object} category - Category to update (must include id)
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(category) {
    const data = await this.getData();
    const categories = data.categories || [];
    const index = categories.findIndex(cat => cat.id === category.id);

    if (index === -1) {
      throw new Error(`Category with id ${category.id} not found`);
    }

    const updatedCategory = new Category(category);
    categories[index] = updatedCategory.toJSON();
    data.categories = categories;
    this._saveData(data);
    return updatedCategory.toJSON();
  }

  /**
   * Delete a category and all associated items
   * @param {string} categoryId - Category ID to delete
   * @returns {Promise<void>}
   */
  async deleteCategory(categoryId) {
    const data = await this.getData();
    data.categories = (data.categories || []).filter(cat => cat.id !== categoryId);
    // Also delete all items in this category across all checklists
    data.items = (data.items || []).filter(item => item.categoryId !== categoryId);
    this._saveData(data);
  }

  // ========================================
  // PUBLIC ITEM CRUD
  // ========================================

  /**
   * Create a new item within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {Object} item - Item to create
   * @returns {Promise<Object>} Created Item object
   */
  async createItem(checklistId, item) {
    const data = await this.getData();
    const items = data.items || [];

    // Create a proper Item instance to ensure consistent structure
    const newItem = new Item({ ...item, checklistId });

    items.push(newItem.toJSON());
    data.items = items;
    this._saveData(data);
    return newItem.toJSON();
  }

  /**
   * Get all items for a specific checklist
   * @param {string} checklistId - Checklist ID
   * @returns {Promise<Array>} Array of Item objects
   */
  async getItems(checklistId) {
    const data = await this.getData();
    return (data.items || [])
      .filter(item => item.checklistId === checklistId)
      .map(item => Item.fromJSON(item).toJSON());
  }

  /**
   * Get a specific item by ID within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object|null>} Item object or null if not found
   */
  async getItemById(checklistId, itemId) {
    const data = await this.getData();
    const itemData = (data.items || []).find(i => i.checklistId === checklistId && i.id === itemId);
    return itemData ? Item.fromJSON(itemData).toJSON() : null;
  }

  /**
   * Update an existing item within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {Object} item - Item to update (must include id)
   * @returns {Promise<Object>} Updated Item object
   */
  async updateItem(checklistId, item) {
    const data = await this.getData();
    const items = data.items || [];
    const index = items.findIndex(i => i.id === item.id && i.checklistId === checklistId);

    if (index === -1) {
      throw new Error(`Item with id ${item.id} not found in checklist ${checklistId}`);
    }

    // Create a proper Item instance to ensure consistent structure
    const updatedItem = new Item({ ...item, checklistId });
    items[index] = updatedItem.toJSON();
    data.items = items;
    this._saveData(data);
    return updatedItem.toJSON();
  }

  /**
   * Delete an item from a checklist
   * @param {string} checklistId - Checklist ID
   * @param {string} itemId - Item ID to delete
   * @returns {Promise<void>}
   */
  async deleteItem(checklistId, itemId) {
    const data = await this.getData();
    data.items = (data.items || []).filter(
      item => !(item.checklistId === checklistId && item.id === itemId)
    );
    this._saveData(data);
  }

  /**
   * Dispose service resources (e.g., remove event listeners)
   */
  dispose() {
    // Clear storage event listener if it exists
    const isBrowser = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
    if (isBrowser) {
      window.removeEventListener('storage', this._storageListener);
      this._storageListener = null;
    }

    // Clear in-memory cache and reset initialization flag
    this._cache = null;
    this._initialized = false;
  }

}
