<!--
================================================================================
File: tests/type-tests/fixtures/TypecheckProbe.vue
Description: Typed component used only to prove compiler and template diagnostics.
License: MIT (SPDX: MIT)
================================================================================
-->

<template>
  <button
    type="button"
    @click="emit('save', quantity)"
  >
    {{ quantity.toFixed(0) }}
  </button>
</template>

<script setup lang="ts">
defineProps<{ quantity: number }>();
const emit = defineEmits<{ save: [quantity: number] }>();
</script>
