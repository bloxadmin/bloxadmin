<template>
  <input type="checkbox" class="switch" :class="{ disabled }" v-model="model" />
</template>

<script setup lang="ts">
import { computed } from "vue";

// To-do: Style
interface Props {
  modelValue: boolean,
  disabled?: boolean
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const model = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean): void => emit("update:modelValue", value)
});
</script>

<style lang="scss" scoped>
// To-do: SCSS variables
.switch {
  height: 32px;
  width: 56px;

  border-radius: 16px;

  position: relative;

  background-color: var(--background);

  cursor: pointer;

  &::before {
    content: "";

    height: 24px;
    width: 24px;

    background-color: var(--text);

    position: absolute;

    border-radius: 12px;

    left: 4px;
    top: 4px;

    transition: left 100ms ease;
  }

  &:hover::before {
    background-color: var(--text-active);
  }

  &:checked {
    background-color: rgba(239, 68, 68, 0.1);

    &::before {
      left: 28px;

      background-color: var(--primary);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
  }
}
</style>
