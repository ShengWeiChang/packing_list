/*
================================================================================
File: tests/unit-tests/services/storageTransaction.test.js
Description: Behavioral tests for durable application and template writes.
License: MIT (SPDX: MIT)
================================================================================
*/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LocalStorageService } from '../../../source/services/localStorageService.js';
import { TemplateService } from '../../../source/services/templateService.js';
import { STORAGE_KEYS } from '../../../source/utils/constants.js';

describe('storage transaction safety', () => {
  let storage;
  let locksDescriptor;
  let lockTail;

  beforeEach(() => {
    storage = new Map();
    lockTail = Promise.resolve();
    localStorage.getItem.mockImplementation((key) => storage.get(key) ?? null);
    localStorage.setItem.mockImplementation((key, value) => storage.set(key, String(value)));
    locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks');
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: (_name, callback) => {
          const result = lockTail.then(() => callback({ name: _name }));
          lockTail = result.catch(() => {});
          return result;
        },
      },
    });
  });

  afterEach(() => {
    if (locksDescriptor) {
      Object.defineProperty(navigator, 'locks', locksDescriptor);
    } else {
      delete navigator.locks;
    }
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Failed Writes and Isolation
  // ---------------------------------------------------------------------------

  // Test Case 1: Should keep durable and readable data unchanged after a failed write
  it('keeps durable and readable data unchanged after a failed write', async () => {
    const raw = JSON.stringify({ checklists: [], categories: [], items: [] });
    storage.set(STORAGE_KEYS.APP_DATA, raw);
    const service = new LocalStorageService();
    await service.getData();
    localStorage.setItem.mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await expect(
      service.createChecklist({ name: 'Unsaved' }, { source: 'empty' })
    ).rejects.toThrow();

    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(raw);
    expect((await service.getData()).checklists).toEqual([]);
    service.dispose();
  });

  // Test Case 2: Should preserve both domains when any mutation fails
  it('preserves app and template data when any supported mutation cannot be saved', async () => {
    const checklist = {
      id: 'cl-1',
      name: 'Trip',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      order: 0,
    };
    const category = { id: 'cat-1', name: 'Clothes', checklistId: 'cl-1', order: 0 };
    const item = {
      id: 'item-1',
      name: 'Hat',
      quantity: 1,
      categoryId: 'cat-1',
      checklistId: 'cl-1',
      order: 0,
      isPacked: false,
      isPending: false,
    };
    const template = { id: 'template-1', name: 'Trip', order: 0, categories: [], items: [] };
    const appRaw = JSON.stringify({
      checklists: [checklist],
      categories: [category],
      items: [item],
    });
    const templateRaw = JSON.stringify([template]);
    storage.set(STORAGE_KEYS.APP_DATA, appRaw);
    storage.set(STORAGE_KEYS.TEMPLATES, templateRaw);
    const app = new LocalStorageService();
    const templates = new TemplateService();
    await app.getData();
    templates.getTemplates();
    localStorage.setItem.mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    const writes = [
      () => app.createChecklist({ name: 'New' }, { source: 'empty' }),
      () => app.updateChecklist({ ...checklist, name: 'Changed' }, checklist),
      () => app.updateMultipleChecklists([{ ...checklist, order: 1 }], [checklist]),
      () => app.deleteChecklist(checklist.id),
      () => app.duplicateChecklist(checklist.id),
      () => app.createCategory(checklist.id, { name: 'New' }),
      () => app.updateCategory({ ...category, name: 'Changed' }, category),
      () => app.updateMultipleCategories([{ ...category, order: 1 }], [category]),
      () => app.deleteCategory(category.id),
      () => app.duplicateCategory(category.id),
      () => app.createItem(checklist.id, { name: 'New', categoryId: category.id }),
      () => app.updateItem(checklist.id, { ...item, name: 'Changed' }, item),
      () => app.updateMultipleItems(checklist.id, [{ ...item, order: 1 }], [item]),
      () => app.deleteItem(checklist.id, item.id),
      () => app.duplicateItem(checklist.id, item.id),
      () => templates.createTemplate({ name: 'New' }),
      () => templates.updateTemplate({ ...template, name: 'Changed' }, template),
      () => templates.deleteTemplate(template.id),
      () => templates.reorderTemplates([template.id]),
      () => templates.createFromChecklist(checklist.id, 'Snapshot'),
    ];
    for (const write of writes) {
      await expect(write()).rejects.toMatchObject({ code: 'quota' });
      expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(appRaw);
      expect(storage.get(STORAGE_KEYS.TEMPLATES)).toBe(templateRaw);
      expect((await app.getData()).checklists[0].name).toBe('Trip');
      expect(templates.getTemplates()[0].name).toBe('Trip');
    }
    app.dispose();
  });

  // Test Case 3: Should not expose mutable references to committed data
  it('does not expose mutable references to committed data', async () => {
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({ checklists: [], categories: [], items: [] })
    );
    const service = new LocalStorageService();
    const snapshot = await service.getData();
    snapshot.checklists.push({ id: 'ghost', name: 'Not saved' });

    expect((await service.getData()).checklists).toEqual([]);
    expect(JSON.parse(storage.get(STORAGE_KEYS.APP_DATA)).checklists).toEqual([]);
    service.dispose();
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Corrupt and Unsupported Data
  // ---------------------------------------------------------------------------

  // Test Case 4: Should preserve corrupted application data and reject writes
  it('preserves corrupted application data and rejects writes', async () => {
    const raw = '{invalid application data';
    storage.set(STORAGE_KEYS.APP_DATA, raw);
    const service = new LocalStorageService();

    await expect(service.getData()).rejects.toThrow();
    await expect(
      service.createChecklist({ name: 'Unsafe' }, { source: 'empty' })
    ).rejects.toThrow();
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(raw);
    service.dispose();
  });

  // Test Case 5: Should reject an unsupported application schema without replacing it
  it('rejects an unsupported application schema without replacing it', async () => {
    const raw = JSON.stringify({ schemaVersion: 999, checklists: [], categories: [], items: [] });
    storage.set(STORAGE_KEYS.APP_DATA, raw);
    const service = new LocalStorageService();

    await expect(service.getData()).rejects.toThrow();
    await expect(
      service.createChecklist({ name: 'Unsafe' }, { source: 'empty' })
    ).rejects.toThrow();
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(raw);
    service.dispose();
  });

  // Test Case 6: Should reject records without identity
  it('rejects records without identity instead of generating a new id', async () => {
    const raw = JSON.stringify({
      checklists: [{ name: 'Lost identity' }],
      categories: [],
      items: [],
    });
    storage.set(STORAGE_KEYS.APP_DATA, raw);
    const service = new LocalStorageService();

    await expect(service.getData()).rejects.toMatchObject({ code: 'corrupt' });
    await expect(
      service.createChecklist({ name: 'Unsafe' }, { source: 'empty' })
    ).rejects.toMatchObject({ code: 'corrupt' });
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(raw);
    service.dispose();
  });

  // Test Case 7: Should preserve malformed template snapshots
  it('preserves malformed template snapshots and refuses to overwrite them', async () => {
    const raw = JSON.stringify([{ id: 'template-1', name: 'Broken', categories: {}, items: [] }]);
    storage.set(STORAGE_KEYS.TEMPLATES, raw);
    const service = new TemplateService();

    expect(() => service.getTemplates()).toThrow();
    await expect(service.createTemplate({ name: 'Unsafe' })).rejects.toMatchObject({
      code: 'corrupt',
    });
    expect(storage.get(STORAGE_KEYS.TEMPLATES)).toBe(raw);
  });

  // Test Case 8: Should reject wrong-typed stored fields
  it('rejects wrong-typed persisted fields without normalizing them into new values', async () => {
    const raw = JSON.stringify({
      checklists: [{ id: 'cl-1', name: 'Trip', order: 'not-a-number' }],
      categories: [],
      items: [],
    });
    storage.set(STORAGE_KEYS.APP_DATA, raw);
    const service = new LocalStorageService();
    await expect(service.getData()).rejects.toMatchObject({ code: 'corrupt' });
    await expect(
      service.createChecklist({ name: 'Unsafe' }, { source: 'empty' })
    ).rejects.toMatchObject({ code: 'corrupt' });
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(raw);
    for (const quantity of [true, [1], { value: 1 }]) {
      const malformed = JSON.stringify({
        checklists: [],
        categories: [],
        items: [{ id: 'item-1', name: 'Hat', quantity }],
      });
      storage.set(STORAGE_KEYS.APP_DATA, malformed);
      await expect(service.getData()).rejects.toMatchObject({ code: 'corrupt' });
      await expect(
        service.createChecklist({ name: 'Unsafe' }, { source: 'empty' })
      ).rejects.toMatchObject({ code: 'corrupt' });
      expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(malformed);
    }
    const malformedTemplates = JSON.stringify([
      {
        id: 'template-1',
        name: 'Trip',
        categories: [],
        items: [{ name: 'Hat', order: 'wrong' }],
      },
    ]);
    storage.set(STORAGE_KEYS.TEMPLATES, malformedTemplates);
    const templates = new TemplateService();
    expect(() => templates.getTemplates()).toThrow();
    await expect(templates.createTemplate({ name: 'Unsafe' })).rejects.toMatchObject({
      code: 'corrupt',
    });
    expect(storage.get(STORAGE_KEYS.TEMPLATES)).toBe(malformedTemplates);
    service.dispose();
  });

  // Test Case 9: Should refuse writes when locking is unavailable
  it('refuses writes when safe cross-tab locking is unavailable', async () => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    const service = new LocalStorageService();
    await expect(
      service.createChecklist({ name: 'Unsafe' }, { source: 'empty' })
    ).rejects.toMatchObject({ code: 'lock-unavailable' });
    expect(storage.has(STORAGE_KEYS.APP_DATA)).toBe(false);
    service.dispose();
  });

  // Test Case 10: Should normalize legacy defaults without rewriting storage
  it('normalizes legacy defaults in memory without rewriting the stored bytes', async () => {
    const raw = JSON.stringify({
      checklists: [{ id: 'cl-1', name: 'Trip' }],
      categories: [],
      items: [
        { id: 'item-1', name: 'Hat', quantity: 2, checklistId: 'cl-1', categoryId: 'orphan' },
      ],
    });
    storage.set(STORAGE_KEYS.APP_DATA, raw);
    const service = new LocalStorageService();

    const decoded = await service.getData();
    expect(decoded.checklists[0]).toMatchObject({ order: 0 });
    expect(decoded.items[0]).toMatchObject({ isPending: false, quantity: 2, categoryId: 'orphan' });
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(raw);
    await service.updateChecklist(
      { ...decoded.checklists[0], name: 'Updated' },
      decoded.checklists[0]
    );
    expect(JSON.parse(storage.get(STORAGE_KEYS.APP_DATA)).items[0]).toMatchObject({
      isPending: false,
      quantity: 2,
      categoryId: 'orphan',
      name: 'Hat',
    });
    service.dispose();
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Independent Writers
  // ---------------------------------------------------------------------------

  // Test Case 11: Should keep both templates when an earlier reader creates after another writer
  it('keeps both templates when an earlier reader creates after another writer', async () => {
    const first = new TemplateService();
    const second = new TemplateService();
    expect(first.getTemplates()).toEqual([]);
    await second.createTemplate({ name: 'From second tab' });
    await first.createTemplate({ name: 'From first tab' });

    expect(JSON.parse(storage.get(STORAGE_KEYS.TEMPLATES)).map((item) => item.name)).toEqual([
      'From second tab',
      'From first tab',
    ]);
  });

  // Test Case 12: Should serialize simultaneous checklist creation across service instances
  it('serializes simultaneous checklist creation across service instances', async () => {
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({ checklists: [], categories: [], items: [] })
    );
    const first = new LocalStorageService();
    const second = new LocalStorageService();

    await Promise.all([
      first.createChecklist({ name: 'First' }, { source: 'empty' }),
      second.createChecklist({ name: 'Second' }, { source: 'empty' }),
    ]);

    const names = JSON.parse(storage.get(STORAGE_KEYS.APP_DATA)).checklists.map(
      (item) => item.name
    );
    expect(names.sort()).toEqual(['First', 'Second']);
    first.dispose();
    second.dispose();
  });

  // Test Case 13: Should merge unrelated changes and reject stale same-field edits
  it('merges unrelated field changes and rejects stale edits to the same field', async () => {
    const original = {
      id: 'item-1',
      name: 'Socks',
      quantity: 1,
      categoryId: 'category-1',
      checklistId: 'checklist-1',
      order: 0,
      isPacked: false,
      isPending: false,
    };
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({ checklists: [], categories: [], items: [original] })
    );
    const first = new LocalStorageService();
    const second = new LocalStorageService();

    await first.updateItem('checklist-1', { ...original, isPacked: true }, original);
    const merged = await second.updateItem(
      'checklist-1',
      { ...original, name: 'Warm socks' },
      original
    );
    expect(merged).toMatchObject({ name: 'Warm socks', isPacked: true });
    const beforeConflict = storage.get(STORAGE_KEYS.APP_DATA);
    await expect(
      second.updateItem('checklist-1', { ...original, isPacked: true }, original)
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(beforeConflict);
    first.dispose();
    second.dispose();
  });

  // Test Case 14: Should reject creation after its owner was deleted
  it('does not create a category or item after its owner was deleted', async () => {
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({ checklists: [], categories: [], items: [] })
    );
    const service = new LocalStorageService();
    const before = storage.get(STORAGE_KEYS.APP_DATA);
    await expect(service.createCategory('deleted', { name: 'Clothes' })).rejects.toMatchObject({
      code: 'conflict',
    });
    await expect(
      service.createItem('deleted', { name: 'Shirt', categoryId: 'deleted' })
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(before);
    service.dispose();
  });

  // Test Case 15: Should reject an entire batch on item conflict
  it('rejects an entire batch when one item conflicts', async () => {
    const original = [
      { id: 'item-1', name: 'Hat', checklistId: 'cl-1', categoryId: 'cat-1', quantity: 1 },
      { id: 'item-2', name: 'Gloves', checklistId: 'cl-1', categoryId: 'cat-1', quantity: 1 },
    ];
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({ checklists: [], categories: [], items: original })
    );
    const first = new LocalStorageService();
    const second = new LocalStorageService();
    const baseline = await first.getItems('cl-1');
    await first.updateItem('cl-1', { ...baseline[1], isPacked: true }, baseline[1]);
    const rawBeforeBatch = storage.get(STORAGE_KEYS.APP_DATA);

    await expect(
      second.updateMultipleItems(
        'cl-1',
        baseline.map((item) => ({ ...item, isPacked: true })),
        baseline
      )
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(rawBeforeBatch);
    first.dispose();
    second.dispose();
  });

  // Test Case 16: Should reject a category reorder when a target was deleted
  it('does not partially reorder categories if a category was deleted', async () => {
    const category = { id: 'cat-1', name: 'Clothes', checklistId: 'cl-1', order: 0 };
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({ checklists: [], categories: [category], items: [] })
    );
    const service = new LocalStorageService();
    const original = storage.get(STORAGE_KEYS.APP_DATA);

    await expect(
      service.updateMultipleCategories(
        [
          { ...category, order: 1 },
          { id: 'deleted', name: 'Missing', checklistId: 'cl-1', order: 0 },
        ],
        [category, { id: 'deleted', name: 'Missing', checklistId: 'cl-1', order: 1 }]
      )
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(original);
    service.dispose();
  });

  // Test Case 17: Should reject a stale template draft
  it('rejects a template draft if another tab changed its original snapshot', async () => {
    const first = new TemplateService();
    const second = new TemplateService();
    const baseline = await first.createTemplate({ name: 'Original' });
    await first.updateTemplate({ ...baseline, name: 'From first tab' }, baseline);
    const rawBeforeConflict = storage.get(STORAGE_KEYS.TEMPLATES);

    await expect(
      second.updateTemplate({ ...baseline, name: 'Stale draft' }, baseline)
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(storage.get(STORAGE_KEYS.TEMPLATES)).toBe(rawBeforeConflict);
  });

  // Test Case 18: Should reject a move when the destination is deleted before its lock is granted
  it('rejects a queued item move after another writer deletes its destination', async () => {
    const categoryA = { id: 'cat-a', name: 'A', checklistId: 'cl-1', order: 0 };
    const categoryB = { id: 'cat-b', name: 'B', checklistId: 'cl-1', order: 1 };
    const item = {
      id: 'item-1',
      name: 'Hat',
      quantity: 1,
      checklistId: 'cl-1',
      categoryId: 'cat-a',
      order: 0,
      isPacked: false,
      isPending: false,
    };
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({
        checklists: [{ id: 'cl-1', name: 'Trip' }],
        categories: [categoryA, categoryB],
        items: [item],
      })
    );
    const deleting = new LocalStorageService();
    const moving = new LocalStorageService();
    let release;
    let acquired;
    const started = new Promise((resolve) => {
      acquired = resolve;
    });
    const held = navigator.locks.request(
      'packing-list-storage-write',
      () =>
        new Promise((resolve) => {
          release = resolve;
          acquired();
        })
    );
    await started;
    const deletion = deleting.deleteCategory('cat-b');
    const move = moving.updateMultipleItems('cl-1', [{ ...item, categoryId: 'cat-b' }], [item]);
    release();
    await held;
    await deletion;
    await expect(move).rejects.toMatchObject({ code: 'conflict' });
    expect((await moving.getItems('cl-1'))[0]).toMatchObject({ id: 'item-1', categoryId: 'cat-a' });
    deleting.dispose();
    moving.dispose();
  });

  // Test Case 19: Should reject a template source deleted while creation waits for the lock
  it('rejects queued checklist creation after the selected template is deleted', async () => {
    const templates = new TemplateService();
    const app = new LocalStorageService();
    const template = await templates.createTemplate({ name: 'Source', categories: [], items: [] });
    let release;
    let acquired;
    const started = new Promise((resolve) => {
      acquired = resolve;
    });
    const held = navigator.locks.request(
      'packing-list-storage-write',
      () =>
        new Promise((resolve) => {
          release = resolve;
          acquired();
        })
    );
    await started;
    const deletion = templates.deleteTemplate(template.id);
    const creation = app.createChecklist(
      { id: 'cl-1', name: 'Trip' },
      { source: 'template', templateId: template.id, expectedTemplate: template }
    );
    release();
    await held;
    await deletion;
    await expect(creation).rejects.toMatchObject({ code: 'conflict' });
    expect(storage.has(STORAGE_KEYS.APP_DATA)).toBe(false);
    app.dispose();
  });

  // Test Case 20: Should reject a template source corrupted while creation waits for the lock
  it('preserves corrupted template data and refuses queued checklist creation', async () => {
    const templates = new TemplateService();
    const app = new LocalStorageService();
    const template = await templates.createTemplate({ name: 'Source', categories: [], items: [] });
    let release;
    let acquired;
    const started = new Promise((resolve) => {
      acquired = resolve;
    });
    const held = navigator.locks.request(
      'packing-list-storage-write',
      () =>
        new Promise((resolve) => {
          release = resolve;
          acquired();
        })
    );
    await started;
    const creation = app.createChecklist(
      { id: 'cl-1', name: 'Trip' },
      { source: 'template', templateId: template.id, expectedTemplate: template }
    );
    storage.set(STORAGE_KEYS.TEMPLATES, '{corrupt');
    release();
    await held;
    await expect(creation).rejects.toMatchObject({ code: 'corrupt' });
    expect(storage.get(STORAGE_KEYS.TEMPLATES)).toBe('{corrupt');
    expect(storage.has(STORAGE_KEYS.APP_DATA)).toBe(false);
    app.dispose();
  });
  // Test Case 21: Conflicting item status transitions are rejected in either order.
  it('rejects stale packed and pending transitions without overwriting either winner', async () => {
    const item = {
      id: 'item',
      name: 'Hat',
      quantity: 1,
      checklistId: 'cl',
      categoryId: 'cat',
      order: 0,
      isPacked: false,
      isPending: false,
    };
    for (const [firstChange, secondChange] of [
      [{ isPacked: true }, { isPending: true }],
      [{ isPending: true }, { isPacked: true }],
    ]) {
      storage.set(
        STORAGE_KEYS.APP_DATA,
        JSON.stringify({ checklists: [], categories: [], items: [item] })
      );
      const first = new LocalStorageService();
      const second = new LocalStorageService();
      await first.updateItem('cl', { ...item, ...firstChange }, item);
      const before = storage.get(STORAGE_KEYS.APP_DATA);
      await expect(
        second.updateItem('cl', { ...item, ...secondChange }, item)
      ).rejects.toMatchObject({ code: 'conflict' });
      expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(before);
      first.dispose();
      second.dispose();
    }
  });

  // Test Case 22: A status conflict aborts the entire batch in either order.
  it('does not partially save a batch when the other status field changed', async () => {
    const item = {
      id: 'item',
      name: 'Hat',
      quantity: 1,
      checklistId: 'cl',
      categoryId: 'cat',
      order: 0,
      isPacked: false,
      isPending: false,
    };
    const other = { ...item, id: 'other', name: 'Gloves', order: 1 };
    for (const [firstChange, secondChange] of [
      [{ isPacked: true }, { isPending: true }],
      [{ isPending: true }, { isPacked: true }],
    ]) {
      storage.set(
        STORAGE_KEYS.APP_DATA,
        JSON.stringify({ checklists: [], categories: [], items: [item, other] })
      );
      const first = new LocalStorageService();
      const second = new LocalStorageService();
      await first.updateItem('cl', { ...item, ...firstChange }, item);
      const before = storage.get(STORAGE_KEYS.APP_DATA);
      await expect(
        second.updateMultipleItems(
          'cl',
          [
            { ...other, name: 'Changed' },
            { ...item, ...secondChange },
          ],
          [other, item]
        )
      ).rejects.toMatchObject({ code: 'conflict' });
      expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(before);
      first.dispose();
      second.dispose();
    }
  });

  // Test Case 23: Item status and unrelated edits can still merge in both directions.
  it('merges status and unrelated item edits without losing either change', async () => {
    const item = {
      id: 'item',
      name: 'Hat',
      quantity: 1,
      checklistId: 'cl',
      categoryId: 'cat',
      order: 0,
      isPacked: false,
      isPending: false,
    };
    for (const statusFirst of [true, false]) {
      storage.set(
        STORAGE_KEYS.APP_DATA,
        JSON.stringify({ checklists: [], categories: [], items: [item] })
      );
      const first = new LocalStorageService();
      const second = new LocalStorageService();
      const status = { ...item, isPending: true };
      const content = { ...item, name: 'Warm hat', quantity: 2 };
      await first.updateItem('cl', statusFirst ? status : content, item);
      const merged = await second.updateItem('cl', statusFirst ? content : status, item);
      expect(merged).toMatchObject({
        name: 'Warm hat',
        quantity: 2,
        isPacked: false,
        isPending: true,
      });
      first.dispose();
      second.dispose();
    }
  });

  // Test Case 24: Invalid transitions are rejected without rewriting legacy data.
  it('rejects contradictory status writes but preserves and can repair legacy data', async () => {
    const item = {
      id: 'item',
      name: 'Hat',
      quantity: 1,
      checklistId: 'cl',
      categoryId: 'cat',
      order: 0,
      isPacked: false,
      isPending: false,
    };
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({ checklists: [], categories: [], items: [item] })
    );
    const service = new LocalStorageService();
    const before = storage.get(STORAGE_KEYS.APP_DATA);
    await expect(
      service.updateItem('cl', { ...item, isPacked: true, isPending: true }, item)
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe(before);
    const legacy = { ...item, isPacked: true, isPending: true };
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({ checklists: [], categories: [], items: [legacy] })
    );
    const renamed = await service.updateItem('cl', { ...legacy, name: 'Old hat' }, legacy);
    expect(renamed).toMatchObject({ name: 'Old hat', isPacked: true, isPending: true });
    const repaired = await service.updateItem('cl', { ...renamed, isPacked: false }, renamed);
    expect(repaired).toMatchObject({ isPacked: false, isPending: true });
    service.dispose();
  });
});
