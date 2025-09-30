import { defaultItems } from '../data/defaultItems';
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
    // simple in-memory cache to avoid repeated JSON.parse on startup
    this._cache = null;
    this.initializeStorage();
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
      // when a checklist is created (see saveChecklist).
      checklists: [],
      categories: [],
      items: []
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
  }

  /**
   * Migrate legacy category IDs like `cat-1`, `cat-2`, ... to secure IDs.
   * Updates category IDs and fixes item.categoryId references.
   * Returns true if a migration happened.
   */


  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Get all stored data from localStorage
   * @returns {Object} Parsed data object
   */
  getData() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return JSON.parse(data || '{}');
  }

  /**
   * Get parsed app data with a simple in-memory cache
   * Consumers can call this once at startup to avoid multiple parses
   * @returns {Object} Cached data object
   */
  getAll() {
    if (this._cache) return this._cache;
    const data = this.getData();
    this._cache = data;
    return data;
  }

  /**
   * Save all data to localStorage and update cache
   * @param {Object} data - Data object to save
   */
  saveData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    // update cache so subsequent reads stay consistent
    this._cache = data;
  }

  /**
   * Generate default categories for a specific checklist (categories are scoped to a checklist)
   * @param {string} checklistId - The checklist ID to scope categories to
   * @returns {Array} Array of default Category objects
   */
  getDefaultCategoriesForChecklist(checklistId) {
    const categoryNames = [...new Set(defaultItems.map(item => item.category))];
    return categoryNames.map(name => new Category({ name, checklistId }));
  }

  /**
   * Get default categories (unscoped)
   * @returns {Array} Array of default Category objects
   */
  getDefaultCategories() {
    const categoryNames = [...new Set(defaultItems.map(item => item.category))];
    // Let the Category constructor generate secure IDs so IDs are consistent
    // with other entities (checklists/items) which use crypto.randomUUID when available.
    return categoryNames.map(name => new Category({ name }));
  }

  /**
   * Get default items with unique IDs for a new checklist
   * @param {string} checklistId - The checklist ID to scope items to
   * @returns {Array} Array of default Item objects
   */
  getDefaultItems(checklistId) {
    const categories = this.getDefaultCategoriesForChecklist(checklistId);
    const categoryMap = Object.fromEntries(categories.map(cat => [cat.name, cat.id]));

    return defaultItems.map(item => new Item({
      id: generateSecureId('item-'),
      name: item.name,
      quantity: item.quantity,
      categoryId: categoryMap[item.category],
      isPacked: false,
      checklistId: checklistId
    }));
  }

  // ========================================
  // CHECKLIST CRUD
  // ========================================

  /**
   * Create a new checklist with default categories and items
   * @param {Object} checklist - Checklist to create
   * @returns {Promise<Object>} Created checklist
   */
  async createChecklist(checklist) {
    const data = this.getData();
    const checklists = data.checklists || [];

    // Create a proper Checklist instance to ensure consistent structure
    const newChecklist = new Checklist(checklist);

    checklists.push(newChecklist.toJSON());

    // Generate default categories scoped to this checklist
    const newCategories = this.getDefaultCategoriesForChecklist(newChecklist.id);
    data.categories = [...(data.categories || []), ...newCategories.map(c => c.toJSON())];

    // Generate default items mapped to those new categories
    const categoryMap = Object.fromEntries(newCategories.map(cat => [cat.name, cat.id]));
    const newItems = defaultItems.map(item => new Item({
      id: generateSecureId('item-'),
      name: item.name,
      quantity: item.quantity,
      categoryId: categoryMap[item.category],
      isPacked: false,
      checklistId: newChecklist.id
    }));
    data.items = [...(data.items || []), ...newItems.map(i => i.toJSON())];

    data.checklists = checklists;
    this.saveData(data);
    return Promise.resolve(newChecklist.toJSON());
  }

  /**
   * Get all checklists
   * @returns {Promise<Array>} Array of Checklist objects
   */
  async getChecklists() {
    const data = this.getData();
    const checklists = (data.checklists || []).map(cl => Checklist.fromJSON(cl).toJSON());
    return Promise.resolve(checklists);
  }

  /**
   * Get a specific checklist by ID
   * @param {string} id - Checklist ID
   * @returns {Promise<Object|null>} Checklist object or null if not found
   */
  async getChecklistById(id) {
    const data = this.getData();
    const checklistData = (data.checklists || []).find(cl => cl.id === id);
    const checklist = checklistData ? Checklist.fromJSON(checklistData).toJSON() : null;
    return Promise.resolve(checklist);
  }

  /**
   * Update an existing checklist
   * @param {Object} checklist - Checklist to update (must include id)
   * @returns {Promise<Object>} Updated checklist
   */
  async updateChecklist(checklist) {
    const data = this.getData();
    const checklists = data.checklists || [];
    const index = checklists.findIndex(cl => cl.id === checklist.id);

    if (index === -1) {
      throw new Error(`Checklist with id ${checklist.id} not found`);
    }

    // Create a proper Checklist instance to ensure consistent structure
    const updatedChecklist = new Checklist(checklist);
    checklists[index] = updatedChecklist.toJSON();
    data.checklists = checklists;
    this.saveData(data);
    return Promise.resolve(updatedChecklist.toJSON());
  }

  /**
   * Delete a checklist and all associated categories and items
   * @param {string} id - Checklist ID to delete
   * @returns {Promise<void>}
   */
  async deleteChecklist(id) {
    const data = this.getData();
    data.checklists = (data.checklists || []).filter(cl => cl.id !== id);
    // Also remove categories and items associated with the checklist
    data.categories = (data.categories || []).filter(cat => cat.checklistId !== id);
    data.items = (data.items || []).filter(item => item.checklistId !== id);
    this.saveData(data);
    return Promise.resolve();
  }

  // ========================================
  // CATEGORY CRUD
  // ========================================

  /**
   * Create a new category within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {Object} category - Category to create
   * @returns {Promise<Object>} Created category
   */
  async createCategory(checklistId, category) {
    const data = this.getData();
    const categories = data.categories || [];

    // Create a proper Category instance to ensure consistent structure
    const newCategory = new Category({ ...category, checklistId });

    categories.push(newCategory.toJSON());
    data.categories = categories;
    this.saveData(data);
    return Promise.resolve(newCategory.toJSON());
  }

  /**
   * Get all categories (optionally filtered by checklist)
   * @param {string} [checklistId] - Optional checklist ID to filter by
   * @returns {Promise<Array>} Array of Category objects
   */
  async getCategories(checklistId) {
    const data = this.getData();
    const categories = (data.categories || [])
      .map(cat => Category.fromJSON(cat))
      .filter(cat => (checklistId ? cat.checklistId === checklistId : true))
      .map(cat => cat.toJSON());
    return Promise.resolve(categories);
  }

  /**
   * Get a specific category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object|null>} Category object or null if not found
   */
  async getCategoryById(categoryId) {
    const data = this.getData();
    const catData = (data.categories || []).find(c => c.id === categoryId);
    const category = catData ? Category.fromJSON(catData).toJSON() : null;
    return Promise.resolve(category);
  }

  /**
   * Update an existing category
   * @param {Object} category - Category to update (must include id)
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(category) {
    const data = this.getData();
    const categories = data.categories || [];
    const index = categories.findIndex(cat => cat.id === category.id);

    if (index === -1) {
      throw new Error(`Category with id ${category.id} not found`);
    }

    const updatedCategory = new Category(category);
    categories[index] = updatedCategory.toJSON();
    data.categories = categories;
    this.saveData(data);
    return Promise.resolve(updatedCategory.toJSON());
  }

  /**
   * Delete a category and all associated items
   * @param {string} categoryId - Category ID to delete
   * @returns {Promise<void>}
   */
  async deleteCategory(categoryId) {
    const data = this.getData();
    data.categories = (data.categories || []).filter(cat => cat.id !== categoryId);
    // Also delete all items in this category across all checklists
    data.items = (data.items || []).filter(item => item.categoryId !== categoryId);
    this.saveData(data);
    return Promise.resolve();
  }

  // ========================================
  // ITEM CRUD
  // ========================================

  /**
   * Create a new item within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {Object} item - Item to create
   * @returns {Promise<Object>} Created Item object
   */
  async createItem(checklistId, item) {
    const data = this.getData();
    const items = data.items || [];

    // Create a proper Item instance to ensure consistent structure
    const newItem = new Item({ ...item, checklistId });

    items.push(newItem.toJSON());
    data.items = items;
    this.saveData(data);
    return Promise.resolve(newItem.toJSON());
  }

  /**
   * Get all items for a specific checklist
   * @param {string} checklistId - Checklist ID
   * @returns {Promise<Array>} Array of Item objects
   */
  async getItems(checklistId) {
    const data = this.getData();
    const items = (data.items || [])
      .filter(item => item.checklistId === checklistId)
      .map(item => Item.fromJSON(item).toJSON());
    return Promise.resolve(items);
  }

  /**
   * Get a specific item by ID within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object|null>} Item object or null if not found
   */
  async getItemById(checklistId, itemId) {
    const data = this.getData();
    const itemData = (data.items || []).find(i => i.checklistId === checklistId && i.id === itemId);
    const item = itemData ? Item.fromJSON(itemData).toJSON() : null;
    return Promise.resolve(item);
  }

  /**
   * Update an existing item within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {Object} item - Item to update (must include id)
   * @returns {Promise<Object>} Updated Item object
   */
  async updateItem(checklistId, item) {
    const data = this.getData();
    const items = data.items || [];
    const index = items.findIndex(i => i.id === item.id && i.checklistId === checklistId);

    if (index === -1) {
      throw new Error(`Item with id ${item.id} not found in checklist ${checklistId}`);
    }

    // Create a proper Item instance to ensure consistent structure
    const updatedItem = new Item({ ...item, checklistId });
    items[index] = updatedItem.toJSON();
    data.items = items;
    this.saveData(data);
    return Promise.resolve(updatedItem.toJSON());
  }

  /**
   * Delete an item from a checklist
   * @param {string} checklistId - Checklist ID
   * @param {string} itemId - Item ID to delete
   * @returns {Promise<void>}
   */
  async deleteItem(checklistId, itemId) {
    const data = this.getData();
    data.items = (data.items || []).filter(
      item => !(item.checklistId === checklistId && item.id === itemId)
    );
    this.saveData(data);
    return Promise.resolve();
  }

}
