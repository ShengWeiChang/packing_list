/*
================================================================================
File: source/components/typedDraggable.ts
Description: Typed facade for the vuedraggable API used by application templates.
License: MIT (SPDX: MIT)
================================================================================
*/

import type { ComponentCustomProps, HTMLAttributes, VNode } from 'vue';
import draggable from 'vuedraggable';

import type { putOnlyFromGroup } from '../utils/dragDrop';
import type { DragStart } from './componentContracts';

type DragChange<T> = {
  added?: { element: T; newIndex: number };
  moved?: { element: T; oldIndex: number; newIndex: number };
  removed?: { element: T; oldIndex: number };
};
type DraggableProps<T> = Omit<HTMLAttributes, 'onChange'> &
  ComponentCustomProps & {
    modelValue: T[];
    itemKey: keyof T & string;
    tag?: string;
    delay?: number;
    delayOnTouchOnly?: boolean;
    group?: { name: string; pull: boolean; put: boolean | ReturnType<typeof putOnlyFromGroup> };
    animation?: number;
    ghostClass?: string;
    chosenClass?: string;
    dragClass?: string;
    disabled?: boolean;
    'onUpdate:modelValue'?: (value: T[]) => void;
    onStart?: (event: DragStart) => void;
    onEnd?: (event: unknown) => void;
    onUpdate?: (event: unknown) => void;
    onChange?: (event: DragChange<T>) => void;
  };

// vuedraggable 4.1.0 passes modelValue entries to item slots and change.element.
// Keep its runtime identity and isolate its incomplete / any-based declaration here.
/** Bind the component declaration to the list model used by one consumer. */
export function draggableFor<T extends { id: string }>() {
  return draggable as unknown as new () => {
    $props: DraggableProps<T>;
    $slots: { item: (props: { element: T; index: number }) => VNode[] };
  };
}
