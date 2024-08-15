<template>
  <div class="modal">
    <div class="remote-config-modal">
      <div class="remote-config-modal-header">
        <IconButton @click="$emit('close')">
          <X :size="16" />
        </IconButton>

        <BaseButton @click="add" reverse theme="primary">
          <template #icon>
            <ArrowRight :size="16" />
          </template>

          Add
        </BaseButton>
      </div>

      <div class="remote-config-modal-label">Key</div>

      <input type="text" class="remote-config-modal-input" placeholder="parameter_key" v-model="parameter">

      <div class="remote-config-modal-label">Value</div>

      <input type="text" class="remote-config-modal-input" placeholder="parameter_value" v-model="value">
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, X } from "lucide-vue-next";
import { ref } from "vue";
import BaseButton from "../general/BaseButton.vue";
import IconButton from "../general/IconButton.vue";

interface Emits {
  (e: "add", parameter: string, value: string): void,
  (e: "close"): void
}

const emit = defineEmits<Emits>();

const parameter = ref<string>("");
const value = ref<string>("");

const add = () => emit("add", parameter.value, value.value);
</script>

<style lang="scss" scoped>
.modal {
  position: fixed;

  z-index: 999;

  left: 0;
  top: 0;

  height: 100vh;
  width: 100vw;

  background-color: rgba(black, 0.5);

  display: grid;
  place-items: center;
}

.remote-config-modal {
  width: 288px;

  background-color: var(--foreground);

  border-radius: 4px;

  padding: 16px;

  .remote-config-modal-header {
    display: flex;
    justify-content: space-between;
  }

  .remote-config-modal-label {
    font-size: 12px;
    color: var(--text);
    line-height: 1;

    margin: 16px 0 8px;
  }

  input.remote-config-modal-input {
    height: 40px;

    background-color: var(--background);

    font-size: 14px;
    color: var(--text-input);
    line-height: 1;

    width: 100%;

    border-radius: 4px;

    border: 1px solid var(--border);

    padding: 0 16px;

    &::placeholder {
      color: var(--text);
    }
  }
}
</style>
