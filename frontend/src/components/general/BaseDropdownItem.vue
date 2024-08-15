<template>
  <div class="dropdown-item" @click="handleClick" :class="{ active }">
    <slot />
  </div>
</template>

<script lang="ts" setup>
interface Props {
  active?: boolean
}

interface Emits {
  (e: "click"): void
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleClick = () => emit("click");
</script>

<style lang="scss" scoped>
.dropdown-item {
  padding: 8px 16px;

  height: 32px;

  display: flex;
  align-items: center;

  cursor: pointer;

  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  color: var(--text);

  &:hover {
    color: var(--text-active);
  }

  &.active {
    background-color: var(--background);

    color: var(--text-active);
  }
}
</style>
