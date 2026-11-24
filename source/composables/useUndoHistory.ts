import { computed, shallowRef } from 'vue';

/** In-memory history; apply must resolve true only after the change is committed. */
export function useUndoHistory<T>(
  limit: number,
  apply: (
    entry: T,
    undo: boolean,
    isCurrent: () => boolean,
    onCommitted: () => void
  ) => Promise<boolean>
) {
  const undoStack = shallowRef<T[]>([]);
  const redoStack = shallowRef<T[]>([]);
  let revision = 0;
  let applying = false;

  /** Discard all history after an invalidating change. */
  function clear() {
    revision += 1;
    undoStack.value = [];
    redoStack.value = [];
  }

  /** Record a committed action and invalidate redo.
   * @param {T} entry - The committed action.
   */
  function record(entry: T) {
    revision += 1;
    undoStack.value = [...undoStack.value, entry].slice(-limit);
    redoStack.value = [];
  }

  /** Apply one action, moving it only after a successful commit.
   * @param {boolean} undo - Whether to undo instead of redo.
   * @returns {Promise<boolean>} Whether the action committed.
   */
  async function execute(undo: boolean): Promise<boolean> {
    if (applying) return false;
    const source = undo ? undoStack : redoStack;
    const destination = undo ? redoStack : undoStack;
    const entry = source.value.at(-1);
    if (!entry) return false;
    applying = true;
    const startedAt = revision;
    let committed = false;
    const isCurrent = () => revision === startedAt && source.value.at(-1) === entry;
    const onCommitted = () => {
      if (!isCurrent()) return;
      revision += 1;
      source.value = source.value.slice(0, -1);
      destination.value = [...destination.value, entry].slice(-limit);
      committed = true;
    };
    try {
      await apply(entry, undo, isCurrent, onCommitted);
      return committed;
    } finally {
      applying = false;
    }
  }

  return {
    canUndo: computed(() => undoStack.value.length > 0),
    canRedo: computed(() => redoStack.value.length > 0),
    clear,
    record,
    undo: () => execute(true),
    redo: () => execute(false),
  };
}
