/*
================================================================================
File: tests/type-tests/componentContracts.test.ts
Description: Compile-only checks of actual component props, emits and drag slots.
License: MIT (SPDX: MIT)
================================================================================
*/

import AppIcon from '../../source/components/AppIcon.vue';
import Category from '../../source/components/Category.vue';
import Checklist from '../../source/components/Checklist.vue';
import type { ItemDragChange } from '../../source/components/componentContracts';
import Item from '../../source/components/Item.vue';
import NewChecklistDialog from '../../source/components/NewChecklistDialog.vue';
import TemplateEditor from '../../source/components/TemplateEditor.vue';
import { draggableFor } from '../../source/components/typedDraggable';
import type { ItemDTO } from '../../source/models/contracts';
import ComponentContractsProbe from './fixtures/ComponentContractsProbe.vue';

type ItemProps = InstanceType<typeof Item>['$props'];
type ChecklistProps = InstanceType<typeof Checklist>['$props'];
type IsAny<T> = 0 extends 1 & T ? true : false;

/** Compile real component APIs without mounting or running event handlers. */
export async function checkComponentContracts(
  item: ItemDTO,
  itemComponent: InstanceType<typeof Item>,
  categoryComponent: InstanceType<typeof Category>,
  checklistComponent: InstanceType<typeof Checklist>,
  dialog: InstanceType<typeof NewChecklistDialog>,
  templateEditor: InstanceType<typeof TemplateEditor>,
  props: ItemProps
) {
  const validProps: ItemProps = {
    item,
    saveItemEdit: async (updated, baseline) => (baseline.id === updated.id ? updated : null),
  };
  const fallbackProps: ItemProps = {
    item,
    saveItemEdit: null,
    updateItemAction: null,
    retainDraft: null,
  };
  // @ts-expect-error -- Saving is asynchronous and may fail; a synchronous callback is incompatible.
  const synchronousSave: ItemProps['saveItemEdit'] = (updated) => updated;
  // @ts-expect-error -- A callback must not promise the wrong result shape.
  const wrongSave: ItemProps['saveItemEdit'] = async () => ({ id: 'only-an-id' });
  // @ts-expect-error -- Item fields are deeply checked through actual component props.
  const invalidItem: ItemProps = { item: { ...item, quantity: '2' } };
  if (props.saveItemEdit) {
    const saved = await props.saveItemEdit(item, item);
    // @ts-expect-error -- Failure is null, so a returned entity must be checked.
    void saved.id;
    const notAny: IsAny<typeof saved> = false;
    void notAny;
  }
  const expectedNotAny: IsAny<Parameters<NonNullable<ItemProps['saveItemEdit']>>[1]> = false;
  itemComponent.$emit('update:item', item, { ...item, name: 'original' });
  // @ts-expect-error -- Baseline type is checked as the second emitted argument.
  itemComponent.$emit('update:item', item, 'original');
  // @ts-expect-error -- Event payloads cannot weaken normalized status fields.
  categoryComponent.$emit('update:item', { ...item, isPacked: 'yes' }, item);
  checklistComponent.$emit('update:item', item, item);
  // @ts-expect-error -- Forwarding preserves the optional second argument's type.
  checklistComponent.$emit('update:item', item, { ...item, quantity: '2' });
  // @ts-expect-error -- A category event requires its full observed fields.
  checklistComponent.$emit('update:category', { id: 'category' });
  dialog.$emit('select', { source: 'empty' });
  dialog.$emit('select', { source: 'template', templateId: 'template' });
  // @ts-expect-error -- Source-specific IDs cannot be omitted or confused.
  dialog.$emit('select', { source: 'recommended', templateId: 'template' });
  // @ts-expect-error -- The editor emits a complete template snapshot.
  templateEditor.$emit('save', { name: 'missing snapshot' });
  type IconProps = InstanceType<typeof AppIcon>['$props'];
  const icon: IconProps = { name: 'confirm', size: 'inline' };
  // @ts-expect-error -- Dynamic icons use semantic names, not arbitrary strings.
  const invalidIcon: IconProps = { name: 'unregistered' };
  const checklistDate: ChecklistProps['checklist']['startDate'] = null;
  // @ts-expect-error -- Component props must not turn a legacy date into a validated string.
  const validatedDate: string = checklistDate;
  void [
    validProps,
    fallbackProps,
    synchronousSave,
    wrongSave,
    invalidItem,
    expectedNotAny,
    icon,
    invalidIcon,
    validatedDate,
  ];
}

const ItemDraggable = draggableFor<ItemDTO>();
type DragAPI = InstanceType<typeof ItemDraggable>;
/** Prove third-party any does not escape into handlers, model updates or item slots. */
export function checkDragContracts(drag: DragAPI, item: ItemDTO) {
  type SlotItem = Parameters<DragAPI['$slots']['item']>[0]['element'];
  const slotNotAny: IsAny<SlotItem> = false;
  const modelNotAny: IsAny<DragAPI['$props']['modelValue'][number]> = false;
  type Change = Parameters<NonNullable<DragAPI['$props']['onChange']>>[0];
  const changeNotAny: IsAny<NonNullable<Change['added']>['element']> = false;
  const change: ItemDragChange = { added: { element: item, newIndex: 0 } };
  drag.$props.onChange?.(change);
  // @ts-expect-error -- Drag events carry normalized quantities.
  drag.$props.onChange?.({ added: { element: { ...item, quantity: '2' }, newIndex: 0 } });
  // @ts-expect-error -- A slot cannot receive a partial entity.
  drag.$slots.item({ element: { id: 'only-id' }, index: 0 });
  const forwardedNotAny: IsAny<Parameters<NonNullable<ChecklistProps['onUpdate:item']>>[1]> = false;
  void [
    slotNotAny,
    modelNotAny,
    changeNotAny,
    forwardedNotAny,
    ComponentContractsProbe,
    ItemDraggable,
  ];
}
