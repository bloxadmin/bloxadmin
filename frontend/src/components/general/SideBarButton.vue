<template>
  <Component :is="component" v-bind="componentProperties" v-slot="slot" @click="handleClick" v-if="hasPermission" class="side-bar-button-wrapper">
    <!-- https://github.com/vuejs/rfcs/blob/master/active-rfcs/0028-router-active-link.md#summary -->
    <div class="side-bar-button" :class="{ active: slot && (exact ? path === slot.route.path : path.startsWith(slot.route.path)) }">
      <div class="side-bar-button-icon">
        <slot name="icon" />
      </div>

      <p class="side-bar-button-text">
        <slot />
      </p>

      <div class="side-bar-button-notice" v-if="notice" :title="notice"></div>
    </div>
  </Component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { ButtonEmits, ButtonProps, useButton } from "../../composables/button";
import { Permission } from "../../lib/bloxadmin";
import { hasPermissionSync } from "../../lib/permissions";

interface Props extends ButtonProps {
  exact?: boolean
  permissions?: Permission[];
  notice?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<ButtonEmits>();

const { component, componentProperties, handleClick } = useButton(props, emit);
const route = useRoute();

const path = computed(() => route.path);

const hasPermission = computed(() => {
  if (!props.permissions) return true;

  return hasPermissionSync(Number(route.params.gameIdentifier), props.permissions, true);
});
</script>

<style lang="scss" scoped>
.side-bar-button-wrapper {
  background: none;
  border: none;
  outline: none;
}
.side-bar-button {
  display: flex;
  align-items: center;

  white-space: nowrap;

  height: 32px;

  color: var(--text);

  cursor: pointer;

  &:hover {
    color: var(--text-active);
  }

  &.active {
    color: var(--primary);

    .side-bar-button-icon {
      background-color: var(--primary-background);
    }
  }

  .side-bar-button-icon {
    height: 32px;
    width: 32px;

    background-color: var(--background);

    border-radius: 4px;

    margin-right: 16px;

    flex-shrink: 0;

    display: grid;
    place-items: center;
  }

  p.side-bar-button-text {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
  }

  .side-bar-button-notice {
    height: 1em;
    width: 1em;

    background-color: var(--primary);

    border-radius: 50%;

    margin-left: 8px;

    flex-shrink: 0;

    border: 4px solid var(--primary-background);

    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      border-width: 4px;
      transform: scale(1);
    }

    50% {
      border-width: 5px;
      transform: scale(1.25);
    }

    100% {
      border-width: 4px;
      transform: scale(1);
    }
  }
}
</style>
