/*
================================================================================
File: tests/unit-tests/models/Template.test.js
Description: Unit tests for Template model validation and serialization.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

import { describe, expect, it } from 'vitest';

import { Template } from '../../../source/models/Template';

describe('Template', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Construction and Serialization
  // ---------------------------------------------------------------------------

  // Test Case 1: Should create a template with a generated ID and empty content
  it('creates a template with a generated ID and empty content', () => {
    const template = new Template({ name: 'Winter trip' });

    expect(template.id).toMatch(/^template-/);
    expect(template.categories).toEqual([]);
    expect(template.items).toEqual([]);
  });

  // Test Case 2: Should trim its name and round-trip its snapshot content
  it('trims its name and round-trips its snapshot content', () => {
    const original = new Template({
      id: 'template-1',
      name: '  Weekend  ',
      order: 2,
      categories: [{ id: 'category-1', name: 'Clothes', order: 0 }],
      items: [{ name: 'Jacket', quantity: 1, categoryId: 'category-1', order: 0 }],
    });

    expect(Template.fromJSON(original.toJSON())).toMatchObject({
      id: 'template-1',
      name: 'Weekend',
      order: 2,
      categories: original.categories,
      items: original.items,
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Validation
  // ---------------------------------------------------------------------------

  // Test Case 3: Should reject a non-string or too-long name
  it('rejects a non-string or too-long name', () => {
    expect(() => new Template({ name: null })).toThrow('Template name must be a string');
    expect(() => new Template({ name: 'a'.repeat(101) })).toThrow(
      'Template name must be less than 100 characters'
    );
  });
});
