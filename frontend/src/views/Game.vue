<template>
  <div v-if="game" class="game">
    <SideBar :game="game" />

    <div class="content" v-if="noOutline">
      <RouterView :game="game" @updateGame="updateGame" />
    </div>
    <Outline v-else>
      <WithPermission :has="[Permissions.Api.Keys.List]" v-if="!game.apiKeySet">
        <Alert :to="{ name: 'Settings' }">
          <template #icon>
            <AlertCircle :size="24" />
          </template>

          <template #title>API key not set!</template>

          <template #description>
            <p>It looks like you haven't set your <a class="link"
                href="https://create.roblox.com/docs/cloud/open-cloud/managing-api-keys" target="_blank">Open Cloud API
                key</a> yet. You can do that in the settings.</p>
            <p>This is required for many things in bloxadmin to work, such as moderation, remote config and shutting down
              servers.</p>
          </template>

          <template #button>Settings</template>
        </Alert>
      </WithPermission>
      <Alert v-if="game.features.includes(GameFeature.Block)">
        <template #icon>
          <AlertCircle :size="24" />
        </template>

        <template #title>This game is blocked!</template>

        <template #description>
          <p>This game has been blocked</p>
        </template>
      </Alert>

      <RouterView :game="game" @updateGame="updateGame" />
    </Outline>
  </div>

  <div v-else class="loading" />
</template>

<script setup lang="ts">
import { AlertCircle } from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Alert from "../components/general/Alert.vue";
import Outline from "../components/general/Outline.vue";
import SideBar from "../components/general/SideBar.vue";
import WithPermission from "../components/misc/WithPermission.vue";
import { Game, GameFeature, Permissions } from "../lib/bloxadmin";
import useGamesStore from "../stores/games";

interface Props {
  gameIdentifier: string
}

const props = defineProps<Props>();

const { Game: getGame } = useGamesStore();
const router = useRouter();

const game = ref<Game | null>(null);

const noOutline = computed(() => {
  return router.currentRoute.value.meta.noOutline;
})

const updateGame = async (): Promise<void> => {
  const body = await getGame(props.gameIdentifier);

  if (!body) {
    router.push("/games");

    return;
  }

  game.value = body;

  document.title = `${game.value.name} | bloxadmin`;
};

watch(() => props.gameIdentifier, updateGame);

onMounted(updateGame);

onUnmounted(() => {
  document.title = "bloxadmin";
});
</script>

<style lang="scss">
.game {
  height: calc(100vh - 64px);

  overflow: hidden;

  display: flex;

  .content {
    flex-grow: 1;
    width: 100%;
    max-width: 100%;
  }
}
</style>
