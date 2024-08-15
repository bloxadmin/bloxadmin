<template>
  <div class="script-config">
    <div class="script-config-header">
      <p class="header-text">Ingest Config</p>

      <BaseIndicator v-if="loading">
        <Loading />
      </BaseIndicator>

      <IconButton v-else @click="update">
        <RefreshCcw :size="16" />
      </IconButton>

      <!-- <BaseButton theme="primary" @click="save" :disabled="saved || loading">
        <template #icon>
          <Save :size="16" />
        </template>

        Save
      </BaseButton> -->
    </div>

    <div class="script-config-body" :class="{ disabled: loading }">

      <label class="script-config-label" for="apikey">API Key</label>

      <div class="script-config-input-group">
        <input id="apikey" class="script-config-input script-config-key" readonly :value="apiKey">

        <IconButton @click="toggleApiKeyHidden">
          <Eye v-if="apiKeyHidden" :size="16" />
          <EyeOff v-else :size="16" />
        </IconButton>
      </div>

      <h4 class="script-config-input-section">Modules</h4>

      
    </div>
  </div>
</template>

<script setup lang="ts">
import { Eye, EyeOff, RefreshCcw } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { ScriptConfig, getScriptConfig, updateScriptConfig } from "../../lib/bloxadmin";
import BaseIndicator from "../general/BaseIndicator.vue";
import IconButton from "../general/IconButton.vue";
import Loading from "../general/Loading.vue";

interface Props {
  gameIdentifier: string
}

const props = defineProps<Props>();

const loading = ref<boolean>(false);
const apiKeyHidden = ref<boolean>(true);
const remoteConfig = ref<ScriptConfig | null>(null);
const localConfig = ref<ScriptConfig | null>(null);

const apiKey = computed(() => {
  if (apiKeyHidden.value) return '<hidden>';

  return remoteConfig.value?.ingestKey || 'ERROR';
});

const toggleApiKeyHidden = () => {
  apiKeyHidden.value = !apiKeyHidden.value;
};

const update = async () => {
  loading.value = true;

  const { body } = await getScriptConfig(props.gameIdentifier);

  if (!body) {
    // To-do: Error;

    return;
  }

  remoteConfig.value = body;
  localConfig.value = body;

  loading.value = false;
};

const saved = computed(() => {
  return JSON.stringify(remoteConfig.value) === JSON.stringify(localConfig.value);
})

const save = async () => {
  if (saved || !localConfig.value) return;

  loading.value = true;

  const { body } = await updateScriptConfig(props.gameIdentifier, localConfig.value);

  if (!body) {
    // To-do: Error;

    return;
  }

  remoteConfig.value = body;
  localConfig.value = body;

  loading.value = false;
};

onMounted(update);
</script>

<style lang="scss" scoped>
.script-config {
  background-color: var(--foreground);
  border-radius: 4px;
  border: 1px solid var(--border);
  background-color: var(--foreground);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.025);

  overflow: hidden;

  display: flex;
  flex-direction: column;

  .script-config-header {
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

  .script-config-body {
    flex-grow: 1;
    padding: 16px;

    display: flex;
    flex-direction: column;
  }
}

.script-config-label {
  font-size: 12px;
  color: var(--text);
  line-height: 1;

  margin-bottom: 8px;
}

input.script-config-input {
  height: 40px;

  padding: 0 16px;

  background-color: var(--secondary-background);

  border-radius: 4px;

  border: 1px solid var(--border);

  margin-bottom: 16px;

  font-size: 14px;
  color: var(--text-input);
  line-height: 1;

  &.script-config-key {
    font-family: monospace;
  }

  &::placeholder {
    color: var(--text);
  }
}

.script-config-input-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;

  >input {
    flex-grow: 1;

    margin-bottom: 0;
  }
}
</style>
