<template>
  <div :class="{ 'roblox-config': true, 'roblox-config-alert': !game?.apiKeySet }">
    <div class="roblox-config-header">
      <div class="title-notice" title="Must set this!" v-if="!game?.apiKeySet"></div>
      <p class="header-text">Roblox Config</p>

      <BaseIndicator v-if="loading">
        <Loading />
      </BaseIndicator>

      <BaseButton theme="secondary" href="https://docs.bloxadmin.com/docs/guides/cloud-api">
        <template #icon>
          <HelpCircle :size="16" />
        </template>

        Need Help?
      </BaseButton>

      <BaseButton theme="primary" @click="save" :disabled="!key || loading">
        <template #icon>
          <Save :size="16" />
        </template>

        Save
      </BaseButton>
    </div>

    <div class="roblox-config-body" :class="{ disabled: loading }">
      <Alert v-if="error">
        <template #title>Oh no!</template>

        <template #description>
          <p>{{ error }}</p>
        </template>
      </Alert>

      <label class="roblox-config-label" for="username">Open Cloud API Key</label>

      <input id="username" type="text" class="roblox-config-input" v-model="key"
        :placeholder="game?.apiKeySet ? '<unchanged>' : 'Ojj2UBWUC0S+qn3F3aavirWfezWS7ti9CeuFuceh3eHf9Au8'"
        autocomplete="off">

      <!-- <BaseButton :href="`${API_BASE}/roblox/link/game`" theme="primary" v-if="!game?.apiKeySet">
        <template #icon>
          <Link :size="16" />
        </template>

        Link With Roblox
      </BaseButton> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { HelpCircle, Save } from "lucide-vue-next";
import { ref } from "vue";
import { Game, addApiKey } from "../../lib/bloxadmin";
import Alert from "../general/Alert.vue";
import BaseButton from "../general/BaseButton.vue";
import BaseIndicator from "../general/BaseIndicator.vue";
import Loading from "../general/Loading.vue";

interface Props {
  gameIdentifier: string;
  game: Game;
}

interface Emits {
  (e: "updateGame"): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const error = ref<string>("");
const key = ref<string>("");
const loading = ref<boolean>(false);

const save = async () => {
  if (!key.value) return;

  loading.value = true;
  error.value = "";

  const { ok, raw } = await addApiKey(props.gameIdentifier, {
    apiKey: key.value,
  });

  if (!ok) {
    error.value = raw || "An unknown error occurred.";
    loading.value = false;

    return;
  }

  emit("updateGame");

  loading.value = false;
  key.value = "";
};
</script>

<style lang="scss" scoped>
.roblox-config {
  background-color: var(--foreground);
  border-radius: 4px;
  background-color: var(--foreground);
  border: 1px solid var(--border);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.025);

  overflow: hidden;

  display: flex;
  flex-direction: column;

  &.roblox-config-alert {
    border-color: rgb(255, 77, 79);
    animation: pulse-shadow 2s infinite;
  }


  .roblox-config-header {
    padding: 16px;

    display: flex;
    align-items: center;
    gap: 8px;

    border-bottom: 1px solid var(--border);

    z-index: 1;

    p.header-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-title);

      flex-grow: 1;
    }
  }

  .roblox-config-body {
    flex-grow: 1;
    padding: 16px;

    display: flex;
    flex-direction: column;
  }
}

.roblox-config-label {
  font-size: 12px;
  color: var(--text);
  line-height: 1;

  margin-bottom: 8px;
}

input.roblox-config-input {
  height: 40px;

  padding: 0 16px;

  background-color: var(--secondary-background);

  border-radius: 4px;

  border: 1px solid var(--border);

  margin-bottom: 16px;

  font-size: 14px;
  color: var(--text-input);
  line-height: 1;

  &::placeholder {
    color: var(--text);
  }
}


.title-notice {
  height: 1em;
  width: 1em;

  background-color: var(--primary);

  border-radius: 50%;

  margin-left: 8px;

  flex-shrink: 0;

  border: 4px solid var(--primary-background);

  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    border-width: 4px;
    transform: scale(1);
  }

  50% {
    border-width: 5px;
    transform: scale(1.25);
  }

  100% {
    border-width: 4px;
    transform: scale(1);
  }
}

@keyframes pulse-shadow {
  0% {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.025);
  }

  50% {
    box-shadow: 0 0 8px rgba(255, 77, 79, 0.6);
  }

  100% {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.025);
  }
}
</style>
