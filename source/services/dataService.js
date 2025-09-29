/**
 * Abstract data service interface defining all required methods
 * for managing packing list data
 */
export class DataService {
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
   * @returns {Promise<Object>} Checklist object
   */
  async getChecklistById(id) {
    throw new Error('Not implemented');
  }

  /**
   * Save a checklist
   * @param {Object} checklist - Checklist to save
   * @returns {Promise<Object>} Saved checklist
   */
  async saveChecklist(checklist) {
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

  /**
   * Get all categories
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories() {
    throw new Error('Not implemented');
  }

  /**
   * Save a category
   * @param {Object} category - Category to save
   * @returns {Promise<Object>} Saved category
   */
  async saveCategory(category) {
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

  /**
   * Get items for a specific checklist
   * @param {string} checklistId - Checklist ID
   * @returns {Promise<Array>} Array of items
   */
  async getItems(checklistId) {
    throw new Error('Not implemented');
  }

  /**
   * Save an item
   * @param {string} checklistId - Checklist ID
   * @param {Object} item - Item to save
   * @returns {Promise<Object>} Saved item
   */
  async saveItem(checklistId, item) {
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
