/*
================================================================================
File: source/services/dataService.js
Description: Abstract data service interface defining CRUD operations for
             checklists, categories and items.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

/**
 * Abstract data service interface defining all required methods
 * for managing packing list data following CRUD patterns
 */
export class DataService {
  // ========================================
  // BULK DATA ACCESS
  // ========================================

  /**
   * Get all data (checklists, categories, items) for efficient bulk loading
   * @returns {Promise<Object>} Object containing { checklists: Array, categories: Array, items: Array }
   */
  async getData() {
    throw new Error('Not implemented');
  }

  // ========================================
  // CHECKLIST CRUD
  // ========================================

  /**
   * Create a new checklist
   * @param {Object} _checklist - Checklist data to create
   * @returns {Promise<Object>} Created checklist
   */
  async createChecklist(_checklist) {
    throw new Error('Not implemented');
  }

  /**
   * Get all checklists
   * @returns {Promise<Array>} Array of checklists
   */
  async getChecklists() {
    throw new Error('Not implemented');
  }

  /**
   * Get a specific checklist by ID
   * @param {string} _id - Checklist ID
   * @returns {Promise<Object|null>} Checklist object or null if not found
   */
  async getChecklistById(_id) {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing checklist
   * @param {Object} _checklist - Updated checklist data (must include id)
   * @returns {Promise<Object>} Updated checklist
   */
  async updateChecklist(_checklist) {
    throw new Error('Not implemented');
  }

  /**
   * Delete a checklist
   * @param {string} _id - Checklist ID to delete
   * @returns {Promise<void>}
   */
  async deleteChecklist(_id) {
    throw new Error('Not implemented');
  }

  // ========================================
  // CATEGORY CRUD
  // ========================================

  /**
   * Create a new category within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {Object} _category - Category to create
   * @returns {Promise<Object>} Created category
   */
  async createCategory(_checklistId, _category) {
    throw new Error('Not implemented');
  }

  /**
   * Get all categories (optionally filtered by checklist)
   * @param {string} [_checklistId] - Optional checklist ID to filter by
   * @returns {Promise<Array>} Array of Category objects
   */
  async getCategories(_checklistId) {
    throw new Error('Not implemented');
  }

  /**
   * Get a specific category by ID
   * @param {string} _categoryId - Category ID
   * @returns {Promise<Object|null>} Category object or null if not found
   */
  async getCategoryById(_categoryId) {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing category
   * @param {Object} _category - Updated category data (must include id)
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(_category) {
    throw new Error('Not implemented');
  }

  /**
   * Delete a category
   * @param {string} _categoryId - Category ID to delete
   * @returns {Promise<void>}
   */
  async deleteCategory(_categoryId) {
    throw new Error('Not implemented');
  }

  // ========================================
  // ITEM CRUD
  // ========================================

  /**
   * Create a new item within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {Object} _item - Item to create
   * @returns {Promise<Object>} Created Item object
   */
  async createItem(_checklistId, _item) {
    throw new Error('Not implemented');
  }

  /**
   * Get all items for a specific checklist
   * @param {string} _checklistId - Checklist ID
   * @returns {Promise<Array>} Array of Item objects
   */
  async getItems(_checklistId) {
    throw new Error('Not implemented');
  }

  /**
   * Get a specific item by ID within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {string} _itemId - Item ID
   * @returns {Promise<Object|null>} Item object or null if not found
   */
  async getItemById(_checklistId, _itemId) {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing item within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {Object} _item - Item to update (must include id)
   * @returns {Promise<Object>} Updated Item object
   */
  async updateItem(_checklistId, _item) {
    throw new Error('Not implemented');
  }

  /**
   * Delete an item
   * @param {string} _checklistId - Checklist ID
   * @param {string} _itemId - Item ID to delete
   * @returns {Promise<void>}
   */
  async deleteItem(_checklistId, _itemId) {
    throw new Error('Not implemented');
  }
}
