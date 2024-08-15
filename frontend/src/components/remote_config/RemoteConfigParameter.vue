<template>
  <div class="remote-config-parameter">
    <div class="parameter-key">
      <Checkbox v-model="selectedModel" :value="parameter">{{ parameter }}</Checkbox>
    </div>

    <div class="parameter-value">
      <Equal :size="16" />

      <input type="text" v-model="localValueModel" :disabled="!canEdit">
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"; 
import { Equal } from "lucide-vue-next";
import Checkbox from "../general/Checkbox.vue";

interface Props {
  parameter: string,
  remoteValue: string | null,
  localValue: string | null,
  selected: string[];
  canEdit: boolean;
}

interface Emits {
  (e: "update:localValue", value: string | null): void,
  (e: "update:selected", value: string[]): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localValueModel = computed({
  get: () => props.localValue,
  set: (value) => emit("update:localValue", value)
});

const selectedModel = computed({
  get: () => props.selected,
  set: (value) => emit("update:selected", value)
});
</script>

<style lang="scss" scoped>
.remote-config-parameter {
  height: 48px;
  
  display: flex;

  &:not(:last-child) {
    border-bottom: 1px solid var(--border);
  }

  .parameter-key, .parameter-value {
    height: 100%;
    
    display: flex;
    align-items: center;
  }

  .parameter-value {
    flex-grow: 1;

    font-size: 14px;
    color: var(--neutral-900);

    position: relative;

    input {
      padding: 0 16px 0 48px;

      width: 100%;
    }

    > :first-child {
      position: absolute;

      left: 16px;
      top: 12px;

      color: var(--text);
    }
  }

  .parameter-key {
    width: 256px;

    padding: 0 16px;
  }
}
</style>
