/*
================================================================================
File: source/components/typedDraggable.ts
Description: Typed facade for the vuedraggable API used by application templates.
License: MIT (SPDX: MIT)
================================================================================
*/

import type { ComponentCustomProps, HTMLAttributes, VNode, VNodeProps } from 'vue';
import { onBeforeUnmount, onMounted, shallowRef } from 'vue';
import draggable from 'vuedraggable';

import type { putOnlyFromGroup } from '../utils/dragDrop';
import type { DragStart } from './componentContracts';

type DragChange<T> = {
  added?: { element: T; newIndex: number };
  moved?: { element: T; oldIndex: number; newIndex: number };
  removed?: { element: T; oldIndex: number };
};
type DraggableProps<T> = Omit<HTMLAttributes, 'onChange'> &
  ComponentCustomProps &
  VNodeProps & {
    modelValue: T[];
    itemKey: keyof T & string;
    tag?: string;
    delay?: number;
    delayOnTouchOnly?: boolean;
    fallbackOnBody?: boolean;
    filter?: string;
    preventOnFilter?: boolean;
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

type DraggableControl = {
  $el: HTMLElement;
  _sortable?: {
    nativeDraggable: boolean;
    option: (name: 'touchStartThreshold', value: number) => void;
  };
};

/** Apply a five-CSS-pixel hold tolerance after Sortable's native-drag detection. */
export function useTouchDragThreshold() {
  const control = shallowRef<DraggableControl | null>(null);
  let cleanup: (() => void) | undefined;
  onMounted(() => {
    // vuedraggable 4.1.0 exposes its mounted Sortable here. Keep this version-specific
    // access in the facade; Sortable's constructor overwrites a threshold prop with 1.
    const sortable = control.value?._sortable;
    const root = control.value?.$el;
    if (!sortable || !root) return;
    const apply = () => {
      const scale = sortable.nativeDraggable ? window.devicePixelRatio || 1 : 1;
      // Native Sortable divides its threshold by DPR; fallback mode already uses CSS pixels.
      sortable.option('touchStartThreshold', Math.ceil(5 * scale));
    };
    apply();
    // Recheck DPR before each gesture, including a hybrid device moved between displays.
    root.addEventListener('pointerdown', apply, true);
    root.addEventListener('touchstart', apply, true);
    cleanup = () => {
      root.removeEventListener('pointerdown', apply, true);
      root.removeEventListener('touchstart', apply, true);
    };
  });
  onBeforeUnmount(() => cleanup?.());
  return control;
}

// vuedraggable 4.1.0 passes modelValue entries to item slots and change.element.
// Keep its runtime identity and isolate its incomplete / any-based declaration here.
/** Bind the component declaration to the list model used by one consumer. */
export function draggableFor<T extends { id: string }>() {
  return draggable as unknown as new () => DraggableControl & {
    $props: DraggableProps<T>;
    $slots: {
      item: (props: { element: T; index: number }) => VNode[];
      footer?: () => VNode[];
    };
  };
}
