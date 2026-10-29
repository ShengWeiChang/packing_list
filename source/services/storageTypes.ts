/*
================================================================================
File: source/services/storageTypes.ts
Description: Decoded legacy data and storage service boundary contracts.
License: MIT (SPDX: MIT)
================================================================================
*/

import type { CategoryDTO, ItemDTO, ItemSnapshot, TemplateDTO } from '../models/contracts';

/** Only the guarantees established by the unversioned storage decoder. */
export interface StoredRecord {
  [field: string]: unknown;
  id: string;
  name?: string;
  order?: number;
  checklistId?: string | null;
  categoryId?: string | null;
}

export interface StoredChecklist extends StoredRecord {
  order: number;
  startDate?: unknown;
  endDate?: unknown;
}

export interface StoredItem extends StoredRecord {
  name: string;
  quantity?: number | string;
  isPacked?: unknown;
  isPending: unknown;
}

export interface StoredAppData {
  [field: string]: unknown;
  checklists: StoredChecklist[];
  categories: StoredRecord[];
  items: StoredItem[];
}

export interface StoredTemplate extends StoredRecord {
  categories?: StoredRecord[];
  items?: (ItemSnapshot & Record<string, unknown>)[];
}

export interface SeedData {
  categories: (CategoryDTO & { toJSON?: () => CategoryDTO })[];
  items: (ItemDTO & { toJSON?: () => ItemDTO })[];
}

/** Optional at runtime; a missing template baseline still fails in the lock. */
export type ChecklistSourceOptions = {
  source?: 'recommended' | 'empty' | 'template';
  seedData?: SeedData | null;
  templateId?: string;
  expectedTemplate?: TemplateDTO;
};

export type StorageErrorCode =
  | 'unavailable'
  | 'corrupt'
  | 'unsupported'
  | 'quota'
  | 'lock-unavailable'
  | 'conflict';
