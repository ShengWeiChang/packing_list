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
   * @param {string} root0.destination - Destination location for the trip
   * @param {string} root0.startDate - Trip start date in ISO format (YYYY-MM-DD)
   * @param {string} root0.endDate - Trip end date in ISO format (YYYY-MM-DD)
   */
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
      destination: this.destination,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }
}
