<template>
  <label class="radio-button" :for="identifier">
    <input type="radio" class="radio-button" :id="identifier" v-model="model" :value="value">

    <p class="radio-button-text">
      <slot />
    </p>
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  modelValue: string,
  value: string
}

interface Emits {
  (e: "update:model-value", value: string): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const identifier = crypto.randomUUID();

const model = computed({
  get: (): string => props.modelValue,
  set: (value: string): void => emit("update:model-value", value)
});
</script>

<style lang="scss" scoped>
.radio-button {
  display: flex;
  align-items: center;
  gap: 16px;

  cursor: pointer;

  &:hover .radio-button-text {
    color: var(--text-active);
  }

  .radio-button-text {
    font-size: 14px;
    color: var(--text);
    line-height: 1;

  }

  input {
    position: relative;

    height: 16px;
    width: 16px;

    border-radius: 50%;
    
    border: 2px solid var(--border);

    display: grid;
    place-items: center;

    position: relative;

    &:hover {
      background-color: var(--border);
    }

    &:checked {
      border-color: var(--primary);

      &::before {
        content: "";

        height: 8px;
        width: 8px;

        border-radius: 50%;

        background-color: var(--primary);

        position: absolute;

        left: 2px;
        top: 2px;
      }
    }
  }
}
</style>
