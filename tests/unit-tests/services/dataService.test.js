/*
================================================================================
File: tests/unit-tests/services/dataService.test.js
Description: Unit tests for DataService abstract class.
             Verifies that all interface methods throw "Not implemented" errors.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-05
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';

import { DataService } from '../../../source/services/dataService';

// -----------------------------------------------------------------------------
// DataService Abstract Interface Tests
// -----------------------------------------------------------------------------

describe('DataService', () => {
  const service = new DataService();

  // ---------------------------------------------------------------------------
  // Test Group 1: Data Operations
  // ---------------------------------------------------------------------------

  describe('data operations', () => {
    // Test Case 1: getData should throw not implemented error
    it('should throw not implemented for getData', async () => {
      await expect(service.getData()).rejects.toThrow('Not implemented');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: CRUD Operations
  // ---------------------------------------------------------------------------

  describe('CRUD operations', () => {
    // Test Case 2: createChecklist should throw not implemented error
    it('should throw not implemented for createChecklist', async () => {
      await expect(service.createChecklist({})).rejects.toThrow('Not implemented');
    });

    // Test Case 3: getChecklists should throw not implemented error
    it('should throw not implemented for getChecklists', async () => {
      await expect(service.getChecklists()).rejects.toThrow('Not implemented');
    });

    // Test Case 4: updateChecklist should throw not implemented error
    it('should throw not implemented for updateChecklist', async () => {
      await expect(service.updateChecklist({})).rejects.toThrow('Not implemented');
    });

    // Test Case 5: deleteChecklist should throw not implemented error
    it('should throw not implemented for deleteChecklist', async () => {
      await expect(service.deleteChecklist('id')).rejects.toThrow('Not implemented');
    });

    // Test Case 6: createCategory should throw not implemented error
    it('should throw not implemented for createCategory', async () => {
      await expect(service.createCategory('clId', {})).rejects.toThrow('Not implemented');
    });

    // Test Case 7: getCategories should throw not implemented error
    it('should throw not implemented for getCategories', async () => {
      await expect(service.getCategories('clId')).rejects.toThrow('Not implemented');
    });

    // Test Case 8: updateCategory should throw not implemented error
    it('should throw not implemented for updateCategory', async () => {
      await expect(service.updateCategory({})).rejects.toThrow('Not implemented');
    });

    // Test Case 9: deleteCategory should throw not implemented error
    it('should throw not implemented for deleteCategory', async () => {
      await expect(service.deleteCategory('id')).rejects.toThrow('Not implemented');
    });

    // Test Case 10: createItem should throw not implemented error
    it('should throw not implemented for createItem', async () => {
      await expect(service.createItem('clId', {})).rejects.toThrow('Not implemented');
    });

    // Test Case 11: getItems should throw not implemented error
    it('should throw not implemented for getItems', async () => {
      await expect(service.getItems('clId')).rejects.toThrow('Not implemented');
    });

    // Test Case 12: updateItem should throw not implemented error
    it('should throw not implemented for updateItem', async () => {
      await expect(service.updateItem('clId', {})).rejects.toThrow('Not implemented');
    });

    // Test Case 13: deleteItem should throw not implemented error
    it('should throw not implemented for deleteItem', async () => {
      await expect(service.deleteItem('clId', 'itemId')).rejects.toThrow('Not implemented');
    });

    // Test Case 14: getChecklistById should throw not implemented error
    it('should throw not implemented for getChecklistById', async () => {
      await expect(service.getChecklistById('id')).rejects.toThrow('Not implemented');
    });

    // Test Case 15: getCategoryById should throw not implemented error
    it('should throw not implemented for getCategoryById', async () => {
      await expect(service.getCategoryById('catId')).rejects.toThrow('Not implemented');
    });

    // Test Case 16: getItemById should throw not implemented error
    it('should throw not implemented for getItemById', async () => {
      await expect(service.getItemById('clId', 'itemId')).rejects.toThrow('Not implemented');
    });
  });
});
