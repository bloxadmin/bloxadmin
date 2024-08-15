<template>
  <h1>Actions</h1>
  <div class="actions-list">
    <ActionCard :gameIdentifier="gameIdentifier" v-for="action in actions" :action="action" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import ActionCard from "./ActionCard.vue";
import { Action, getActions } from "../../lib/bloxadmin";

interface Props {
  gameIdentifier: string;
}

const props = defineProps<Props>();

const actions = ref<Action[]>([]);
const loading = ref<boolean>(false);

const update = async (): Promise<void> => {
  loading.value = true;
  const { body } = await getActions(props.gameIdentifier);
  if (!body) {
    // To-do: Error;
    return;
  }
  actions.value = body;
  loading.value = false;
};

watch(() => props.gameIdentifier, update);

onMounted(update);
</script>
<style lang="scss" scoped>
h1 {
  padding: 0 32px;
  padding-top: 16px;
  color: var(--text-title);
}

.actions-list {
  display: flex;
  flex-direction: column;
  padding: 32px;
  gap: 16px;
}
</style>
