<template>
  <RemoteConfigModal @close="toggleOpen" @add="add" v-if="open" />

  <div class="remote-config" :class="{ 'remote-config-maximized': maximized }">
    <div class="remote-config-header">
      <p class="header-text">Remote config</p>

      <BaseIndicator v-if="loading">
        <Loading />
      </BaseIndicator>

      <IconButton v-else @click="update">
        <RefreshCcw :size="16" />
      </IconButton>

      <BaseButton theme="primary" @click="save" :disabled="saved || loading" v-if="canEdit">
        <template #icon>
          <Save :size="16" />
        </template>

        Save
      </BaseButton>

      <IconButton @click="toggleOpen" v-if="canEdit">
        <Plus :size="16" />
      </IconButton>

      <IconButton @click="toggleMaximized">
        <Minimize v-if="maximized" :size="16" />

        <Maximize v-else :size="16" />
      </IconButton>
    </div>

    <div class="remote-config-menu">
      <div class="menu-group">
        <Checkbox :disabled="length === 0 || loading" v-model="model" />

        <p class="menu-text">Key</p>
      </div>

      <Equal :size="16" />

      <p class="menu-text">Value</p>
    </div>

    <div class="remote-config-body" :class="{ disabled: loading }">
      <template v-if="remoteParameters && localParameters && length > 0">
        <!-- remoteParameters[parameter] can be undefined -->
        <RemoteConfigParameter 
          v-for="parameter in parameters" 
          :parameter="parameter" 
          :key="parameter" 
          v-show="localParameters[parameter]"
          :remoteValue="remoteParameters[parameter] || null" 
          v-model:localValue="localParameters[parameter]"
          v-model:selected="selectedParameters"
          :canEdit="canEdit"
        />
      </template>

      <div v-else class="remote-config-placeholder">
        <Cloud :size="16" />

        <p class="placeholder-text">Nothing to see here.</p>
      </div>
    </div>

    <div class="remote-config-footer" v-if="selectedParameters.length > 0">
      <IconButton theme="primary" @click="remove">
        <Trash :size="16" />
      </IconButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Cloud, Equal, Maximize, Minimize, Plus, RefreshCcw, Save, Trash } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { Permissions, RemoteConfig, getRemoteConfig, updateRemoteConfig } from "../../lib/bloxadmin";
import { hasPermissionSync } from "../../lib/permissions";
import BaseButton from "../general/BaseButton.vue";
import BaseIndicator from "../general/BaseIndicator.vue";
import Checkbox from "../general/Checkbox.vue";
import IconButton from "../general/IconButton.vue";
import Loading from "../general/Loading.vue";
import RemoteConfigModal from "./RemoteConfigModal.vue";
import RemoteConfigParameter from "./RemoteConfigParameter.vue";

interface Props {
  gameIdentifier: string
}

const props = defineProps<Props>();

const selectedParameters = ref<string[]>([]);
const remoteParameters = ref<RemoteConfig | null>(null);
const localParameters = ref<RemoteConfig | null>(null);
const maximized = ref<boolean>(false);
const loading = ref<boolean>(false);
const open = ref<boolean>(false);

const toggleMaximized = () => {
  maximized.value = !maximized.value;
};

const toggleOpen = () => {
  open.value = !open.value;
};

const length = computed(() => {
  return localParameters.value ? Object.keys(localParameters.value).length : 0;
});

const saved = computed(() => {
  return JSON.stringify(remoteParameters.value) === JSON.stringify(localParameters.value);
});

const canEdit = computed(() => {
  return hasPermissionSync(props.gameIdentifier, [Permissions.RemoteConfig.Entries.Update]);
})

const remove = () => {
  if (!localParameters.value) return;

  for (const parameter of selectedParameters.value) localParameters.value[parameter] = null;

  selectedParameters.value = [];
};

const add = (parameter: string, value: string) => {
  if (!localParameters.value) return;

  localParameters.value[parameter] = value;

  toggleOpen();
};

