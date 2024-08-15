<template>
  <div class="base-indicator">
    <slot />
  </div>
</template>

<script setup lang="ts">
// To-do: Options
</script>

<style lang="scss" scoped>
.base-indicator {
  height: 32px;
  width: 32px;

  color: var(--text);

  display: grid;
  place-items: center;
}
</style>
