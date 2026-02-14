/*
================================================================================
File: tests/unit-tests/models/Checklist.test.js
Description: Unit tests for Checklist model.
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

import { Checklist } from '../../../source/models/Checklist';

// -----------------------------------------------------------------------------
// Checklist Model Tests
// -----------------------------------------------------------------------------

describe('Checklist', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Constructor and Default Values
  // ---------------------------------------------------------------------------

  describe('constructor and defaults', () => {
    // Test Case 1: Checklist should be created with all required properties
    it('should create a checklist with default values', () => {
      const checklist = new Checklist({ name: 'Japan Trip' });
      const today = new Date().toISOString().slice(0, 10);

      expect(checklist.name).toBe('Japan Trip');
      expect(checklist.startDate).toBe(today);
      expect(checklist.endDate).toBe(today);
      expect(checklist.order).toBe(0);
    });

    // Test Case 2: Custom values should override defaults
    it('should accept custom values', () => {
      const checklist = new Checklist({
        name: 'Europe Trip',
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        order: 3,
      });

      expect(checklist.name).toBe('Europe Trip');
      expect(checklist.startDate).toBe('2026-06-01');
      expect(checklist.endDate).toBe('2026-06-15');
      expect(checklist.order).toBe(3);
    });

    // Test Case 3: Checklist should generate a unique ID
    it('should generate a unique ID', () => {
      const cl1 = new Checklist({ name: 'Checklist 1' });
      const cl2 = new Checklist({ name: 'Checklist 2' });

      expect(cl1.id).toEqual(expect.any(String));
      expect(cl2.id).toEqual(expect.any(String));
      expect(cl1.id).not.toBe(cl2.id);
    });

    // Test Case 4: ID should have correct prefix format
    it('should generate ID with correct prefix', () => {
      const checklist = new Checklist({ name: 'Test' });

      expect(checklist.id).toMatch(/^checklist-/);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Name Validation
  // ---------------------------------------------------------------------------

  describe('name validation', () => {
    // Test Case 5: Name should be trimmed
    it('should trim whitespace from name', () => {
      const checklist = new Checklist({ name: '  Trip  ' });

      expect(checklist.name).toBe('Trip');
    });

    // Test Case 6: Name exceeding max length should throw error
    it('should throw error for name exceeding max length', () => {
      const longName = 'a'.repeat(101);

      expect(() => new Checklist({ name: longName })).toThrow(
        'Name must be less than 100 characters'
      );
    });

    // Test Case 7: Empty name should be allowed (after trim)
    it('should allow empty name', () => {
      const checklist = new Checklist({ name: '' });

      expect(checklist.name).toBe('');
    });

    // Test Case 8: Non-string name should throw error
    it('should throw error for non-string name', () => {
      expect(() => new Checklist({ name: 123 })).toThrow('Name must be a string');
      expect(() => new Checklist({ name: null })).toThrow('Name must be a string');
      expect(() => new Checklist({ name: true })).toThrow('Name must be a string');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Serialization (toJSON / fromJSON)
  // ---------------------------------------------------------------------------

  describe('serialization', () => {
    // Test Case 9: toJSON should return plain object
    it('should serialize to JSON correctly', () => {
      const checklist = new Checklist({
        name: 'Weekend Trip',
        startDate: '2026-03-01',
        endDate: '2026-03-03',
      });
      const json = checklist.toJSON();

      expect(json).toHaveProperty('id');
      expect(json.name).toBe('Weekend Trip');
      expect(json.startDate).toBe('2026-03-01');
      expect(json.endDate).toBe('2026-03-03');
    });

    // Test Case 10: fromJSON should recreate Checklist instance
    it('should deserialize from JSON correctly', () => {
      const original = new Checklist({ name: 'Business Trip', order: 2 });
      const json = original.toJSON();
      const restored = Checklist.fromJSON(json);

      expect(restored.id).toBe(original.id);
      expect(restored.name).toBe(original.name);
      expect(restored.order).toBe(original.order);
    });

    // Test Case 11: Roundtrip serialization should preserve all data
    it('should preserve all properties through roundtrip', () => {
      const original = new Checklist({
        name: 'Vacation',
        startDate: '2026-07-01',
        endDate: '2026-07-14',
        order: 5,
      });

      const restored = Checklist.fromJSON(original.toJSON());

      expect(restored.name).toBe(original.name);
      expect(restored.startDate).toBe(original.startDate);
      expect(restored.endDate).toBe(original.endDate);
      expect(restored.order).toBe(original.order);
    });
  });
});
