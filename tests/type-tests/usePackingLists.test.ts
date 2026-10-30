/*
================================================================================
File: tests/type-tests/usePackingLists.test.ts
Description: Compile-only reactive state, operation and packing history contracts.
License: MIT (SPDX: MIT)
================================================================================
*/

import type { PackingHistoryEntry } from '../../source/composables/usePackingLists';
import type { usePackingLists } from '../../source/composables/usePackingLists';
import type { ItemDTO } from '../../source/models/contracts';

type PackingAPI = ReturnType<typeof usePackingLists>;
type IsAny<T> = 0 extends 1 & T ? true : false;

/** Use the real inferred composable API without running browser operations. */
export async function checkPackingStateContracts(api: PackingAPI) {
  api.selectedChecklistId.value = 'trip';
  api.selectedChecklistId.value = null;
  // @ts-expect-error -- Selection is a nullable ID, never a numeric index.
  api.selectedChecklistId.value = 1;
  // @ts-expect-error -- Exposed collections cannot be replaced by consumers.
  api.items.value = [];
  // @ts-expect-error -- Collection contents are also readonly.
  api.items.value.push({ id: 'hat' });
  const item = api.items.value[0];
  if (item) {
    const quantity: number = item.quantity;
    // @ts-expect-error -- Readonly protection includes individual entity fields.
    item.quantity = 2;
    // @ts-expect-error -- State may contain a plain DTO with no toJSON method.
    item.toJSON();
    void quantity;
  }
  // @ts-expect-error -- A selected entity may be absent.
  void api.selectedChecklist.value.id;
  if (api.selectedChecklist.value) {
    // @ts-expect-error -- Derived entity state is exposed for reading, not direct edits.
    api.selectedChecklist.value.name = 'Direct edit';
    // @ts-expect-error -- Readonly views cannot turn an unknown date into a usable object.
    api.selectedChecklist.value.startDate.toString();
  }
  const firstChecklist = api.checklists.value[0];
  if (firstChecklist) {
    // @ts-expect-error -- Vue's readonly wrapper must not erase unknown/null safety.
    firstChecklist.startDate.toString();
  }
  // @ts-expect-error -- Consumers cannot replace computed values.
  api.progress.value = 100;
  // @ts-expect-error -- Consumers cannot clear errors directly.
  api.operationError.value = null;
  // @ts-expect-error -- Callbacks must use the captured numeric error revision.
  api.clearOperationError('latest');
  api.clearOperationError(api.operationErrorVersion.value);

  const created = await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
  // @ts-expect-error -- A failed creation returns null.
  void created.id;
  if (created) {
    const id: string = created.id;
    // @ts-expect-error -- Dates remain unvalidated even through reactive state.
    const date: string = created.startDate;
    void [id, date];
  }
  const updated = await api.updateItem({ id: 'hat', quantity: 2 });
  const isAnyResult: IsAny<typeof updated> = false;
  if (updated) {
    const packed: boolean = updated.isPacked;
    void packed;
  }
  // @ts-expect-error -- Item mutations use normalized quantities.
  await api.updateItem({ id: 'hat', quantity: '2' });
  // @ts-expect-error -- Observed status baselines must retain boolean field types.
  await api.updateItem({ id: 'hat' }, { id: 'hat', isPacked: 'false' });
  const committed = await api.updateMultipleItems([{ id: 'hat', order: 1 }], {
    fields: ['order', 'categoryId'],
    expectedItems: [{ id: 'hat', order: 0 }],
    recordHistory: false,
  });
  if (committed?.[0]) {
    const normalized: ItemDTO = committed[0];
    const status: boolean = committed[0].isPending;
    void [normalized, status];
  }
  // @ts-expect-error -- An unknown field cannot become a drag intent.
  await api.updateMultipleItems([{ id: 'hat' }], { fields: ['madeUp'] });
  // @ts-expect-error -- History recording is an explicit boolean option.
  await api.updateMultipleItems([{ id: 'hat' }], { recordHistory: 'yes' });
  // @ts-expect-error -- Category packing takes a boolean target state.
  await api.setCategoryPacked('clothes', 'true');
  const removed: boolean = await api.deleteItem('hat');
  const undone: boolean = await api.undoPackingChange();
  // @ts-expect-error -- Async operation callbacks cannot be treated as synchronous success.
  const pendingRemoval: boolean = api.deleteItem('hat');
  const save: (item: ItemDTO) => Promise<ItemDTO | null> = api.updateItem;
  // @ts-expect-error -- A save callback may fail and return null.
  const guaranteedSave: (item: ItemDTO) => Promise<ItemDTO> = api.updateItem;
  return { isAnyResult, removed, undone, pendingRemoval, save, guaranteedSave };
}

/** History carries immutable packing snapshots rather than complete entity copies. */
export function checkPackingHistoryContracts(entry: PackingHistoryEntry) {
  const change = entry.changes[0];
  if (change) {
    const before: boolean = change.before.isPacked;
    // @ts-expect-error -- A recorded snapshot is immutable.
    change.after.isPending = true;
    // @ts-expect-error -- Later name edits are not part of packing history.
    void change.before.name;
    void before;
  }
  // @ts-expect-error -- The history entry cannot acquire new item changes in place.
  entry.changes.push({ itemId: 'hat' });
  const invalid: PackingHistoryEntry = {
    checklistId: 'trip',
    changes: [
      {
        itemId: 'hat',
        before: { isPacked: false, isPending: true },
        // @ts-expect-error -- Packing snapshots carry boolean state.
        after: { isPacked: 'false', isPending: false },
      },
    ],
  };
  return invalid;
}
