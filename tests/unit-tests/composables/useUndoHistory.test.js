import { describe, expect, it, vi } from 'vitest';

import { useUndoHistory } from '../../../source/composables/useUndoHistory';

describe('undo history', () => {
  // Test Case 1: moves committed actions in order and drops redo only for a new action.
  it('moves committed actions in order and drops redo only for a new action', async () => {
    const apply = vi.fn(async (_entry, _undo, _current, committed) => {
      committed();
      return true;
    });
    const history = useUndoHistory(3, apply);
    history.record('A');
    history.record('B');
    expect(await history.undo()).toBe(true);
    expect(await history.undo()).toBe(true);
    expect(apply.mock.calls.map(([entry, direction]) => [entry, direction])).toEqual([
      ['B', true],
      ['A', true],
    ]);
    expect(await history.redo()).toBe(true);
    expect(history.canRedo.value).toBe(true);
    history.record('C');
    expect(history.canRedo.value).toBe(false);
    expect(await history.undo()).toBe(true);
    expect(apply).toHaveBeenLastCalledWith('C', true, expect.any(Function), expect.any(Function));
  });

  // Test Case 2: keeps the action available when persistence fails.
  it('keeps the action available when persistence fails', async () => {
    const apply = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockImplementationOnce(async (_entry, _undo, _current, committed) => {
        committed();
        return true;
      });
    const history = useUndoHistory(3, apply);
    history.record('A');
    expect(await history.undo()).toBe(false);
    expect(history.canUndo.value).toBe(true);
    expect(history.canRedo.value).toBe(false);
    expect(await history.undo()).toBe(true);
    expect(history.canRedo.value).toBe(true);
  });

  // Test Case 3: prevents double execution and discards stale stacks after a concurrent change.
  it('prevents double execution and discards stale stacks after a concurrent change', async () => {
    let finish;
    const history = useUndoHistory(
      3,
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    history.record('A');
    const first = history.undo();
    expect(await history.undo()).toBe(false);
    history.record('B');
    finish(true);
    expect(await first).toBe(false);
    expect(history.canUndo.value).toBe(true);
    expect(history.canRedo.value).toBe(false);
  });

  // Test Case 4: retains a newer action committed while an earlier undo refreshes.
  it('retains a newer action committed while an earlier undo refreshes', async () => {
    let finish;
    let entered;
    const ready = new Promise((resolve) => {
      entered = resolve;
    });
    const history = useUndoHistory(3, async (_entry, _undo, current, committed) => {
      expect(current()).toBe(true);
      committed();
      entered();
      await new Promise((resolve) => {
        finish = resolve;
      });
      return true;
    });
    history.record('A');
    const pending = history.undo();
    await ready;
    history.record('B');
    finish();
    expect(await pending).toBe(true);
    expect(history.canUndo.value).toBe(true);
    expect(history.canRedo.value).toBe(false);
  });

  // Test Case 5: does not commit queued undo when an editor begins saving before the lock is acquired.
  it('does not commit queued undo when an editor begins saving before the lock is acquired', async () => {
    let allowed = true;
    let release;
    let entered;
    const ready = new Promise((resolve) => {
      entered = resolve;
    });
    const history = useUndoHistory(3, async (_entry, _undo, isCurrent, committed) => {
      entered();
      await new Promise((resolve) => {
        release = resolve;
      });
      if (!isCurrent()) return false;
      committed();
      return true;
    });
    history.record('item created');
    const pending = history.undo(() => allowed);
    await ready;
    allowed = false;
    release();
    expect(await pending).toBe(false);
    expect(history.canUndo.value).toBe(true);
    expect(history.canRedo.value).toBe(false);
  });

  // Test Case 6: retains only the most recent actions within the limit.
  it('retains only the most recent actions within the limit', async () => {
    const apply = vi.fn(async (_entry, _undo, _current, committed) => {
      committed();
      return true;
    });
    const history = useUndoHistory(2, apply);
    history.record('A');
    history.record('B');
    history.record('C');
    expect(await history.undo()).toBe(true);
    expect(await history.undo()).toBe(true);
    expect(await history.undo()).toBe(false);
    expect(apply.mock.calls.map(([entry, direction]) => [entry, direction])).toEqual([
      ['C', true],
      ['B', true],
    ]);
  });
});
