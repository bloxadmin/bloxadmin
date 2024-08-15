<template>
  <div class="virtual-list" @scroll="updatePosition" ref="element">
    <div class="virtual-list-body" :style="style">
      <slot v-for="(item, index) in displayedItems" :item="item" :index="index + skippedItems" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

interface Props {
  size: number,

  items: any[]
}

const props = defineProps<Props>();

const element = ref<HTMLElement | null>(null);
const height = ref<number>(0);
const position = ref<number>(0);

let resizeObserver: ResizeObserver;

const skippedItems = computed(() => {
  return Math.max(Math.floor(position.value / props.size) - 2, 0);
});

const style = computed(() => {
  return {
    height: `${props.items.length * props.size}px`,
    paddingTop: `${skippedItems.value * props.size}px`
  };
});

const displayedItems = computed(() => {
  const lastVisibleItem = Math.ceil((position.value + height.value) / props.size);
  return props.items.slice(skippedItems.value, Math.min(props.items.length, lastVisibleItem + 2) + 1);
});

const updatePosition = () => {
  position.value = element.value!.scrollTop;
};

const updateHeight = () => {
  height.value = element.value!.clientHeight;
};

onMounted(() => {
  updateHeight();

  resizeObserver = new ResizeObserver(updateHeight);
  resizeObserver.observe(element.value!);
});

onBeforeUnmount(() => {
  resizeObserver.unobserve(element.value!);
});
</script>

<style lang="scss">
.virtual-list {
  height: 100%;

  overflow: auto;
}
</style>
