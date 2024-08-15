<template>
  <label class="checkbox" :class="{ disabled }" :for="identifier">
    <div class="checkbox-input">
      <input type="checkbox" :id="identifier" v-model="model" :value="value" />

      <div class="checkbox-icon">
        <Check :size="12" />
      </div>
    </div>

    <p v-if="value" class="checkbox-text">
      <slot />
    </p>
  </label>
</template>

<script setup lang="ts">
import { Check } from "lucide-vue-next";
import { computed } from "vue";

interface Props {
  modelValue: Array<string> | boolean,
  value?: string,
  disabled?: boolean
}

interface Emits {
  (e: "update:model-value", value: Array<string> | boolean): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const identifier = crypto.randomUUID();

const model = computed({
  get: (): Array<string> | boolean => props.modelValue,
  set: (value: Array<string> | boolean): void => emit("update:model-value", value)
});
</script>

<style lang="scss" scoped>
.checkbox {
  display: flex;
  align-items: center;
  gap: 16px;

  cursor: pointer;

  .checkbox-text {
    font-size: 14px;
    color: var(--text-title);
    line-height: 1;
  }

  .checkbox-input {
    position: relative;

    input {
      height: 16px;
      width: 16px;

      border-radius: 4px;

      display: grid;
      place-items: center;

      &:hover {
        background-color: var(--border);
      }

      &:checked {
        background-color: var(--primary);
      }

      &:not(:checked) {
        border: 2px solid var(--border);

        & ~ .checkbox-icon {
          display: none;
        }
      }
    }

    .checkbox-icon {
      position: absolute;

      top: 2px;
      left: 2px;

      color: var(--white);

      pointer-events: none;
    }
  }
}
</style>
