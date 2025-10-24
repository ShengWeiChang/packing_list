/*
================================================================================
File: source/models/Item.js
Description: Item model class with validation, serialization and
             secure ID generation.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

import { VALIDATION } from '../utils/constants.js';
import { generateSecureId } from '../utils/helpers.js';

/**
 * Represents an item in a checklist
 */
export class Item {
  constructor({
    id = generateSecureId('item-'),
    name = '',
    quantity = 1,
    categoryId = null,
    isPacked = false,
    checklistId = null,
    order = 0,
  } = {}) {
    this.id = id;
    this.name = this.validateName(name);
    this.quantity = this.validateQuantity(quantity);
    this.categoryId = categoryId;
    this.isPacked = Boolean(isPacked);
    this.checklistId = checklistId;
    this.order = Number(order) || 0;
  }

  /**
   * Validate item name
   * @param {string} name - The name to validate
   * @returns {string} Validated name
   */
  validateName(name) {
    if (typeof name !== 'string') {
      throw new Error('Item name must be a string');
    }
    if (name.length < VALIDATION.NAME_MIN_LENGTH) {
      throw new Error(`Item name must be at least ${VALIDATION.NAME_MIN_LENGTH} character long`);
    }
    if (name.length > VALIDATION.NAME_MAX_LENGTH) {
      throw new Error(`Item name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`);
    }
    return name;
  }

  /**
   * Validate item quantity
   * @param {number} quantity - The quantity to validate
   * @returns {number} Validated quantity
   */
  validateQuantity(quantity) {
    const num = Number(quantity);
    if (!Number.isInteger(num) || num < VALIDATION.MIN_QUANTITY || num > VALIDATION.MAX_QUANTITY) {
      throw new Error(
        `Quantity must be an integer between ${VALIDATION.MIN_QUANTITY} and ${VALIDATION.MAX_QUANTITY}`
      );
    }
    return num;
  }

  /**
   * Creates an Item instance from JSON data
   * @param {Object} json - The JSON data to create the item from
   * @returns {Item} A new Item instance
   */
  static fromJSON(json) {
    // Ensure isPacked is properly converted to boolean
    const itemData = {
      ...json,
      isPacked: Boolean(json.isPacked),
    };
    return new Item(itemData);
  }

  /**
   * Converts the item instance to JSON format
   * @returns {Object} The JSON representation of the item
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      quantity: this.quantity,
      categoryId: this.categoryId,
      isPacked: this.isPacked,
      checklistId: this.checklistId,
      order: this.order,
    };
  }

  /**
   * Toggles the packed status of the item
   */
  togglePacked() {
    this.isPacked = !this.isPacked;
  }
}
