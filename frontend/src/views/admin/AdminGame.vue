<template>
  <Container v-if="game">
    <div class="button-group">
      <BaseButton :to="{ name: 'Admin' }" theme="secondary">
        <template #icon>
          <ArrowLeft :size="16" />
        </template>

        Back
      </BaseButton>
      <BaseButton :to="{ name: 'Servers', params: { gameIdentifier: gameIdentifier } }" theme="primary">
        <template #icon>
          <LayoutDashboard :size="16" />
        </template>

        Dashboard
      </BaseButton>
      <BaseIndicator v-if="loading">
        <Loading />
      </BaseIndicator>
      <IconButton @click="refreshGame" theme="secondary" v-else>
        <RefreshCcw :size="16" />
      </IconButton>
    </div>
    <div class="button-group">
      <BaseButton v-if="hideSensitive" @click="hideSensitive = false" theme="secondary" :disabled="loading">
        <template #icon>
          <Eye :size="16" />
        </template>

        Show Sensitive
      </BaseButton>
      <BaseButton v-else @click="hideSensitive = true" theme="secondary" :disabled="loading">
        <template #icon>
          <EyeOff :size="16" />
        </template>

        Hide Sensitive
      </BaseButton>
      <BaseButton theme="secondary" :disabled="loading" @click="updateFromRoblox">
        <template #icon>
          <FolderSync :size="16" />
        </template>

        Update From Roblox
      </BaseButton>
    </div>

    <h1>{{ game.name }}</h1>

    <ul>
      <li>
        <strong>Game ID:</strong> {{ game.id }}
      </li>

      <li>
        <strong>Root Place ID:</strong> <a :href="`https://roblox.com/games/${game.rootPlaceId}`" target="_blank">{{
          game.rootPlaceId }}</a>
      </li>

      <li v-if="game.ownerGroup">
        <strong>Owner Group:</strong> <a :href="`https://roblox.com/groups/${game.ownerGroup.id}`" target="_blank">{{
          game.ownerGroup.name }} ({{ game.ownerGroup.id }})</a>
      </li>

      <li v-if="game.ownerPlayer">
        <strong>Owner Player:</strong> <a :href="`https://roblox.com/users/${game.ownerPlayer.id}`" target="_blank">{{
          game.ownerPlayer.name }} ({{ game.ownerPlayer.id }})</a>
      </li>

      <li>
        <strong>Is Setup:</strong> <span :class="game.isSetup ? 'true' : 'false'">{{ game.isSetup }}</span>
      </li>

      <li>
        <strong>Active:</strong> <span :class="game.active ? 'true' : 'false'">{{ game.active }}</span>
        <button class="toggle" @click="toggleActive">{{ game.active ? 'Deactivate' : 'Activate' }}</button>
      </li>

      <li>
        <strong>API Key Set:</strong> <span :class="game.apiKeySet ? 'true' : 'false'">{{ game.apiKeySet }}</span>
      </li>

      <li v-if="!hideSensitive">
        <strong>Ingest Key:</strong> {{ game.ingestKey }}
      </li>

      <li>
        <strong>Total Server Count:</strong> {{ game.serverCount }}
      </li>

      <li>
        <strong>Active Server Count:</strong> {{ game.activeServerCount }}
      </li>

      <li>
        <strong>Online Player Count:</strong> {{ game.onlinePlayerCount }}
      </li>

      <li>
        <strong>Features:</strong>

        <ul>
          <li v-for="feature in Object.values(GameFeature)">
            <input class="feature" type="checkbox" :checked="features[feature]"
              v-on:change="setFlag(feature, ($event.target as HTMLInputElement).checked)" />
            {{ feature }}
          </li>
        </ul>

        <BaseButton :disabled="!edited || loading" @click="updateGame" theme="primary">Update</BaseButton>
      </li>
    </ul>
  </Container>
</template>

<script setup lang="ts">
import { ArrowLeft, Eye, EyeOff, LayoutDashboard, RefreshCcw } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "../../components/general/BaseButton.vue";
import BaseIndicator from "../../components/general/BaseIndicator.vue";
import Container from "../../components/general/Container.vue";
import IconButton from "../../components/general/IconButton.vue";
import Loading from "../../components/general/Loading.vue";
import { AdminGame, GameFeature, getGameAdmin, updateGameAdmin, updateGameFromRobloxAdmin } from "../../lib/bloxadmin";
import { FolderSync } from "lucide-vue-next";

interface Props {
  gameIdentifier: string;
}

const props = defineProps<Props>();

const loading = ref<boolean>(false);
const game = ref<AdminGame | null>(null);
const hideSensitive = ref<boolean>(true);

const features = ref(Object.values(GameFeature).reduce((acc, feature) => {
  acc[feature] = game.value?.features.includes(feature) ?? false;

  return acc;
}, {} as Record<GameFeature, boolean>));

const router = useRouter();

const edited = computed(() => {
  return game.value && Object.values(GameFeature).some(feature => features.value[feature] !== game.value?.features.includes(feature));
})

const setFlag = (feature: GameFeature, checked: boolean): void => {
  features.value[feature] = checked;
};

const refreshGame = async (): Promise<void> => {
  loading.value = true;
  const { body } = await getGameAdmin(props.gameIdentifier);

  if (!body) {
    router.push("/admin");

    return;
  }

  game.value = body;
  Object.values(GameFeature).forEach(feature => {
    features.value[feature] = game.value?.features.includes(feature) ?? false;
  });
  loading.value = false;
};

const toggleActive = async () => {
  if (!game.value) return;
  loading.value = true;

  const newFeatures = Object.values(GameFeature).filter(feature => features.value[feature]);

  await updateGameAdmin(props.gameIdentifier, {
    active: !game.value.active,
  });

  await refreshGame();
};

const updateGame = async (): Promise<void> => {
  if (!game.value) return;
  loading.value = true;

  const newFeatures = Object.values(GameFeature).filter(feature => features.value[feature]);

  await updateGameAdmin(props.gameIdentifier, {
    features: newFeatures,
  });

  await refreshGame();
};

const updateFromRoblox = async (): Promise<void> => {
  if (!game.value) return;
  loading.value = true;
  await updateGameFromRobloxAdmin(props.gameIdentifier);
  await refreshGame();
}

watch(() => props.gameIdentifier, refreshGame);
onMounted(refreshGame);
</script>

<style lang="scss" scoped>
.feature {
  appearance: auto;
}

.true {
  color: green;
}

.false {
  color: red;
}

.button-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.toggle {
  padding: 0;
  background: none;
  border: none;
  margin-left: 1ch;
  color: gray;
  cursor: pointer;

  &:active {
    color: white;
  }
}
</style>
