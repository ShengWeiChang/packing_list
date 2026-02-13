/*
================================================================================
File: tests/unit-tests/models/Item.test.js
Description: Unit tests for Item model.
             Tests validation logic, default values, serialization, and
             business rules.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-05
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';

import { Item } from '../../../source/models/Item';

// -----------------------------------------------------------------------------
// Item Model Tests
// -----------------------------------------------------------------------------

describe('Item', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Constructor and Default Values
  // ---------------------------------------------------------------------------

  describe('constructor and defaults', () => {
    // Test Case 1: Item should be created with all required properties
    it('should create an item with default values', () => {
      const item = new Item({ name: 'Passport' });

      expect(item.name).toBe('Passport');
      expect(item.quantity).toBe(1);
      expect(item.isPacked).toBe(false);
      expect(item.isPending).toBe(false);
      expect(item.order).toBe(0);
    });

    // Test Case 2: Custom values should override defaults
    it('should accept custom values', () => {
      const item = new Item({
        name: 'Laptop',
        quantity: 2,
        isPacked: true,
      });

      expect(item.name).toBe('Laptop');
      expect(item.quantity).toBe(2);
      expect(item.isPacked).toBe(true);
    });

    // Test Case 3: Item should generate a unique ID
    it('should generate a unique ID', () => {
      const item1 = new Item({ name: 'Item 1' });
      const item2 = new Item({ name: 'Item 2' });

      expect(item1.id).toBeDefined();
      expect(item2.id).toBeDefined();
      expect(item1.id).not.toBe(item2.id);
    });

    // Test Case 4: ID should have correct prefix format
    it('should generate ID with correct prefix', () => {
      const item = new Item({ name: 'Test' });

      expect(item.id).toMatch(/^item-/);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Name Validation
  // ---------------------------------------------------------------------------

  describe('name validation', () => {
    // Test Case 5: Empty name should throw error
    it('should throw error for empty name', () => {
      expect(() => new Item({ name: '' })).toThrow('Item name must be at least 1 character long');
    });

    // Test Case 6: Name exceeding max length should throw error
    it('should throw error for name exceeding max length', () => {
      const longName = 'a'.repeat(101);

      expect(() => new Item({ name: longName })).toThrow(
        'Item name must be less than 100 characters'
      );
    });

    // Test Case 7: Name at max length should be valid
    it('should accept name at max length', () => {
      const maxName = 'a'.repeat(100);
      const item = new Item({ name: maxName });

      expect(item.name).toBe(maxName);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Quantity Validation
  // ---------------------------------------------------------------------------

  describe('quantity validation', () => {
    // Test Case 8: Quantity less than 1 should throw error
    it('should throw error for quantity less than 1', () => {
      expect(() => new Item({ name: 'Test', quantity: 0 })).toThrow(
        'Quantity must be an integer between 1 and 999'
      );
    });

    // Test Case 9: Negative quantity should throw error
    it('should throw error for negative quantity', () => {
      expect(() => new Item({ name: 'Test', quantity: -1 })).toThrow(
        'Quantity must be an integer between 1 and 999'
      );
    });

    // Test Case 10: Large quantity should be valid
    it('should accept large quantity', () => {
      const item = new Item({ name: 'Test', quantity: 999 });

      expect(item.quantity).toBe(999);
    });

    // Test Case 11: Quantity greater than 999 should throw error
    it('should throw error for quantity greater than 999', () => {
      expect(() => new Item({ name: 'Test', quantity: 1000 })).toThrow(
        'Quantity must be an integer between 1 and 999'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Serialization (toJSON / fromJSON)
  // ---------------------------------------------------------------------------

  describe('serialization', () => {
    // Test Case 11: toJSON should return plain object
    it('should serialize to JSON correctly', () => {
      const item = new Item({
        name: 'Passport',
        quantity: 1,
        isPacked: true,
      });
      const json = item.toJSON();

      expect(json).toHaveProperty('id');
      expect(json.name).toBe('Passport');
      expect(json.quantity).toBe(1);
      expect(json.isPacked).toBe(true);
    });

    // Test Case 12: fromJSON should recreate Item instance
    it('should deserialize from JSON correctly', () => {
      const original = new Item({ name: 'Laptop', quantity: 2 });
      const json = original.toJSON();
      const restored = Item.fromJSON(json);

      expect(restored.id).toBe(original.id);
      expect(restored.name).toBe(original.name);
      expect(restored.quantity).toBe(original.quantity);
    });

    // Test Case 13: Roundtrip serialization should preserve all data
    it('should preserve all properties through roundtrip', () => {
      const original = new Item({
        name: 'Camera',
        quantity: 3,
        isPacked: true,
        isPending: true,
        categoryId: 'cat-123',
        checklistId: 'cl-456',
        order: 5,
      });

      const restored = Item.fromJSON(original.toJSON());

      expect(restored.name).toBe(original.name);
      expect(restored.quantity).toBe(original.quantity);
      expect(restored.isPacked).toBe(original.isPacked);
      expect(restored.isPending).toBe(original.isPending);
      expect(restored.categoryId).toBe(original.categoryId);
      expect(restored.checklistId).toBe(original.checklistId);
      expect(restored.order).toBe(original.order);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 5: togglePacked
  // ---------------------------------------------------------------------------

  describe('togglePacked', () => {
    // Test Case 14: togglePacked should flip isPacked from false to true
    it('should toggle isPacked from false to true', () => {
      const item = new Item({ name: 'Test', isPacked: false });
      expect(item.isPacked).toBe(false);

      item.togglePacked();

      expect(item.isPacked).toBe(true);
    });

    // Test Case 15: togglePacked should flip isPacked from true to false
    it('should toggle isPacked from true to false', () => {
      const item = new Item({ name: 'Test', isPacked: true });
      expect(item.isPacked).toBe(true);

      item.togglePacked();

      expect(item.isPacked).toBe(false);
    });
  });
});
