<template>
  <WithPermission :has="[Permissions.Actions.Executions.List]">
    <div id="wow">
      hi
    </div>
  </WithPermission>
</template>

<script setup lang="ts">
import { Action, getAction, Permissions } from '../lib/bloxadmin';
import { ref, watch, onMounted } from 'vue';

interface Props {
  gameIdentifier: string;
  action: string;
}

const props = defineProps<Props>();

const actions = ref<Action | null>(null);
const loading = ref<boolean>(false);

const update = async (): Promise<void> => {
  loading.value = true;
  const { body } = await getAction(props.gameIdentifier, props.action);
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
