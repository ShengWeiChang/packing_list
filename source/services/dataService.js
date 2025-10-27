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
  // ---------------------------------------------------------------------------
  // Bulk data access
  // ---------------------------------------------------------------------------

  /**
   * Get all data (checklists, categories, items) for efficient bulk loading
   * @returns {Promise<object>} Object containing { checklists: Array, categories: Array, items: Array }
   */
  async getData() {
    throw new Error('Not implemented');
  }

  // ---------------------------------------------------------------------------
  // Checklist CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new checklist
   * @param {object} _checklist - Checklist data to create
   * @returns {Promise<object>} Created checklist
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
   * @returns {Promise<object | null>} Checklist object or null if not found
   */
  async getChecklistById(_id) {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing checklist
   * @param {object} _checklist - Updated checklist data (must include id)
   * @returns {Promise<object>} Updated checklist
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

  // ---------------------------------------------------------------------------
  // Category CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new category within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {object} _category - Category to create
   * @returns {Promise<object>} Created category
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
   * @returns {Promise<object | null>} Category object or null if not found
   */
  async getCategoryById(_categoryId) {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing category
   * @param {object} _category - Updated category data (must include id)
   * @returns {Promise<object>} Updated category
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

  // ---------------------------------------------------------------------------
  // Item CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new item within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {object} _item - Item to create
   * @returns {Promise<object>} Created Item object
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
   * @returns {Promise<object | null>} Item object or null if not found
   */
  async getItemById(_checklistId, _itemId) {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing item within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {object} _item - Item to update (must include id)
   * @returns {Promise<object>} Updated Item object
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
