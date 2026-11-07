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
    easing?: string;
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

export type DraggableControl = {
  $el: HTMLElement;
  _sortable?: {
    nativeDraggable: boolean;
    option: (name: 'touchStartThreshold' | 'animation', value: number) => void;
    captureAnimationState: () => void;
    removeAnimationState: (element: HTMLElement) => void;
    addAnimationState: (state: { target: HTMLElement; rect: DOMRect }) => void;
    animateAll: () => void;
  };
};

/** Apply a five-CSS-pixel hold tolerance after Sortable's native-drag detection. */
export function useDraggableControls() {
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
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      sortable.option('animation', reduce ? 0 : 200);
      if (reduce) cancelDraggableMotion(control.value);
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

export type DraggableReflow = { element: HTMLElement; from: DOMRect; to: DOMRect };
type AnimatedElement = HTMLElement & {
  animated?: number | false;
  animationResetTimer?: number;
  animatingX?: boolean;
  animatingY?: boolean;
  thisAnimationDuration?: number | null;
  fromRect?: DOMRect | null;
  toRect?: DOMRect;
  prevFromRect?: DOMRect | null;
  prevToRect?: DOMRect | null;
};

/** Fill the reflow gaps not already animated by Sortable's own drag-over pass. */
export function animateDraggableReflow(
  control: DraggableControl | null,
  changes: DraggableReflow[]
) {
  const sortable = control?._sortable;
  if (!sortable) return;
  const pending = changes.filter(({ element, to }) => {
    const target = element as AnimatedElement;
    return !(
      target.thisAnimationDuration &&
      target.toRect &&
      Math.abs(target.toRect.left - to.left) < 0.5 &&
      Math.abs(target.toRect.top - to.top) < 0.5
    );
  });
  if (!pending.length) return;
  sortable.captureAnimationState();
  // Height-only changes must not mark a stationary header as animated and block a hold.
  for (const child of control.$el.children) {
    if (child instanceof HTMLElement) sortable.removeAnimationState(child);
  }
  for (const { element, from } of pending) {
    (element as AnimatedElement).fromRect = from;
    sortable.addAnimationState({ target: element, rect: from });
  }
  sortable.animateAll();
}

/** Cancel only Sortable-owned transforms and timers, leaving floating previews alone. */
export function cancelDraggableMotion(control: DraggableControl | null) {
  if (!control) return;
  for (const element of control.$el.children) {
    const target = element as AnimatedElement;
    if (!target.animated && !target.thisAnimationDuration) continue;
    if (typeof target.animated === 'number') clearTimeout(target.animated);
    clearTimeout(target.animationResetTimer);
    target.style.transition = '';
    target.style.transform = '';
    target.animated = false;
    target.animatingX = target.animatingY = false;
    target.thisAnimationDuration = null;
    target.fromRect = target.prevFromRect = target.prevToRect = null;
  }
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
