<template>
  <div class="entry" v-if="entry">
    <div class="loader" v-if="loading">
      <Loading :size="32" />
    </div>

    <div class="entry-header">
      <p class="name">
        {{ entry.key }}
      </p>

      <small v-if="entry.detectedSchemaType" class="schema"
        :title="`The schema of this Datastore entry has been detected to be ${entry.detectedSchemaType}. Use caution when editing`">
        {{ entry.detectedSchemaType }}
      </small>

      <div class="separator"></div>

      <WithPermission :has="[Permissions.Datastores.Entries.Update]">
        <IconButton theme="primary" @click="save" :disabled="clean">
          <Save :size="16" />
        </IconButton>
      </WithPermission>

      <IconButton theme="secondary" @click="reset" :disabled="clean">
        <Undo2 :size="16" />
      </IconButton>

      <BaseIndicator v-if="loading">
        <Loading />
      </BaseIndicator>
      
      <IconButton theme="secondary" @click="update" v-else>
        <RefreshCcw :size="16" />
      </IconButton>
    </div>
    <div class="entry-meta">

      <div class="entry-card">
        <div class="title">Added At</div>
        <div class="body">
          <p>{{ entry.addedAt ? new Date(entry.addedAt).toLocaleString() : 'Unknown' }}</p>
        </div>
      </div>

      <div class="entry-card">
        <div class="title">Updated At</div>
        <div class="body">
          <p>{{ entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'Unknown' }}</p>
        </div>
      </div>

      <div class="entry-card full">
        <div class="title">Version</div>
        <div class="body">
          <p>{{ entry.version }}</p>
        </div>
      </div>

      <div class="entry-card full">
        <div class="title">Attributes</div>
        <div class="body">
          <pre><JsonHilight>{{ JSON.stringify(entry.attributes, null, 2) }}</JsonHilight></pre>
        </div>
      </div>

      <div class="entry-card full" v-if="entry.players.length !== 0">
        <p class="title">Players</p>
        <div class="body">
          <div v-for="player in entry.players" :key="player.id" class="player">
            <DisplayPlayer :player="player" :gameIdentifier="props.gameIdentifier" :size="32" />
          </div>
        </div>
      </div>

      <div class="entry-card full">
        <pre><JsonHilight :key="entryKey">{{ entryData }}</JsonHilight></pre>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { cloneDeep, isEqual } from "lodash";
import { RefreshCcw, Save, Undo2 } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import BaseIndicator from '../components/general/BaseIndicator.vue';
import IconButton from '../components/general/IconButton.vue';
import Loading from '../components/general/Loading.vue';
import WithPermission from '../components/misc/WithPermission.vue';
import DisplayPlayer from '../components/players/DisplayPlayer.vue';
import JsonHilight from '../components/general/JsonHilight.vue';
import { DataStoreEntry, Permissions, getDataStoreEntry } from '../lib/bloxadmin';

type Data = any;

interface Props {
  gameIdentifier: string;
  dataStore: string;
  entryKey: string;
}

const entry = ref<DataStoreEntry<Data> | undefined>(undefined);

const props = defineProps<Props>();

const loading = ref<boolean>(false);
const entryData = ref<Data>(undefined);
const newData = ref<Data>(undefined);

const clean = computed(() => {
  if (!entry.value) return true;

  return isEqual(entryData.value, entry.value.data);
});

const save = () => {
  // TODO: Save
}

const reset = () => {
  if (!entry.value) return;

  entryData.value = cloneDeep(entry.value.data);
}

const update = async () => {
  loading.value = true

  const result = await getDataStoreEntry(
    props.gameIdentifier,
    props.dataStore,
    props.entryKey,
  );

  if (!result.body) {
    loading.value = false;
    return;
  }

  entry.value = result.body;
  entryData.value = cloneDeep(result.body.data);

  loading.value = false;
}

watch(() => props.entryKey, update, { immediate: true });
watch(() => props.dataStore, update, { immediate: true });

onMounted(update)
</script>
<style scoped lang="scss">
.entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  position: relative;

  .loader {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    display: grid;
    place-items: center;
    background-color: rgba(255, 255, 255, 0.5);
  }

  .entry-header {
    max-width: 100%;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border);
    box-shadow: 4px 0 8px rgba(0, 0, 0, 0.025);
    background-color: var(--foreground);
    padding: 8px 16px;
    gap: 8px;

    // stick to top

    position: sticky;
    top: 0;
    z-index: 1;

    .name {
      max-width: 100%;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 1.25rem;
      font-weight: 500;
      margin: 0;
      line-height: 2.5;
    }

    .schema {
      font-size: 12px;
      font-weight: 500;
      color: var(--white);
      background-color: var(--primary);
      border-radius: 4px;
      padding: 4px 8px;
    }

    .separator {
      flex: 1;
    }
  }

  .entry-meta {
    padding: 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .entry-card {
    padding: 8px 16px 16px 16px;
    border-radius: 8px;
    background-color: var(--foreground);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.025);

    .title {
      font-weight: 500;
      margin: 0;
      line-height: 2.5;
    }

    &.full {
      grid-column: span 2;
    }
  }
}
</style>
