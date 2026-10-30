<!--
================================================================================
File: tests/type-tests/fixtures/InvalidTemplate.vue
Description: Deliberate template-prop error; checked only by the diagnostic probe.
License: MIT (SPDX: MIT)
================================================================================
-->

<template>
  <TypecheckProbe quantity="two" />
</template>

<script setup lang="ts">
import TypecheckProbe from './TypecheckProbe.vue';
</script>
