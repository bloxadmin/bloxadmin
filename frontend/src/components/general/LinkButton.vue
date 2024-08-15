<template>
  <Component :is="component" v-bind="componentProperties" class="link-button" :class="buttonClass" @click="handleClick">
    <slot />
  </Component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ButtonEmits, ButtonProps, useButton } from "../../composables/button";

interface Props extends ButtonProps {
  disabled?: boolean,
  active?: boolean,
  type?: "button" | "submit" | "reset"
}

const props = defineProps<Props>();
const emit = defineEmits<ButtonEmits>();

const { component, componentProperties, handleClick } = useButton(props, emit);

const buttonClass = computed(() => {
  return {
    disabled: props.disabled,
    active: props.active
  };
});

</script>

<style lang="scss" scoped>
.link-button {
  background: none;
  border: none;
  color: var(--primary);

  cursor: pointer;

  &:hover, &.active {
    color: var(--text-active);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
