/*
================================================================================
File: source/models/Category.js
Description: Category model class with validation, serialization and
             secure ID generation.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

import { VALIDATION } from '../utils/constants.js';
import { generateSecureId } from '../utils/helpers.js';

/**
 * Represents a category of items in a checklist
 */
export class Category {
  constructor({
    id = generateSecureId('category-'),
    name = '',
    checklistId = null,
    order = 0,
  } = {}) {
    this.id = id;
    this.name = this.validateName(name);
    this.checklistId = checklistId;
    this.order = Number(order) || 0;
  }

  /**
   * Validate category name
   * @param {string} name - The name to validate
   * @returns {string} Validated name
   */
  validateName(name) {
    if (typeof name !== 'string') {
      throw new Error('Category name must be a string');
    }
    // Allow empty name for initial creation, but enforce max length
    if (name.length > VALIDATION.NAME_MAX_LENGTH) {
      throw new Error(`Category name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`);
    }
    return name;
  }

  /**
   * Creates a Category instance from JSON data
   * @param {Object} json - The JSON data to create the category from
   * @returns {Category} A new Category instance
   */
  static fromJSON(json) {
    return new Category(json);
  }

  /**
   * Converts the category instance to JSON format
   * @returns {Object} The JSON representation of the category
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      checklistId: this.checklistId,
      order: this.order,
    };
  }
}
