/*
================================================================================
File: source/models/Checklist.js
Description: Checklist model class with validation, serialization and
             secure ID generation.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { VALIDATION } from '../utils/constants.js';
import { generateSecureId } from '../utils/helpers.js';

// -----------------------------------------------------------------------------
// Class definition
// -----------------------------------------------------------------------------

/**
 * Represents a packing list with basic information and metadata
 */
export class Checklist {
  /**
   * Checklist class constructor
   * @param {object} root0 - Checklist configuration object
   * @param {string} root0.id - Unique identifier for the checklist
   * @param {string} root0.name - Name of the checklist
   * @param {string} root0.startDate - Trip start date in ISO format (YYYY-MM-DD)
   * @param {string} root0.endDate - Trip end date in ISO format (YYYY-MM-DD)
   * @param {number} root0.order - Display order for the checklist (default: 0)
   */
  constructor({
    id = generateSecureId('checklist-'),
    name = '',
    startDate = new Date().toISOString().slice(0, 10),
    endDate = new Date().toISOString().slice(0, 10),
    order = 0,
  } = {}) {
    this.id = id;
    this.name = this.validateName(name);
    this.startDate = startDate;
    this.endDate = endDate;
    this.order = order;
  }

  /**
   * Validate checklist name
   * @param {string} name - The name to validate
   * @returns {string} Validated name
   */
  validateName(name) {
    if (typeof name !== 'string') {
      throw new Error('Name must be a string');
    }

    // Trim whitespace
    const trimmedName = name.trim();

    // Enforce max length (allow empty string - UI/Service layer handles defaults)
    if (trimmedName.length > VALIDATION.NAME_MAX_LENGTH) {
      throw new Error(`Name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`);
    }

    return trimmedName;
  }

  /**
   * Creates a Checklist instance from JSON data
   * @param {object} json - The JSON data to create the checklist from
   * @returns {Checklist} A new Checklist instance
   */
  static fromJSON(json) {
    return new Checklist(json);
  }

  /**
   * Converts the checklist instance to JSON format
   * @returns {object} The JSON representation of the checklist
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      startDate: this.startDate,
      endDate: this.endDate,
      order: this.order,
    };
  }
}
