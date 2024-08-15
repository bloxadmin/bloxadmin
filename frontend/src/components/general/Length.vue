<template>
  <span v-text="text" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { formatDuration } from "../../lib/format";

interface Props {
  from: string;
}

const props = defineProps<Props>();

const timer = ref<number>();
const text = ref<string>(getText());

function getText() {
  const form = new Date(props.from).getTime() / 1000;
  const to = new Date().getTime() / 1000;

  const diff = Math.floor(to - form);

  return formatDuration(diff);
}


onMounted(() => {
  timer.value = setInterval(() => {
    text.value = getText();
  }, 1000);
});

onBeforeUnmount(() => {
  clearInterval(timer.value);
});
</script>
