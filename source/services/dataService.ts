/*
================================================================================
File: source/services/dataService.ts
Description: Abstract data service interface defining CRUD operations for
             checklists, categories and items.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

import type {
  CategoryDTO,
  CategoryInput,
  CategoryMutation,
  ChecklistDTO,
  ChecklistInput,
  ChecklistMutation,
  ItemDTO,
  ItemInput,
  ItemMutation,
} from '../models/contracts';
import type {
  ChecklistSourceOptions,
  StoredAppData,
  StoredChecklist,
  StoredItem,
  StoredRecord,
} from './storageTypes';

/**
 * Abstract data service interface defining all required methods
 * for managing packing list data following CRUD patterns
 */
export class DataService {
  // ---------------------------------------------------------------------------
  // Bulk data access
  // ---------------------------------------------------------------------------

  /**
   * Get all data (checklists, categories, items) for efficient bulk loading
   * @returns {Promise<object>} Object containing { checklists: Array, categories: Array, items: Array }
   */
  async getData(): Promise<StoredAppData> {
    throw new Error('Not implemented');
  }

  // ---------------------------------------------------------------------------
  // Checklist CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new checklist
   * @param {object} _checklist - Checklist data to create
   * @param {object} [_options] - Optional source and seeded category/item data
   * @returns {Promise<object>} Created checklist
   */
  async createChecklist(
    _checklist: ChecklistInput,
    _options?: ChecklistSourceOptions
  ): Promise<ChecklistDTO> {
    throw new Error('Not implemented');
  }

  /**
   * Get all checklists
   * @returns {Promise<Array>} Array of checklists
   */
  async getChecklists(): Promise<ChecklistDTO[]> {
    throw new Error('Not implemented');
  }

  /**
   * Get a specific checklist by ID
   * @param {string} _id - Checklist ID
   * @returns {Promise<object | null>} Checklist object or null if not found
   */
  async getChecklistById(_id: string): Promise<ChecklistDTO | null> {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing checklist
   * @param {object} _checklist - Updated checklist data (must include id)
   * @returns {Promise<object>} Updated checklist
   */
  async updateChecklist(
    _checklist: ChecklistMutation,
    _expected?: ChecklistMutation
  ): Promise<ChecklistDTO> {
    throw new Error('Not implemented');
  }

  /**
   * Delete a checklist
   * @param {string} _id - Checklist ID to delete
   * @returns {Promise<void>}
   */
  async deleteChecklist(_id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  // ---------------------------------------------------------------------------
  // Category CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new category within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {object} _category - Category to create
   * @returns {Promise<object>} Created category
   */
  async createCategory(_checklistId: string, _category: CategoryInput): Promise<CategoryDTO> {
    throw new Error('Not implemented');
  }

  /**
   * Get all categories (optionally filtered by checklist)
   * @param {string} [_checklistId] - Optional checklist ID to filter by
   * @returns {Promise<Array>} Array of Category objects
   */
  async getCategories(_checklistId?: string): Promise<CategoryDTO[]> {
    throw new Error('Not implemented');
  }

  /**
   * Get a specific category by ID
   * @param {string} _categoryId - Category ID
   * @returns {Promise<object | null>} Category object or null if not found
   */
  async getCategoryById(_categoryId: string): Promise<CategoryDTO | null> {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing category
   * @param {object} _category - Updated category data (must include id)
   * @returns {Promise<object>} Updated category
   */
  async updateCategory(
    _category: CategoryMutation,
    _expected?: CategoryMutation
  ): Promise<CategoryDTO> {
    throw new Error('Not implemented');
  }

  /**
   * Update categories together in one transaction.
   * @param {Array<object>} _categories - Updated categories.
   * @param {Array<object>} _expected - Categories before editing.
   * @returns {Promise<Array<object>>} Updated categories.
   */
  async updateMultipleCategories(
    _categories: CategoryMutation[],
    _expected: CategoryMutation[]
  ): Promise<StoredRecord[]> {
    throw new Error('Not implemented');
  }

  /**
   * Delete a category
   * @param {string} _categoryId - Category ID to delete
   * @returns {Promise<void>}
   */
  async deleteCategory(_categoryId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  // ---------------------------------------------------------------------------
  // Item CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new item within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {object} _item - Item to create
   * @returns {Promise<object>} Created Item object
   */
  async createItem(_checklistId: string, _item: ItemInput): Promise<ItemDTO> {
    throw new Error('Not implemented');
  }

  /**
   * Get all items for a specific checklist
   * @param {string} _checklistId - Checklist ID
   * @returns {Promise<Array>} Array of Item objects
   */
  async getItems(_checklistId: string): Promise<ItemDTO[]> {
    throw new Error('Not implemented');
  }

  /**
   * Get a specific item by ID within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {string} _itemId - Item ID
   * @returns {Promise<object | null>} Item object or null if not found
   */
  async getItemById(_checklistId: string, _itemId: string): Promise<ItemDTO | null> {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing item within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {object} _item - Item to update (must include id)
   * @returns {Promise<object>} Updated Item object
   */
  async updateItem(
    _checklistId: string,
    _item: ItemMutation,
    _expected?: ItemMutation
  ): Promise<ItemDTO> {
    throw new Error('Not implemented');
  }

  /**
   * Update multiple existing items within a checklist
   * @param {string} _checklistId - Checklist ID
   * @param {Array<object>} _items - Items to update (each must include id)
   * @returns {Promise<Array<object>>} Updated Item objects
   */
  async updateMultipleItems(
    _checklistId: string,
    _items: ItemMutation[],
    _expected?: ItemMutation[]
  ): Promise<StoredItem[]> {
    throw new Error('Not implemented');
  }

  /**
   * Delete an item
   * @param {string} _checklistId - Checklist ID
   * @param {string} _itemId - Item ID to delete
   * @returns {Promise<void>}
   */
  async deleteItem(_checklistId: string, _itemId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Update checklist ordering atomically against observed baselines. */
  async updateMultipleChecklists(
    _checklists: ChecklistMutation[],
    _expected?: ChecklistMutation[]
  ): Promise<StoredChecklist[]> {
    throw new Error('Not implemented');
  }

  /** Duplicate a checklist and its content. */
  async duplicateChecklist(_id: string): Promise<ChecklistDTO> {
    throw new Error('Not implemented');
  }

  /** Duplicate a category and its items. */
  async duplicateCategory(_categoryId: string): Promise<CategoryDTO> {
    throw new Error('Not implemented');
  }

  /** Duplicate one item within its checklist. */
  async duplicateItem(_checklistId: string, _itemId: string): Promise<ItemDTO> {
    throw new Error('Not implemented');
  }

  /** Release service resources. */
  dispose(): void {}
}
