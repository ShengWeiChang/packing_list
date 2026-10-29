/*
================================================================================
File: source/models/contracts.ts
Description: Model DTOs, constructor inputs, mutation and snapshot contracts.
License: MIT (SPDX: MIT)
================================================================================
*/

/** Public model data, constructor inputs, and portable template snapshots. */
export type ChecklistDTO = {
  id: string;
  name: string;
  // Dates have never been validated by the model or storage decoder.
  startDate: unknown;
  endDate: unknown;
  order: number;
};

export type CategoryDTO = {
  id: string;
  name: string;
  checklistId: string | null;
  order: number;
};

export type ItemDTO = {
  id: string;
  name: string;
  quantity: number;
  categoryId: string | null;
  isPacked: boolean;
  isPending: boolean;
  checklistId: string | null;
  order: number;
};

export type ChecklistInput = Partial<ChecklistDTO>;
export type CategoryInput = Partial<Omit<CategoryDTO, 'order'>> & { order?: number | string };
export type ItemInput = Partial<Omit<ItemDTO, 'quantity' | 'order' | 'isPacked' | 'isPending'>> & {
  quantity?: number | string;
  order?: number | string;
  isPacked?: unknown;
  isPending?: unknown;
};

/** Snapshots contain no checklist ownership or packing status. */
export type CategorySnapshot = {
  id: string;
  name?: string;
  order?: number;
};

export type ItemSnapshot = {
  name: string;
  quantity?: number | string;
  categoryId?: string | null;
  order?: number;
};

export interface TemplateContent {
  categories?: CategorySnapshot[];
  items?: ItemSnapshot[];
}

export type TemplateDTO = {
  id: string;
  name: string;
  order: number;
  categories: CategorySnapshot[];
  items: ItemSnapshot[];
};

export type TemplateInput = Partial<TemplateDTO>;
export type Mutation<T extends { id: string }> = Pick<T, 'id'> & Partial<Omit<T, 'id'>>;
export type ChecklistMutation = Mutation<ChecklistDTO>;
export type CategoryMutation = Mutation<CategoryDTO>;
export type ItemMutation = Mutation<ItemDTO>;

export interface RecommendedList extends TemplateDTO {
  description: string;
  items: (ItemSnapshot & { id: string; quantity: number; categoryId: string; order: number })[];
  categories: Required<CategorySnapshot>[];
}
