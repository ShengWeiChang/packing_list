/*
================================================================================
File: tests/component-tests/typedDraggable.test.js
Description: Real vuedraggable model boundaries for canceled and completed drops.
License: MIT (SPDX: MIT)
================================================================================
*/

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import { draggableFor, useDraggableControls } from '../../source/components/typedDraggable';

const wrappers = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
});

/**
 * Mount the facade with a real vuedraggable model and observe its persistence boundary.
 * @param {string[]} ids - Initial model identifiers.
 * @returns {object} The model, callbacks, and actual draggable control.
 */
function mountList(ids) {
  const model = ref(ids.map((id) => ({ id })));
  const change = vi.fn();
  const update = vi.fn();
  const end = vi.fn();
  let control;
  const wrapper = mount(
    defineComponent({
      setup() {
        control = useDraggableControls();
        return () =>
          h(
            draggableFor(),
            {
              ref: control,
              modelValue: model.value,
              itemKey: 'id',
              'onUpdate:modelValue': (value) => {
                update(value);
                model.value = value;
              },
              onChange: change,
              onEnd: end,
            },
            { item: ({ element }) => h('div', { 'data-id': element.id }, element.id) }
          );
      },
    })
  );
  wrappers.push(wrapper);
  return { model, change, update, end, control: control.value, root: control.value.$el };
}

/**
 * Reproduce Sortable's placeholder movement before its synchronous drop callbacks.
 * @param {object} source - Originating mounted list.
 * @param {object} target - Receiving mounted list.
 * @param {string} type - Browser event ending the gesture.
 * @returns {object} The event passed to Sortable's drop callbacks.
 */
function startDrop(source, target, type = 'touchcancel') {
  const item = source.root.children[0];
  const event = {
    item,
    from: source.root,
    to: target.root,
    oldIndex: 0,
    newIndex: target === source ? 1 : target.root.children.length,
    originalEvent: new Event(type),
  };
  source.control._sortable.option('onStart')(event);
  target.root.appendChild(item);
  return event;
}

const modelIds = (list) => list.model.value.map(({ id }) => id);
const domIds = (list) => [...list.root.children].map((item) => item.dataset.id);

// Test Group 1: Canceled touch drops and subsequent completed drops
describe('typedDraggable touch cancellation', () => {
  // Test Case 1: Restore same-list cancellation before model or change emissions.
  it('restores a reordered placeholder before vuedraggable can emit model or change', async () => {
    const list = mountList(['a', 'b']);
    const event = startDrop(list, list);
    expect(domIds(list)).toEqual(['b', 'a']);

    list.control._sortable.option('onUpdate')(event);
    list.control._sortable.option('onEnd')(event);
    await nextTick();

    expect(domIds(list)).toEqual(['a', 'b']);
    expect(modelIds(list)).toEqual(['a', 'b']);
    expect(list.update).not.toHaveBeenCalled();
    expect(list.change).not.toHaveBeenCalled();
    expect(list.end).toHaveBeenCalledWith(event);
  });

  // Test Cases 2-3: Restore cross-list cancellation with empty and populated receivers.
  it.each([{ ids: [] }, { ids: ['c'] }])(
    'restores cross-list cancellation into a receiver containing $ids',
    async ({ ids }) => {
      const source = mountList(['a', 'b']);
      const target = mountList(ids);
      const event = startDrop(source, target);

      // Sortable emits add before remove; neither side may enter its model mutation.
      target.control._sortable.option('onAdd')(event);
      source.control._sortable.option('onRemove')(event);
      source.control._sortable.option('onEnd')(event);
      await nextTick();

      expect(domIds(source)).toEqual(['a', 'b']);
      expect(domIds(target)).toEqual(ids);
      expect(modelIds(source)).toEqual(['a', 'b']);
      expect(modelIds(target)).toEqual(ids);
      for (const list of [source, target]) {
        expect(list.update).not.toHaveBeenCalled();
        expect(list.change).not.toHaveBeenCalled();
      }
    }
  );

  // Test Cases 4-5: A completed touch or native drop still saves after cancellation.
  it.each(['touchend', 'drop'])('still commits a subsequent completed %s drop', async (type) => {
    const list = mountList(['a', 'b']);
    const canceled = startDrop(list, list);
    list.control._sortable.option('onUpdate')(canceled);
    list.control._sortable.option('onEnd')(canceled);
    await nextTick();

    const completed = startDrop(list, list, type);
    list.control._sortable.option('onUpdate')(completed);
    list.control._sortable.option('onEnd')(completed);
    await nextTick();

    expect(modelIds(list)).toEqual(['b', 'a']);
    expect(domIds(list)).toEqual(['b', 'a']);
    expect(list.update).toHaveBeenCalledTimes(1);
    expect(list.change).toHaveBeenCalledWith({
      moved: { element: { id: 'a' }, oldIndex: 0, newIndex: 1 },
    });
  });
});

// Test Group 2: Completed cross-list drop compatibility
describe('typedDraggable completed cross-list drops', () => {
  // Test Cases 6-7: Completed touch and native drops preserve add/remove semantics.
  it.each(['touchend', 'drop'])(
    'preserves vuedraggable add/remove semantics for %s',
    async (type) => {
      const source = mountList(['a', 'b']);
      const target = mountList(['c']);
      const event = startDrop(source, target, type);

      target.control._sortable.option('onAdd')(event);
      source.control._sortable.option('onRemove')(event);
      source.control._sortable.option('onEnd')(event);
      await nextTick();

      expect(modelIds(source)).toEqual(['b']);
      expect(modelIds(target)).toEqual(['c', 'a']);
      expect(domIds(source)).toEqual(['b']);
      expect(domIds(target)).toEqual(['c', 'a']);
      expect(source.change).toHaveBeenCalledWith({
        removed: { element: { id: 'a' }, oldIndex: 0 },
      });
      expect(target.change).toHaveBeenCalledWith({ added: { element: { id: 'a' }, newIndex: 1 } });
    }
  );
});
