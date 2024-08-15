<template>
  <Component :is="component" v-bind="componentProperties" class="icon-button" :class="buttonClass" @click="handleClick">
    <slot />
  </Component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ButtonEmits, ButtonProps, useButton } from "../../composables/button";

interface Props extends ButtonProps {
  theme?: "primary" | "secondary",
  disabled?: boolean,
  active?: boolean
}

const props = defineProps<Props>();
const emit = defineEmits<ButtonEmits>();

const { component, componentProperties, handleClick } = useButton(props, emit);

const buttonClass = computed(() => {
  return {
    "icon-button-primary": props.theme === "primary",
    "icon-button-secondary": props.theme === "secondary",
    disabled: props.disabled,
    active: props.active
  };
});
</script>

<style lang="scss" scoped>
.icon-button {
  height: 32px;
  width: 32px;

  display: grid;
  place-items: center;

  border-radius: 4px;

  color: var(--text);

  background-color: var(--background);
  outline: none;
  border: none;

  cursor: pointer;

  &:hover, &.active {
    color: var(--text-active);
  }

  &.icon-button-secondary {
    background-color: var(--secondary-background);
  }

  &.icon-button-primary {
    background-color: var(--primary);

    color: var(--primary-text-title);

    &:hover {
      color: var(--white);
    }
  }
}
</style>
