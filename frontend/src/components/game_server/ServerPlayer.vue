<template>
  <div class="server-player">
    <div class="server-player-avatar">
      <img :src="`${API_BASE}/roblox/avatars/${player.id}`">
    </div>

    <div class="server-player-text">
      <RouterLink :to="{ name: 'Player', params: { playerIdentifier: player.id } }" class="server-player-link">{{ player.name }}</RouterLink>

      <p class="server-player-description">{{ player.joinedAt ? new Date(player.joinedAt).toLocaleString() : "" }}</p>
    </div>
    
    <!-- <BaseDropdown title="Actions">
      <template v-slot:default="{}">
        <IconButton>
          <ChevronDown :size="16" />
        </IconButton>
      </template>

      <template #content>
        <BaseDropdownItem @click="">Mute</BaseDropdownItem>
        <BaseDropdownItem @click="">Kick</BaseDropdownItem>
        <BaseDropdownItem @click="">Ban</BaseDropdownItem>
      </template>
    </BaseDropdown> -->
  </div>
</template>

<script setup lang="ts">
import { API_BASE, Player } from "../../lib/bloxadmin";
// import { ChevronDown } from "lucide-vue-next";
// import IconButton from "./IconButton.vue";
// import BaseDropdown from "./BaseDropdown.vue";
// import BaseDropdownItem from "./BaseDropdownItem.vue";

interface Props {
  player: Player
}

defineProps<Props>();
</script>

<style lang="scss">
.server-player {
  display: flex;
  align-items: center;
  gap: 16px;

  cursor: pointer;

  &:hover .server-player-text a.server-player-link {
    color: var(--text-active);
  }

  .server-player-text {
    flex-grow: 1;

    line-height: 1;

    p.server-player-description {
      font-size: 12px;
      color: var(--text);

      margin-top: 4px;
    }

    a.server-player-link {
      font-size: 14px;
      color: var(--text);
      font-weight: 500;

      &:hover {
        color: var(--text-active);
      }
    }
  }

  .server-player-avatar {
    height: 32px;
    width: 32px;

    border-radius: 4px;

    overflow: hidden;

    img {
      height: 100%;
      width: 100%;

      object-fit: cover;
    }
  }
}
</style>
