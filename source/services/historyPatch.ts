import { StorageError } from './storageTransaction';
import type { StoredAppData, StoredRecord } from './storageTypes';

type Collection = 'checklists' | 'categories' | 'items';
type Change = {
  collection: Collection;
  id: string;
  before?: StoredRecord;
  after?: StoredRecord;
  fields: string[];
};
type Group = { collection: Collection; owner: string; before: string; after: string };
export interface HistoryPatch {
  changes: Change[];
  groups: Group[];
  checklistId: string;
}
const collections: Collection[] = ['checklists', 'categories', 'items'];
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const owner = (collection: Collection, row: StoredRecord) =>
  collection === 'checklists'
    ? ''
    : collection === 'categories'
      ? String(row.checklistId)
      : `${row.checklistId}\u0000${row.categoryId}`;
/**
 *
 */
function groupState(data: StoredAppData, collection: Collection, key: string) {
  return JSON.stringify(
    data[collection]
      .filter((row) => owner(collection, row) === key)
      .map((row) => [row.id, row.order])
  );
}

/** Capture only changed records and the ordering groups affected by structural changes. */
export function createHistoryPatch(
  before: StoredAppData,
  after: StoredAppData
): HistoryPatch | null {
  const changes: Change[] = [];
  const keys = new Map<string, { collection: Collection; owner: string }>();
  for (const collection of collections) {
    const oldRows = new Map(before[collection].map((row) => [row.id, row]));
    const newRows = new Map(after[collection].map((row) => [row.id, row]));
    for (const id of new Set([...oldRows.keys(), ...newRows.keys()])) {
      const oldRow = oldRows.get(id);
      const newRow = newRows.get(id);
      if (equal(oldRow, newRow)) continue;
      const fields =
        oldRow && newRow
          ? [...new Set([...Object.keys(oldRow), ...Object.keys(newRow)])].filter(
              (field) =>
                !equal(oldRow[field], newRow[field]) ||
                Object.hasOwn(oldRow, field) !== Object.hasOwn(newRow, field)
            )
          : [];
      if (
        collection === 'items' &&
        fields.some((field) => field === 'isPacked' || field === 'isPending')
      ) {
        for (const field of ['isPacked', 'isPending'])
          if (!fields.includes(field)) fields.push(field);
      }
      changes.push({ collection, id, before: oldRow, after: newRow, fields });
      if (
        !oldRow ||
        !newRow ||
        fields.some((field) => ['order', 'categoryId', 'checklistId'].includes(field))
      ) {
        for (const row of [oldRow, newRow])
          if (row) {
            const groupOwner = owner(collection, row);
            keys.set(`${collection}:${groupOwner}`, { collection, owner: groupOwner });
          }
      }
    }
  }
  if (!changes.length) return null;
  const first = changes[0]!;
  const row = first.after ?? first.before!;
  return {
    changes,
    groups: [...keys.values()].map((key) => ({
      ...key,
      before: groupState(before, key.collection, key.owner),
      after: groupState(after, key.collection, key.owner),
    })),
    checklistId: first.collection === 'checklists' ? first.id : String(row.checklistId),
  };
}

/** Validate all affected fields, membership and parentage before applying any change. */
export function applyHistoryPatch(
  data: StoredAppData,
  patch: HistoryPatch,
  undo: boolean
): StoredAppData {
  const from = undo ? 'after' : 'before';
  const to = undo ? 'before' : 'after';
  const conflict = () => {
    throw new StorageError('conflict', 'History no longer matches stored data');
  };
  for (const group of patch.groups)
    if (groupState(data, group.collection, group.owner) !== group[from]) conflict();
  for (const change of patch.changes) {
    const current = data[change.collection].find((row) => row.id === change.id);
    const expected = change[from];
    if (!expected) {
      if (current) conflict();
      continue;
    }
    if (!current) conflict();
    if (!change[to]) {
      if (!equal(current, expected)) conflict();
    } else
      for (const field of change.fields) {
        if (
          Object.hasOwn(current!, field) !== Object.hasOwn(expected, field) ||
          !equal(current![field], expected[field])
        )
          conflict();
      }
  }
  const result = JSON.parse(JSON.stringify(data)) as StoredAppData;
  for (const change of patch.changes) {
    const rows = result[change.collection] as StoredRecord[];
    const index = rows.findIndex((row) => row.id === change.id);
    const target = change[to];
    if (!target) rows.splice(index, 1);
    else if (index === -1) rows.push(JSON.parse(JSON.stringify(target)) as StoredRecord);
    else
      for (const field of change.fields) {
        if (Object.hasOwn(target, field)) rows[index]![field] = target[field];
        else delete rows[index]![field];
      }
  }
  // Restore the original relative array order for ties, without moving other groups.
  for (const group of patch.groups) {
    const rows = result[group.collection] as StoredRecord[];
    const wanted = (JSON.parse(group[to]) as [string, number | null][]).map(([id]) => id);
    const indexes = rows
      .map((row, index) => (owner(group.collection, row) === group.owner ? index : -1))
      .filter((index) => index >= 0);
    const ordered = indexes
      .map((index) => rows[index]!)
      .sort((a, b) => wanted.indexOf(a.id) - wanted.indexOf(b.id));
    indexes.forEach((index, position) => {
      rows[index] = ordered[position]!;
    });
  }
  for (const change of patch.changes) {
    const target = change[to];
    if (!target || change.collection === 'checklists') continue;
    if (!result.checklists.some((row) => row.id === target.checklistId)) conflict();
    if (
      change.collection === 'items' &&
      !result.categories.some(
        (row) => row.id === target.categoryId && row.checklistId === target.checklistId
      )
    )
      conflict();
  }
  // A removed parent must not have acquired descendants since the recorded operation.
  for (const change of patch.changes)
    if (!change[to]) {
      if (
        change.collection === 'checklists' &&
        (result.categories.some((row) => row.checklistId === change.id) ||
          result.items.some((row) => row.checklistId === change.id))
      )
        conflict();
      if (
        change.collection === 'categories' &&
        result.items.some((row) => row.categoryId === change.id)
      )
        conflict();
    }
  return result;
}
