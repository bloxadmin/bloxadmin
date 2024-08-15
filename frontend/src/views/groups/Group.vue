<template>
  <Container v-if="group">
    <RouterView :group="group" />
  </Container>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import Container from '../../components/general/Container.vue';
import { Group, getGroup } from '../../lib/bloxadmin';

interface Props {
  groupIdentifier: string;
}

const props = defineProps<Props>();

const group = ref<Group | null>(null);

const update = async (): Promise<void> => {
  const body = await getGroup(props.groupIdentifier);

  if (!body.body) return;

  group.value = body.body;

  document.title = `${group.value.name} | bloxadmin`;
};

watch(() => props.groupIdentifier, update);
onMounted(update);
onUnmounted(() => {
  document.title = "bloxadmin";
});
</script>
