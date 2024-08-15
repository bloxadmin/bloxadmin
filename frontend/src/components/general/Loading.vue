<template>
  <div class="loading" :style="styleObject" />
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  size?: number
}

const props = withDefaults(defineProps<Props>(), { size: 16 });

const styleObject = computed(() => {
  return {
    height: `${props.size}px`,
    width: `${props.size}px`
  };
});
</script>

<style lang="scss" scoped>
@keyframes spin {
  100% { 
    transform: rotate(360deg);
  }
}

.loading {
  border-radius: 50%;

  border-style: solid;
  border-width: 2px;
  border-color: currentColor transparent;

  animation: spin 1s infinite;
}
</style>
