/*
================================================================================
File: tests/type-tests/contracts.test.ts
Description: Compile-only checks for real domain and storage boundaries.
License: MIT (SPDX: MIT)
================================================================================
*/

import { getGeneralRecommendedList } from '../../source/data/recommendedLists';
import { Checklist } from '../../source/models/Checklist';
import type { ItemDTO, ItemSnapshot, TemplateDTO } from '../../source/models/contracts';
import { Item } from '../../source/models/Item';
import type { DataService } from '../../source/services/dataService';
import {
  decodeAppData,
  decodeTemplates,
  withStorageLock,
} from '../../source/services/storageTransaction';
import type { TemplateService } from '../../source/services/templateService';
import { debounce, deepClone } from '../../source/utils/helpers';
import { instantiateTemplateContent } from '../../source/utils/instantiateTemplate';
import { insertAtVisibleIndex, renumberOrder, reorderVisibleSlots } from '../../source/utils/order';

type IsAny<T> = 0 extends 1 & T ? true : false;

/** Check real domain and service boundaries without executing storage operations. */
export async function checkDomainStorageContracts(
  service: DataService,
  templates: TemplateService,
  untrusted: unknown
) {
  const item = new Item({ name: 'Hat', quantity: '2', isPacked: 'false' }).toJSON();
  const quantity: number = item.quantity;
  const packed: boolean = item.isPacked;
  // @ts-expect-error -- New item quantities cannot be arbitrary objects.
  new Item({ name: 'Hat', quantity: { value: 2 } });
  // @ts-expect-error -- JSON needs decoding before it can enter a model.
  Item.fromJSON(untrusted);

  const raw = decodeAppData(null);
  const rawItem = raw.items[0];
  if (rawItem) {
    // @ts-expect-error -- Legacy quantities can still be strings or absent.
    rawItem.quantity.toFixed(0);
    // @ts-expect-error -- Legacy packing flags retain arbitrary truthiness values.
    const flag: boolean = rawItem.isPacked;
    const normalized = Item.fromJSON(rawItem).toJSON();
    const isAny: IsAny<typeof normalized.quantity> = false;
    void [flag, normalized, isAny];
  }
  const checklist = raw.checklists[0];
  if (checklist) {
    // @ts-expect-error -- Decoder does not validate dates.
    const date: string = checklist.startDate;
    // @ts-expect-error -- Model does not validate dates either.
    const normalizedDate: string = Checklist.fromJSON(checklist).toJSON().startDate;
    void [date, normalizedDate];
  }
  const isAnyRaw: IsAny<(typeof raw.items)[number]['isPacked']> = false;
  // @ts-expect-error -- Raw collections are not normalized DTO collections.
  const normalizedItems: ItemDTO[] = raw.items;

  const snapshot: ItemSnapshot = { name: 'Hat', quantity: '2', categoryId: null };
  // @ts-expect-error -- A snapshot literal cannot carry packing state.
  const invalidSnapshot: ItemSnapshot = { name: 'Hat', isPacked: true };
  const decodedTemplates = decodeTemplates(null);
  const storedTemplate = decodedTemplates[0];
  if (storedTemplate) instantiateTemplateContent(storedTemplate, 'new-checklist');
  const recommended = getGeneralRecommendedList('zh-TW');
  const seedData = instantiateTemplateContent(recommended, 'new-checklist');
  const created = await service.createChecklist({ name: 'Trip' }, { seedData });
  await service.createChecklist({}, { source: 'empty' });
  await service.createChecklist({}, { source: 'template' }); // Missing baseline fails at runtime.
  // @ts-expect-error -- Only supported source options are accepted.
  await service.createChecklist({}, { source: 'unknown' });
  // @ts-expect-error -- Raw JSON cannot masquerade as pre-generated seed data.
  await service.createChecklist({}, { seedData: untrusted });
  await service.updateItem(created.id, { id: item.id, isPacked: true }, item);
  await service.updateItem(created.id, { id: item.id }); // Optional baseline contract is preserved.
  // @ts-expect-error -- Status mutations must use normalized boolean flags.
  await service.updateItem(created.id, { id: item.id, isPacked: 'false' }, item);
  // @ts-expect-error -- Unknown baseline fields are rejected on a literal.
  await service.updateItem(created.id, { id: item.id }, { id: item.id, madeUp: true });
  const selected = await service.getItemById(created.id, item.id);
  // @ts-expect-error -- A lookup may return null.
  selected.quantity.toFixed(0);
  const savedTemplate: TemplateDTO = await templates.createTemplate({ items: [snapshot] });
  await service.createChecklist(
    {},
    { source: 'template', templateId: savedTemplate.id, expectedTemplate: savedTemplate }
  );
  const lockResult: number = await withStorageLock(async () => 2);
  const reordered = renumberOrder([{ id: 'hat', quantity }]);
  const reorderedQuantity: number | undefined = reordered[0]?.quantity;

  const overwritten = renumberOrder([{ id: 'hat', order: 'old', quantity }]);
  const numericOrder: number = overwritten[0]!.order;
  // @ts-expect-error -- Renumbering replaces a string order; an intersection would infer never.
  const stringOrder: string = overwritten[0]!.order;
  const literalItems = [{ id: 'hat', order: 7 as const, quantity }];
  const renumberedLiteral = renumberOrder(literalItems);
  // @ts-expect-error -- The original literal order is overwritten by an arbitrary number.
  const originalLiteral: 7 = renumberedLiteral[0]!.order;
  const visible = reorderVisibleSlots(literalItems, literalItems, () => true);
  const inserted = insertAtVisibleIndex(literalItems, literalItems[0]!, 0, () => true);
  const visibleOrder: number = visible[0]!.order;
  const insertedQuantity: number = inserted[0]!.quantity;
  // @ts-expect-error -- Visible-slot reordering must also replace literal orders.
  const visibleLiteral: 7 = visible[0]!.order;
  // @ts-expect-error -- Insertion must also replace literal orders.
  const insertedLiteral: 7 = inserted[0]!.order;
  const model = new Item({ name: 'Hat' });
  const orderedData = renumberOrder([model.toJSON()]);
  const orderedDataQuantity: number = orderedData[0]!.quantity;
  // @ts-expect-error -- DTO spread results have no model prototype methods.
  orderedData[0]!.togglePacked();
  // @ts-expect-error -- Pass a model's data representation, not its methods, into sorting.
  renumberOrder([model]);
  // @ts-expect-error -- Visible-slot helpers also consume data records.
  reorderVisibleSlots([model], [model], () => true);
  // @ts-expect-error -- Insertion helpers also consume data records.
  insertAtVisibleIndex([model], model, 0, () => true);

  const cloned = deepClone({ nested: { quantity } });
  const cloneQuantity: number = cloned.nested.quantity;
  // @ts-expect-error -- JSON cloning does not preserve Date instances.
  deepClone(new Date());
  // @ts-expect-error -- JSON cloning does not preserve functions.
  deepClone({ callback: () => 1 });
  const delayed = debounce((id: string, count: number) => ({ id, count }));
  delayed('hat', 2);
  delayed.cancel();
  // @ts-expect-error -- Debounced callback argument types must be preserved.
  delayed('hat', 'two');
  // @ts-expect-error -- Debounce schedules work; it does not return the callback result.
  const result: number = delayed('hat', 2);
  return {
    packed,
    isAnyRaw,
    normalizedItems,
    invalidSnapshot,
    lockResult,
    reorderedQuantity,
    numericOrder,
    stringOrder,
    originalLiteral,
    visibleOrder,
    insertedQuantity,
    visibleLiteral,
    insertedLiteral,
    orderedDataQuantity,
    cloneQuantity,
    result,
  };
}
