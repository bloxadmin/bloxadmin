<template>
  <div v-if="confirmation" class="confirmation-button" @click="handleClick" @animationend="toggleConfirmation">
    <p class="confirmation-button-text">Are you sure?</p>

    <Check />
  </div>

   <slot v-else :handleClick="toggleConfirmation" />
</template>

<script setup lang="ts">
import { Check } from "lucide-vue-next";
import { ref } from "vue";

interface Emits {
  (e: "click", event: Event): void
}

const emit = defineEmits<Emits>();

const confirmation = ref<boolean>(false);

const toggleConfirmation = (): void => {
  confirmation.value = !confirmation.value;
};

const handleClick = (event: Event): void => {
  confirmation.value = !confirmation.value;

  emit("click", event);
};
</script>

<style lang="scss" scoped>
@keyframes progress {
  0% {
    width: 0%;
  }

  100% {
    width: 100%;
  }
}

.confirmation-button {
  display: flex;
  align-items: center;
  gap: 8px;

  position: relative;

  height: 32px;

  border-radius: 4px;

  cursor: pointer;

  overflow: hidden;

  padding: 0 16px;

  background-color: var(--red-900);

  color: var(--primary-text-title);

  &:hover {
    color: var(--white);
  }

  &::before {
    content: "";

    height: 100%;

    position: absolute;

    animation: progress 3s linear;

    top: 0;
    left: 0;

    background-color: var(--primary);
  }

  > * {
    position: relative;
  }

  p.confirmation-button-text {
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
  }
}
</style>
