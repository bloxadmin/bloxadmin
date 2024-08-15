<template>
  <div
    v-if="player.id === 0"
    title="Not a player"
    class="row-player">
    <div class="player-avatar">
      <img :key="player.id" :src="`${API_BASE}/roblox/avatars/0`" />
    </div>

    <p class="player-name">System</p>
  </div>
  <RouterLink
    v-else
    :to="group ? { name: 'Group User', params: { userIdentifier: player.id } } : { name: 'Player', params: gameIdentifier ? { playerIdentifier: player.id, gameIdentifier } : { playerIdentifier: player.id } }"
    class="row-player">
    <div class="player-avatar">
      <img :key="player.id" :src="`${API_BASE}/roblox/avatars/${player.id}`" />
    </div>

    <p class="player-name">{{ player.name }}</p>
  </RouterLink>
</template>

<script setup lang="ts">
import { API_BASE } from '../../lib/bloxadmin';

interface Props {
  group?: boolean,
  gameIdentifier?: string | number,
  player: {
    id: string | number,
    name: string
  }
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.row-player {
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover .player-name {
    color: var(--text-title);
  }

  .player-avatar {
    height: 32px;
    width: 32px;

    border-radius: 16px;

    overflow: hidden;
  }

  .player-name {
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
    color: var(--text);

    border-bottom: 2px solid var(--border);
  }
}
</style>
