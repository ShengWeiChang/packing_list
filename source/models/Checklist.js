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
 * Represents a packing list with basic information and metadata
 */
export class Checklist {
  constructor({
    id = generateSecureId('checklist-'),
    destination = '',
    startDate = new Date().toISOString().slice(0, 10),
    endDate = new Date().toISOString().slice(0, 10),
  } = {}) {
    this.id = id;
    this.destination = this.validateDestination(destination);
    this.startDate = startDate;
    this.endDate = endDate;
  }

  /**
   * Validate checklist destination
   * @param {string} destination - The destination to validate
   * @returns {string} Validated destination
   */
  validateDestination(destination) {
    if (typeof destination !== 'string') {
      throw new Error('Destination must be a string');
    }
    // Allow empty destination for initial creation, but enforce max length
    if (destination.length > VALIDATION.NAME_MAX_LENGTH) {
      throw new Error(`Destination must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`);
    }
    return destination;
  }


  /**
   * Creates a Checklist instance from JSON data
   * @param {Object} json - The JSON data to create the checklist from
   * @returns {Checklist} A new Checklist instance
   */
  static fromJSON(json) {
    return new Checklist(json);
  }

  /**
   * Converts the checklist instance to JSON format
   * @returns {Object} The JSON representation of the checklist
   */
  toJSON() {
    return {
      id: this.id,
      destination: this.destination,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }
}
