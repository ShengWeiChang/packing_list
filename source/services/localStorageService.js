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


  /**
   * Get default categories
   * @returns {Array} Array of default categories
   */
  getDefaultCategories() {
    const categoryNames = [...new Set(defaultItems.map(item => item.category))];
    // Let the Category constructor generate secure IDs so IDs are consistent
    // with other entities (checklists/items) which use crypto.randomUUID when available.
    return categoryNames.map(name => new Category({ name }));
  }

  /**
   * Generate default categories for a specific checklist (categories are scoped to a checklist)
   */
  getDefaultCategoriesForChecklist(checklistId) {
    const categoryNames = [...new Set(defaultItems.map(item => item.category))];
    return categoryNames.map(name => new Category({ name, checklistId }));
  }

  /**
   * Get default items with unique IDs for a new checklist
   * @returns {Array} Array of default items
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

  /**
   * Get all stored data
   */
  getData() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return JSON.parse(data || '{}');
  }

  /**
   * Get parsed app data with a simple in-memory cache.
   * Consumers can call this once at startup to avoid multiple parses.
   */
  getAll() {
    if (this._cache) return this._cache;
    const data = this.getData();
    this._cache = data;
    return data;
  }

  /**
   * Save all data
   */
  saveData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    // update cache so subsequent reads stay consistent
    this._cache = data;
  }

  // DataService implementation
  getChecklists() {
    const data = this.getData();
    const checklists = (data.checklists || []).map(cl => Checklist.fromJSON(cl));
    return Promise.resolve(checklists);
  }

  getChecklistById(id) {
    const data = this.getData();
    const checklistData = (data.checklists || []).find(cl => cl.id === id);
    const checklist = checklistData ? Checklist.fromJSON(checklistData) : null;
    return Promise.resolve(checklist);
  }

  saveChecklist(checklist) {
    const data = this.getData();
    const checklists = data.checklists || [];
    const index = checklists.findIndex(cl => cl.id === checklist.id);

    if (index !== -1) {
      checklists[index] = checklist;
    } else {
      checklists.push(checklist);
      // For new checklists, generate default categories scoped to this checklist
      const newCategories = this.getDefaultCategoriesForChecklist(checklist.id);
      data.categories = [...(data.categories || []), ...newCategories.map(c => c.toJSON())];

      // Then generate default items mapped to those new categories
      const categoryMap = Object.fromEntries(newCategories.map(cat => [cat.name, cat.id]));
      const newItems = defaultItems.map(item => new Item({
        id: generateSecureId('item-'),
        name: item.name,
        quantity: item.quantity,
        categoryId: categoryMap[item.category],
        isPacked: false,
        checklistId: checklist.id
      }));
      data.items = [...(data.items || []), ...newItems.map(i => i.toJSON())];
    }

    data.checklists = checklists;
    this.saveData(data);
    return Promise.resolve(checklist);
  }

  deleteChecklist(id) {
    const data = this.getData();
    data.checklists = (data.checklists || []).filter(cl => cl.id !== id);
    // Also remove categories and items associated with the checklist
    data.categories = (data.categories || []).filter(cat => cat.checklistId !== id);
    data.items = (data.items || []).filter(item => item.checklistId !== id);
    this.saveData(data);
    return Promise.resolve();
  }

  getCategories() {
    const data = this.getData();
    const categories = (data.categories || []).map(cat => Category.fromJSON(cat));
    return Promise.resolve(categories);
  }

  // Get categories optionally filtered by checklistId
  getCategoriesForChecklist(checklistId) {
    const data = this.getData();
    const categories = (data.categories || [])
      .map(cat => Category.fromJSON(cat))
      .filter(cat => (checklistId ? cat.checklistId === checklistId : true));
    return Promise.resolve(categories);
  }

  saveCategory(category) {
    const data = this.getData();
    const categories = data.categories || [];
    const index = categories.findIndex(cat => cat.id === category.id);

    if (index !== -1) {
      categories[index] = category;
    } else {
      categories.push(category);
    }

    data.categories = categories;
    this.saveData(data);
    return Promise.resolve(category);
  }

  deleteCategory(categoryId) {
    const data = this.getData();
    data.categories = (data.categories || []).filter(cat => cat.id !== categoryId);
    // Also delete all items in this category across all checklists
    data.items = (data.items || []).filter(item => item.categoryId !== categoryId);
    this.saveData(data);
    return Promise.resolve();
  }

  getItems(checklistId) {
    const data = this.getData();
    const items = (data.items || [])
      .filter(item => item.checklistId === checklistId)
      .map(item => Item.fromJSON(item));
    return Promise.resolve(items);
  }

  saveItem(checklistId, item) {
    const data = this.getData();
    const items = data.items || [];
    const index = items.findIndex(i => i.id === item.id);

    const itemToSave = { ...item, checklistId };

    if (index !== -1) {
      items[index] = itemToSave;
    } else {
      // Ensure new items have a unique ID
      if (!itemToSave.id) {
        itemToSave.id = generateSecureId('item-');
      }
      items.push(itemToSave);
    }

    data.items = items;
    this.saveData(data);
    return Promise.resolve(Item.fromJSON(itemToSave));
  }

  deleteItem(checklistId, itemId) {
    const data = this.getData();
    data.items = (data.items || []).filter(
      item => !(item.checklistId === checklistId && item.id === itemId)
    );
    this.saveData(data);
    return Promise.resolve();
  }
}
