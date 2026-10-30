<!--
================================================================================
File: tests/type-tests/fixtures/ComponentContractsProbe.vue
Description: Real component and draggable template contract checks.
License: MIT (SPDX: MIT)
================================================================================
-->

<template>
  <Item
    :item="item"
    :save-item-edit="save"
    @update:item="forward"
  />
  <!-- @vue-expect-error -->
  <Item :item="{ ...item, quantity: '2' }" />
  <!-- @vue-expect-error -->
  <Item
    :item="item"
    :save-item-edit="() => true"
  />
  <Draggable
    :model-value="[item]"
    item-key="id"
    @change="changed"
  >
    <template #item="{ element }">
      {{ element.quantity.toFixed(0) }}
      <!-- @vue-expect-error -->
      {{ element.missingProperty }}
      <!-- @vue-expect-error -->
      {{ element.quantity.toUpperCase() }}
    </template>
  </Draggable>
</template>

<script setup lang="ts">
import type { ItemDragChange } from '../../../source/components/componentContracts';
import Item from '../../../source/components/Item.vue';
import { draggableFor } from '../../../source/components/typedDraggable';
import type { ItemDTO } from '../../../source/models/contracts';

const Draggable = draggableFor<ItemDTO>();
defineProps<{ item: ItemDTO }>();
const emit = defineEmits<{ update: [item: ItemDTO, expected?: ItemDTO] }>();
const save = async (item: ItemDTO, _expected: ItemDTO): Promise<ItemDTO | null> => item;
const forward = (item: ItemDTO, expected?: ItemDTO) => emit('update', item, expected);
const changed = (_event: ItemDragChange) => {};
</script>
