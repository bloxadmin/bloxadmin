<template>
  <div>
    <div ref="target">
      <slot :open="open" />
    </div>

    <div class="dropdown" :class="`dropdown-${size || 'sm'}`" ref="content">
      <p v-if="title" class="dropdown-title">{{ title }}</p>

      <div @click="handleClick">
        <slot name="content" />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
export interface DropdownRef {
  hide: () => void;
  show: () => void;
}
</script>

<script lang="ts" setup>
import tippy, { Instance, Placement } from "tippy.js";
import { onMounted, onUnmounted, ref } from "vue";

interface Props {
  title?: string,
  placement?: Placement;
  noAutoHide?: boolean;
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), { placement: "bottom-end" });
defineExpose({ hide: () => instance.hide(), show: () => instance.show() });

const target = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);
const open = ref<boolean>(false);

let instance: Instance;

const handleClick = () => !props.noAutoHide && instance.hide();

onMounted(() => {
  instance = tippy(target.value as HTMLElement, {
    content: content.value as HTMLElement,
    interactive: true,
    allowHTML: true,
    animation: false,
    arrow: false,
    trigger: "click",
    placement: props.placement,
    offset: [0, 8],
    popperOptions: {
      modifiers: [
        {
          name: "flip",
          enabled: false
        }
      ]
    },
    onHide: () => {
      open.value = false;
    },
    onShow: () => {
      open.value = true;
    }
  });
});

onUnmounted(() => {
  instance.destroy();
});
</script>

<style lang="scss" scoped>
.dropdown {
  padding: 8px 0;

  &.dropdown-sm {
    width: 192px;
  }

  &.dropdown-md {
    width: 256px;
  }

  &.dropdown-lg {
    width: 320px;
  }

  border: 1px solid var(--border);

  background-color: var(--foreground);

  border-radius: 4px;

  box-shadow: 0 4px 8px rgba(black, 0.025);

  p.dropdown-title {
    font-size: 12px;
    color: var(--text);
    line-height: 1;

    padding: 8px 16px;
  }
}
</style>
