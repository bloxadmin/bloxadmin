<template>
  <Container v-if="games">
    <div class="header">
      <BaseButton theme="primary" :href="`${API_BASE}/roblox/link/game`" here>
        <template #icon>
          <Plus :size="16" />
        </template>
        
        Add game
      </BaseButton>

      <BaseIndicator v-if="loading">
        <Loading />
      </BaseIndicator>
    </div>

    <div v-if="games" class="body">
      <GameCard v-for="game in games" :key="game.id" :game="game" />

      <!-- To-do: Placeholder -->
    </div>
  </Container>
</template>

<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import GameCard from "../components/games/GameCard.vue";
import BaseButton from "../components/general/BaseButton.vue";
import BaseIndicator from "../components/general/BaseIndicator.vue";
import Container from "../components/general/Container.vue";
import Loading from "../components/general/Loading.vue";
import { API_BASE, Game } from "../lib/bloxadmin";
import useGamesStore from "../stores/games";

const { Games } = useGamesStore();

const games = ref<Game[]>([]);
const loading = ref<boolean>(false);

onMounted(async (): Promise<void> => {
  loading.value = true;

  const body = await Games();

  if (!body) {
    // To-do: Error

    return;
  }

  games.value = body;

  loading.value = false;
});
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  gap: 8px;

  margin-bottom: 16px;
}

.body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  .placeholder {
    height: 345px;

    border-radius: 4px;

    border: 4px dashed var(--border);

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    padding: 0 16px;

    .placeholder-text {
      font-size: 14px;
      color: var(--text);
      line-height: 1.5;

      text-align: center;

      &:not(:first-child) {
        margin-bottom: 16px;
      }
    }
  }
}
</style>
