/*
================================================================================
File: source/components/componentContracts.ts
Description: Shared component action, event and readonly view contracts.
License: MIT (SPDX: MIT)
================================================================================
*/

import type { DeepReadonly } from 'vue';

import type { CategoryDTO, ChecklistDTO, ItemDTO, TemplateDTO } from '../models/contracts';

export type TemplateView = DeepReadonly<TemplateDTO>;
export type EditKind = 'checklist' | 'category' | 'item';
export type RetainedDraft = { name: string; startDate?: unknown; endDate?: unknown };
export type RetainDraft = (draft: RetainedDraft) => void;
export type EditCancelled = (kind: EditKind, id: string) => void;
export type SaveEdit<T> = (updated: T, expected: T) => Promise<T | null>;
export type SaveChecklistEdit = SaveEdit<ChecklistDTO>;
export type SaveCategoryEdit = SaveEdit<CategoryDTO>;
export type SaveItemEdit = SaveEdit<ItemDTO>;
export type UpdateItemAction = (item: ItemDTO, expected?: ItemDTO) => Promise<ItemDTO | null>;
export type CategoryPackedChange = { categoryId: string; isPacked: boolean };
export type SetCategoryPackedAction = (change: CategoryPackedChange) => Promise<void>;
export type ItemMove = {
  type: 'move' | 'reorder';
  items: ItemDTO[];
  expectedItems: ItemDTO[];
  categoryId?: string;
};
export type ChecklistSelection =
  | { source: 'empty' }
  | { source: 'template'; templateId: string }
  | { source: 'recommended'; recommendedListId: string };

/** The Sortable callbacks used here only inspect the dragged DOM element. */
export type DragStart = { item: HTMLElement };
/** vuedraggable's declaration exposes any; handlers use this concrete payload. */
export type ItemDragChange = {
  added?: { element: ItemDTO; newIndex: number };
  moved?: { element: ItemDTO; oldIndex: number; newIndex: number };
  removed?: { element: ItemDTO; oldIndex: number };
};
