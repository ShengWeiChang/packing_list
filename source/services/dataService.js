/*
================================================================================
File: source/services/dataService.js
Description: Abstract data service interface defining CRUD operations for
             checklists, categories and items.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
Last-Modified: 2025-09-30
================================================================================
*/

/**
 * Abstract data service interface defining all required methods
 * for managing packing list data following CRUD patterns
 */
export class DataService {
  // ========================================
  // CHECKLIST CRUD
  // ========================================

  /**
   * Create a new checklist
   * @param {Object} checklist - Checklist to create
   * @returns {Promise<Object>} Created checklist
   */
  async createChecklist(checklist) {
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
   * @param {string} id - Checklist ID
   * @returns {Promise<Object|null>} Checklist object or null if not found
   */
  async getChecklistById(id) {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing checklist
   * @param {Object} checklist - Checklist to update (must include id)
   * @returns {Promise<Object>} Updated checklist
   */
  async updateChecklist(checklist) {
    throw new Error('Not implemented');
  }

  /**
   * Delete a checklist
   * @param {string} id - Checklist ID to delete
   * @returns {Promise<void>}
   */
  async deleteChecklist(id) {
    throw new Error('Not implemented');
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
    throw new Error('Not implemented');
  }

  /**
   * Get all categories (optionally filtered by checklist)
   * @param {string} [checklistId] - Optional checklist ID to filter by
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories(checklistId) {
    throw new Error('Not implemented');
  }

  /**
   * Get a specific category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object|null>} Category object or null if not found
   */
  async getCategoryById(categoryId) {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing category
   * @param {Object} category - Category to update (must include id)
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(category) {
    throw new Error('Not implemented');
  }

  /**
   * Delete a category
   * @param {string} categoryId - Category ID to delete
   * @returns {Promise<void>}
   */
  async deleteCategory(categoryId) {
    throw new Error('Not implemented');
  }

  // ========================================
  // ITEM CRUD
  // ========================================

  /**
   * Create a new item within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {Object} item - Item to create
   * @returns {Promise<Object>} Created item
   */
  async createItem(checklistId, item) {
    throw new Error('Not implemented');
  }

  /**
   * Get all items for a specific checklist
   * @param {string} checklistId - Checklist ID
   * @returns {Promise<Array>} Array of items
   */
  async getItems(checklistId) {
    throw new Error('Not implemented');
  }

  /**
   * Get a specific item by ID within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object|null>} Item object or null if not found
   */
  async getItemById(checklistId, itemId) {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing item within a checklist
   * @param {string} checklistId - Checklist ID
   * @param {Object} item - Item to update (must include id)
   * @returns {Promise<Object>} Updated item
   */
  async updateItem(checklistId, item) {
    throw new Error('Not implemented');
  }

  /**
   * Delete an item
   * @param {string} checklistId - Checklist ID
   * @param {string} itemId - Item ID to delete
   * @returns {Promise<void>}
   */
  async deleteItem(checklistId, itemId) {
    throw new Error('Not implemented');
  }
}
