<template>
  <div>
    <div ref="target">
      <BaseIndicator v-if="loading">
        <Loading />
      </BaseIndicator>

      <IconButton v-else :active="open" @click="handleClick">
        <ChevronUp :size="16" v-if="open" />

        <ChevronDown :size="16" v-else />
      </IconButton>
    </div>

    <div class="side-bar-dropdown" ref="content">
      <div class="side-bar-dropdown-header">
        <input type="text" v-model="input" placeholder="Search..." />

        <Search :size="16" />
      </div>

      <div class="side-bar-dropdown-body">
        <div class="side-bar-dropdown-game" v-for="game in filteredGames">
          <div class="game-icon">
            <img :src="`${API_BASE}/roblox/gameIcons/${game.id}`">
          </div>

          <RouterLink @click="handleClick" :to="{ name: 'Servers', params: { gameIdentifier: game.id } }" class="game-text">{{ game.name }}</RouterLink>
        </div>

        <!-- To-do: Placeholder -->
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ChevronDown, ChevronUp, Search } from "lucide-vue-next";
import tippy, { Instance } from "tippy.js";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { API_BASE, Game } from "../../lib/bloxadmin";
import useGamesStore from "../../stores/games";
import BaseIndicator from "./BaseIndicator.vue";
import IconButton from "./IconButton.vue";
import Loading from "./Loading.vue";

const { Games, refreshGames } = useGamesStore();

const target = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);
const open = ref<boolean>(false);
const loading = ref<boolean>(false);
const input = ref<string>("");

let instance: Instance;

const games = ref<Game[]>([]);

const filteredGames = computed(() => {
  const text = input.value.toLowerCase();

  return games.value.filter(game => {
    return game.name.toLowerCase().includes(text);
  });
});

const handleClick = async () => {
  if (loading.value) return;

  if (open.value) {
    instance.hide();

    return;
  }

  loading.value = true;

  open.value = true;

  await refreshGames();
  const body = await Games();

  games.value = body;

  loading.value = false;

  instance.show();
};

onMounted(() => {
  instance = tippy(target.value as HTMLElement, {
    content: content.value as HTMLElement,
    interactive: true,
    allowHTML: true,
    animation: false,
    arrow: false,
    trigger: "manual",
    placement: "bottom-end",
    offset: [ 0, 8 ],
    onHide: () => {
      open.value = false;
      games.value = [];
      input.value = "";
    }
  });
});

onUnmounted(() => {
  instance.destroy();
});
</script>

<style lang="scss" scoped>
.side-bar-dropdown {
  width: 256px;
  max-height: 256px;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  border: 1px solid var(--border);

  background-color: var(--foreground);

  border-radius: 4px;

  box-shadow: 0 4px 8px rgba(black, 0.025);

  .side-bar-dropdown-header {
    border-bottom: 1px solid var(--border);

    background-color: var(--background);

    box-shadow: 0 4px 8px rgba(black, 0.025);

    position: relative;

    &:hover > :last-child, &:focus-within > :last-child {
      color: var(--text-active);
    }

    > :last-child {
      position: absolute;

      right: 16px;
      top: 16px;

      pointer-events: none;

      color: var(--text);
    }

    input {
      width: 100%;
      height: 48px;

      padding: 0 48px 0 16px;

      font-size: 14px;
      color: var(--text);

      &::placeholder {
        color: var(--text);
      }
    }
  }

  .side-bar-dropdown-body {
    overflow: auto;

    padding: 16px;

    display: flex;
    flex-direction: column;
    gap: 8px;

    .side-bar-dropdown-game {
      display: flex;
      align-items: center;
      gap: 16px;

      a.game-text {
        font-weight: 500;
        font-size: 14px;
        color: var(--text);
        line-height: 1.5;

        text-overflow: ellipsis;
        overflow: hidden;

        &:hover {
          color: var(--text-active);
        }
      }

      .game-icon {
        overflow: hidden;

        flex-shrink: 0;

        height: 32px;
        width: 32px;

        border-radius: 4px;

        img {
          object-fit: cover;
        }
      }
    }
  }
}
</style>
