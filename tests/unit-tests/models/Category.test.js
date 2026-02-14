/*
================================================================================
File: tests/unit-tests/models/Category.test.js
Description: Unit tests for Category model.
             Tests validation logic, default values, and serialization.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-05
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';

import { Category } from '../../../source/models/Category';

// -----------------------------------------------------------------------------
// Category Model Tests
// -----------------------------------------------------------------------------

describe('Category', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Constructor and Default Values
  // ---------------------------------------------------------------------------

  describe('constructor and defaults', () => {
    // Test Case 1: Category should be created with all required properties
    it('should create a category with default values', () => {
      const category = new Category({ name: 'Clothes' });

      expect(category.name).toBe('Clothes');
      expect(category.order).toBe(0);
    });

    // Test Case 2: Custom values should override defaults
    it('should accept custom values', () => {
      const category = new Category({
        name: 'Electronics',
        order: 5,
      });

      expect(category.name).toBe('Electronics');
      expect(category.order).toBe(5);
    });

    // Test Case 3: Category should generate a unique ID
    it('should generate a unique ID', () => {
      const cat1 = new Category({ name: 'Category 1' });
      const cat2 = new Category({ name: 'Category 2' });

      expect(cat1.id).toEqual(expect.any(String));
      expect(cat2.id).toEqual(expect.any(String));
      expect(cat1.id).not.toBe(cat2.id);
    });

    // Test Case 4: ID should have correct prefix format
    it('should generate ID with correct prefix', () => {
      const category = new Category({ name: 'Test' });

      expect(category.id).toMatch(/^category-/);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Name Validation
  // ---------------------------------------------------------------------------

  describe('name validation', () => {
    // Test Case 5: Name exceeding max length should throw error
    it('should throw error for name exceeding max length', () => {
      const longName = 'a'.repeat(101);

      expect(() => new Category({ name: longName })).toThrow(
        'Category name must be less than 100 characters'
      );
    });

    // Test Case 6: Empty name should be allowed
    it('should allow empty name', () => {
      const category = new Category({ name: '' });

      expect(category.name).toBe('');
    });

    // Test Case 7: Non-string name should throw error
    it('should throw error for non-string name', () => {
      expect(() => new Category({ name: 123 })).toThrow('Category name must be a string');
      expect(() => new Category({ name: null })).toThrow('Category name must be a string');
      expect(() => new Category({ name: true })).toThrow('Category name must be a string');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Serialization (toJSON / fromJSON)
  // ---------------------------------------------------------------------------

  describe('serialization', () => {
    // Test Case 8: toJSON should return plain object
    it('should serialize to JSON correctly', () => {
      const category = new Category({
        name: 'Toiletries',
        order: 3,
      });
      const json = category.toJSON();

      expect(json).toHaveProperty('id');
      expect(json.name).toBe('Toiletries');
      expect(json.order).toBe(3);
    });

    // Test Case 9: fromJSON should recreate Category instance
    it('should deserialize from JSON correctly', () => {
      const original = new Category({ name: 'Documents', order: 2 });
      const json = original.toJSON();
      const restored = Category.fromJSON(json);

      expect(restored.id).toBe(original.id);
      expect(restored.name).toBe(original.name);
      expect(restored.order).toBe(original.order);
    });
  });
});
