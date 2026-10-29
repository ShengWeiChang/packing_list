/*
================================================================================
File: source/models/Template.ts
Description: Template model class with validation, serialization and
             secure ID generation for personal checklist templates.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { VALIDATION } from '../utils/constants';
import { generateSecureId } from '../utils/helpers';
import type { CategorySnapshot, ItemSnapshot, TemplateDTO, TemplateInput } from './contracts';

// -----------------------------------------------------------------------------
// Class definition
// -----------------------------------------------------------------------------

/**
 * Represents a personal checklist template containing categories and items
 */
export class Template implements TemplateDTO {
  declare id: string;
  declare name: string;
  declare order: number;
  declare categories: CategorySnapshot[];
  declare items: ItemSnapshot[];

  /**
   * Template class constructor
   * @param {object} root0 - Template configuration object
   * @param {string} root0.id - Unique identifier for the template
   * @param {string} root0.name - Name of the template
   * @param {number} root0.order - Display order for the template (default: 0)
   * @param {Array} root0.categories - Array of category snapshots
   * @param {Array} root0.items - Array of item snapshots
   */
  constructor({
    id = generateSecureId('template-'),
    name = '',
    order = 0,
    categories = [],
    items = [],
  }: TemplateInput = {}) {
    this.id = id;
    this.name = this.validateName(name);
    this.order = Number(order) || 0;
    this.categories = categories;
    this.items = items;
  }

  /**
   * Validate template name
   * @param {string} name - The name to validate
   * @returns {string} Validated name
   */
  validateName(name: unknown): string {
    if (typeof name !== 'string') {
      throw new Error('Template name must be a string');
    }

    const trimmedName = name.trim();

    if (trimmedName.length > VALIDATION.NAME_MAX_LENGTH) {
      throw new Error(`Template name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`);
    }

    return trimmedName;
  }

  /**
   * Creates a Template instance from JSON data
   * @param {object} json - The JSON data to create the template from
   * @returns {Template} A new Template instance
   */
  static fromJSON(json: TemplateInput): Template {
    return new Template(json);
  }

  /**
   * Converts the template instance to JSON format
   * @returns {object} The JSON representation of the template
   */
  toJSON(): TemplateDTO {
    return {
      id: this.id,
      name: this.name,
      order: this.order,
      categories: this.categories,
      items: this.items,
    };
  }
}
