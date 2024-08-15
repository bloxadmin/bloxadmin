<template>
  <RouterLink
    :to="game.isSetup ? { name: 'Servers', params: { gameIdentifier: game.id } } : { name: 'New game', params: { gameIdentifier: game.id } }"
    class="game-card">
    <div class="game-card-body">
      <img class="game-card-thumbnail" :src="`${API_BASE}/roblox/assetThumbnails/${game.rootPlaceId}?size=768x432`">

      <img class="game-card-icon" :src="`${API_BASE}/roblox/gameIcons/${game.id}`">
    </div>

    <div class="game-card-footer">
      <div class="footer-text">
        <p class="footer-title">{{ game.name }}</p>

        <p class="footer-description">{{ onlinePlayers }}</p>
      </div>

      <IconButton :href="'https://www.roblox.com/games/' + game.rootPlaceId" @click="$e => $e.stopPropagation()">
        <ExternalLink :size="16" />
      </IconButton>

      <IconButton theme="primary">
        <ArrowRight :size="16" />
      </IconButton>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { ArrowRight, ExternalLink } from "lucide-vue-next";
import { API_BASE, Game } from "../../lib/bloxadmin";
import IconButton from "../general/IconButton.vue";

interface Props {
  game: Game
}

const props = defineProps<Props>();

const onlinePlayers = props.game.onlinePlayerCount === 1 ? props.game.onlinePlayerCount + " online player" : props.game.onlinePlayerCount + " online players";
</script>

<style lang="scss" scoped>
.game-card {
  box-shadow: 0 4px 8px rgba(black, 0.025);

  border-radius: 4px;

  border: 1px solid var(--border);

  background-color: var(--foreground);

  overflow: hidden;

  .game-card-body {
    width: 100%;

    aspect-ratio: 16 / 9;

    position: relative;

    overflow: hidden;

    &::before {
      height: 100%;
      width: 100%;

      position: absolute;

      top: 0;
      left: 0;

      content: "";

      background-color: rgba(black, 0.5);

      backdrop-filter: blur(4px);
    }

    .game-card-thumbnail {
      object-fit: cover;

      height: 100%;
      width: 100%;
    }

    .game-card-icon {
      width: 32px;

      position: absolute;

      bottom: 16px;
      left: 16px;
    }
  }

  .game-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 16px;

    > :not(:first-child) {
      margin-left: 8px;
    }

    .footer-text {
      flex-grow: 1;

      margin-right: 16px;

      p.footer-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-title);
        line-height: 1;
      }

      p.footer-description {
        font-size: 12px;
        color: var(--text);
      }
    }
  }
}
</style>
