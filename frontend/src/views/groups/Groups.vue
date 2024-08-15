<template>
  <Container>
    <div class="groups-header">
      <BaseButton :to="{ name: 'Groups' }" theme="primary">
        <template #icon>
          <Plus :size="16" />
        </template>

        Add Group
      </BaseButton>
    </div>
    <div class="groups">
      <GroupCard v-for="group in groups" :key="group.id" :group="group" />
    </div>
  </Container>
</template>
<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import BaseButton from '../../components/general/BaseButton.vue';
import Container from '../../components/general/Container.vue';
import GroupCard from '../../components/groups/GroupCard.vue';
import { Group, getGroups } from '../../lib/bloxadmin';

const groups = ref<Group[]>([]);

const update = async () => {
  const body = await getGroups();

  if (!body.body) return;

  groups.value = body.body;
}

onMounted(update);
</script>
<style scoped lang="scss">
.groups-header {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.groups {
  display: grid;
  grid-gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
</style>
