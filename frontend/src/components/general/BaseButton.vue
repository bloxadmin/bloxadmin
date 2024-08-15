<template>
  <Component :is="component" v-bind="componentProperties" class="base-button" :class="buttonClass" @click="handleClick">
    <slot name="icon" />

    <p class="base-button-text">
      <slot />
    </p>
  </Component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ButtonEmits, ButtonProps, useButton } from "../../composables/button";

interface Props extends ButtonProps {
  theme?: "primary" | "secondary" | "discord" | "pro",
  reverse?: boolean,
  disabled?: boolean,
  active?: boolean,
  big?: boolean
  center?: boolean
  full?: boolean
  type?: "button" | "submit" | "reset"
}

const props = defineProps<Props>();
const emit = defineEmits<ButtonEmits>();

const { component, componentProperties, handleClick } = useButton(props, emit);

const buttonClass = computed(() => {
  return {
    "base-button-primary": props.theme === "primary",
    "base-button-secondary": props.theme === "secondary",
    "base-button-discord": props.theme === "discord",
    "base-button-pro": props.theme === "pro",
    "base-button-reverse": props.reverse,
    "base-button-big": props.big,
    "base-button-center": props.center,
    "base-button-full": props.full,
    disabled: props.disabled,
    active: props.active
  };
});

</script>

<style lang="scss" scoped>
.base-button {
  height: 32px;

  border-radius: 4px;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 0 16px;

  background-color: var(--background);
  outline: none;
  border: none;

  color: var(--text);

  cursor: pointer;

  &:hover, &.active {
    color: var(--text-active);
  }

  &.base-button-secondary {
    background-color: var(--secondary-background);
  }

  &.base-button-primary {
    background-color: var(--primary);

    color: var(--primary-text-title);

    &:hover {
      color: var(--white);
    }
  }

  &.base-button-discord {
    background-color: #5468ff;

    color: #c2c7ef;

    &:hover {
      color: #ffffff;
    }
  }

  &.base-button-pro {
    background-color: #3b82f6;

    color: #c3dafe;

    &:hover {
      color: #ffffff;
    }
  }

  &.base-button-big {
    padding: 0 32px;
    height: 48px;
    gap: 16px;
  }

  &.base-button-center {
    justify-content: center;
  }

  &.base-button-full {
    width: 100%;
  }

  &.base-button-reverse {
    flex-direction: row-reverse;
  }

  p.base-button-text {
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
