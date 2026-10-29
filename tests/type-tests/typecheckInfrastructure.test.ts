/*
================================================================================
File: tests/type-tests/typecheckInfrastructure.test.ts
Description: Compile-only positive and negative checks for the TypeScript gate.
License: MIT (SPDX: MIT)
================================================================================
*/

import { ref } from 'vue';

import TypecheckProbe from './fixtures/TypecheckProbe.vue';

/** Prove that strict inference and real SFC props/emits reach the checker. */
export function checkInfrastructureContracts() {
  const quantity = ref(1);
  quantity.value = 2;
  // @ts-expect-error -- A typed numeric ref must reject text.
  quantity.value = 'two';

  const selected = ref<string | null>(null);
  // @ts-expect-error -- A nullable value requires narrowing before use.
  selected.value.toUpperCase();

  const quantities: number[] = [];
  // @ts-expect-error -- Indexed access may be absent even in a numeric array.
  quantities[0].toFixed(0);

  type Probe = InstanceType<typeof TypecheckProbe>;
  const validProps: Probe['$props'] = { quantity: 2 };
  // @ts-expect-error -- Component props must retain their declared numeric type.
  const invalidProps: Probe['$props'] = { quantity: 'two' };
  const emit = (component: Probe) => {
    component.$emit('save', 2);
    // @ts-expect-error -- Event payloads must retain the component's declared type.
    component.$emit('save', 'two');
    // @ts-expect-error -- Only declared component events are valid.
    component.$emit('remove', 2);
  };
  return { validProps, invalidProps, emit };
}