const model = computed({
  get: () => length.value > 0 ? selectedParameters.value.length === length.value : false,
  set: (value) => {
    if (value && localParameters.value) selectedParameters.value = Object.keys(localParameters.value);
    else selectedParameters.value = [];
  }
});

const parameters = computed(() => {
  if (!remoteParameters.value || !localParameters.value) return null;

  // Concatenate keys from both objects and filter out duplicates
  const parameters = Object.keys(localParameters.value);
  return parameters.concat(Object.keys(remoteParameters.value).filter(parameter => parameters.indexOf(parameter) < 0));
});

const updateParameters = (body: RemoteConfig) => {
  remoteParameters.value = body;
  // Pass by value rather than reference for v-model
  localParameters.value = JSON.parse(JSON.stringify(body));

  selectedParameters.value = [];
};

const update = async () => {
  loading.value = true;

  const { body } = await getRemoteConfig(props.gameIdentifier);

  if (!body) {
    // To-do: Error

    return;
  }

  updateParameters(body);

  loading.value = false;
};

const save = async () => {
  if (!localParameters.value) return;

  loading.value = true;

  const { body } = await updateRemoteConfig(props.gameIdentifier, localParameters.value);

  if (!body) {
    // To-do: Error
    loading.value = false;
    return;
  }

  updateParameters(body);

  loading.value = false;
};

onMounted(update);
</script>

<style lang="scss" scoped>
.remote-config {
  background-color: var(--foreground);

  overflow: hidden;

  display: flex;
  flex-direction: column;

  &:not(.remote-config-maximized) {
    border-radius: 4px;

    border: 1px solid var(--border);

    box-shadow: 0 4px 8px rgba(black, 0.025);

    max-height: 512px;

    .remote-config-body .remote-config-placeholder {
      aspect-ratio: 4 / 1;
    }
  }

  &.remote-config-maximized {
    height: 100vh;
    width: 100vw;

    top: 0;
    left: 0;

    position: fixed;

    z-index: 999;

    .remote-config-body .remote-config-placeholder {
      height: 100%;
    }
  }

  .remote-config-menu {
    height: 32px;

    flex-shrink: 0;

    background-color: var(--background);

    border-bottom: 1px solid var(--border);

    display: flex;
    align-items: center;
    
    color: var(--text);

    .menu-group {
      display: flex;
      align-items: center;
      gap: 16px;

      width: 256px;

      padding: 0 16px;

      height: 100%;

      border-right: 1px solid var(--border);

      margin-right: 16px;
    }

    > :nth-child(2) {
      margin-right: 16px;
    }

    p.menu-text {
      font-size: 12px;
      font-weight: 500;
    }
  }

  .remote-config-header, .remote-config-footer {
    padding: 16px;

    display: flex;
    align-items: center;
    gap: 8px;
  }

  .remote-config-header {
    border-bottom: 1px solid var(--border);

    z-index: 1;

    p.header-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-title);

      flex-grow: 1;
    }
  }

  .remote-config-footer {
    border-top: 1px solid var(--border);
  }

  .remote-config-body {
    flex-grow: 1;

    overflow: auto;

    background: linear-gradient(to right, transparent 0 255px, var(--border) 255px 256px, var(--background) 256px 100%);

    .remote-config-placeholder {
      background-color: var(--background);

      display: flex;
      align-items: center;
      justify-content: center;

      color: var(--text);

      p.placeholder-text {
        margin-left: 16px;

        font-size: 14px;
        line-height: 1;
      }
    }

    .remote-config-parameter {
      height: 40px;
      
      display: flex;

      &:not(:last-child) {
        border-bottom: 1px solid var(--border);
      }

      .parameter-key, .parameter-value {
        height: 100%;
        
        display: flex;
        align-items: center;
      }

      .parameter-value {
        background-color: var(--background);

        flex-grow: 1;

        position: relative;

        input {
          padding: 0 16px 0 48px;
        }

        > :first-child {
          position: absolute;

          left: 16px;
          top: 12px;

          color: var(--text);
        }
      }

      .parameter-key {
        border-right: 1px solid var(--border);

        width: 256px;

        padding: 0 16px;
      }
    }
  }
}
</style>
