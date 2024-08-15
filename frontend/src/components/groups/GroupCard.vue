<template>
  <RouterLink class="team-card" :to="{ name: 'Group', params: { groupIdentifier: group.id } }">
    <div class="team-icon">
      <img :src="`${API_BASE}/roblox/groupIcons/${group.id}`" alt="Group Icon" />
    </div>
    <div class="team-info">
      <p class="name">{{ group.name }}</p>
      <p class="description">{{ group.id }}</p>
    </div>
  </RouterLink>
</template>
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { API_BASE, Group } from '../../lib/bloxadmin';
interface Props {
  group: Group;
}

const props = defineProps<Props>();
</script>
<style scoped lang="scss">
.team-card {
  background-color: var(--foreground);
  text-decoration: none;
  color: inherit;

  border-radius: 8px;

  display: flex;

  border: 1px solid var(--border);

  box-shadow: 0 4px 8px rgba(black, 0.025);

  .team-icon {
    width: 128px;
    height: 128px;

    background-color: var(--background);

    border-radius: 8px 0 0 8px;

    img {
      width: 100%;
      height: 100%;

      object-fit: fill;

      border-radius: 8px 0 0 8px;
    }
  }

  .team-info {
    padding: 8px 16px;

    display: flex;
    flex-direction: column;
    justify-content: center;

    .name {
      font-size: 1.25rem;
      font-weight: 500;
    }

    .description {
      color: var(--text);
    }
  }
}
</style>
