<template>
  <div class="datastore">
    <div class="datastore-sidebar">
      <div class="datastore-header">
        <p class="title">Datastore Explorer</p>
        <p class="name">{{ props.dataStore }}</p>
      </div>
      <div class="entries-search">
        <input class="scope-input" type="text" v-model="scopeInput" placeholder="All Scopes" @keyup="search" />
        <input class="search-input" type="text" v-model="searchInput" placeholder="Key Prefix" @keyup="search" />
        <div class="search-button" @click="search">
          <Loading v-if="loading" :size="16" />
          <Search v-else :size="16" />
        </div>
      </div>
      <div class="entries">
        <RouterLink v-if="entryKey && !entryKeys.includes(entryKey)" class="entry" :class="{ selected: true }"
          :to="{ name: 'Datastore Entry', params: { entryKey } }">
          <span class="entry-key">{{ entryKey }}</span>
        </RouterLink>
        <RouterLink v-for="key in entryKeys" :key="key" class="entry"
          :class="{ selected: entryKey && key === entryKey }"
          :to="{ name: 'Datastore Entry', params: { entryKey: key } }">
          <span class="entry-key">{{ key }}</span>
        </RouterLink>
      </div>
      <div class="entries-more" v-if="nextPageCursor">
        <BaseButton theme="primary" @click="loadMore" :disabled="!!loading">
          <template #icon>
            <Loading v-if="loading" :size="16" />
            <Download v-else :size="16" />
          </template>
          Load More
        </BaseButton>
      </div>
      <div v-else class="entries-more none">
        <span>No more entries</span>
      </div>
    </div>

    <RouterView :gameIdentifier="gameIdentifier" :dataStore="dataStore" :entryKey="entryKey" />
  </div>
</template>

<script setup lang="ts">
import { Download, Search } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import BaseButton from "../components/general/BaseButton.vue";
import Loading from "../components/general/Loading.vue";
import { getDataStoreEntries } from "../lib/bloxadmin";
import debounce from "../lib/debounce";

interface Props {
  gameIdentifier: string;
  dataStore: string;
  entryKey?: string;
}

const props = defineProps<Props>();

const loading = ref<number>(0);
const scopeInput = ref<string>("");
const searchInput = ref<string>("");

const entryKeys = ref<string[]>([]);
const nextPageCursor = ref<string | undefined>(undefined);


const search = debounce(async () => {
  loading.value++;
  const result = await getDataStoreEntries(props.gameIdentifier, props.dataStore, searchInput.value, scopeInput.value);

  if (!result.body) {
    loading.value--;
    return;
  }

  entryKeys.value = result.body.keys;
  nextPageCursor.value = result.body.nextPageCursor;

  loading.value--;
}, 500);

const loadMore = async () => {
  if (!nextPageCursor.value) return;
  loading.value++;

  const result = await getDataStoreEntries(
    props.gameIdentifier,
    props.dataStore,
    searchInput.value,
    scopeInput.value,
    nextPageCursor.value
  );

  if (!result.body) {
    loading.value--;
    return;
  }

  entryKeys.value = [...entryKeys.value ?? [], ...result.body.keys];
  nextPageCursor.value = result.body.nextPageCursor;

  loading.value--;
};

onMounted(search);
</script>

<style lang="scss" scoped>
.datastore {
  display: flex;
  height: 100%;
  max-width: 100%;

  .datastore-sidebar {
    width: 288px;
    border-right: 1px solid var(--border);
    box-shadow: 4px 0 8px rgba(0, 0, 0, 0.025);
    background-color: var(--foreground);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: hidden;
    overflow-y: auto;
    position: relative;

    .datastore-header {
      width: 100%;
      padding: 14px 16px 8px 16px;
      border-bottom: 1px solid var(--border);
      background-color: var(--foreground);

      position: sticky;
      top: 0;

      .title {
        text-transform: uppercase;
        font-size: 12px;
        line-height: 1;
        font-weight: 600;
        color: var(--text);
      }

      .name {
        font-size: 18px;
        line-height: 30px;
        font-weight: 600;
        color: var(--text-title);
      }
    }

    .entries-search {
      width: 100%;
      display: grid;
      padding: 16px;
      grid-template-columns: 1fr 32px;
      border-bottom: 1px solid var(--border);
      row-gap: 8px;

      input.search-input {
        height: 100%;
        width: 100%;

        padding: 7.5px 16px;

        background-color: var(--background);

        border-radius: 4px 0 0 4px;

        font-size: 14px;
      }

      input.scope-input {
        height: 100%;
        width: 100%;
        grid-column: span 2;

        padding: 7.5px 16px;

        background-color: var(--background);

        border-radius: 4px 0 0 4px;

        font-size: 14px;
      }

      .search-button {
        background-color: var(--primary);

        width: 32px;
        height: 100%;

        display: grid;
        place-items: center;

        border-radius: 0 4px 4px 0;

        cursor: pointer;

        color: var(--primary-text-title);

        &:hover {
          color: var(--text-active);
        }
      }
    }

    .entries-more {
      display: flex;
      justify-content: center;
      padding: 8px;
      margin-top: 8px;

      &.none {
        font-style: italic;
        color: var(--text-muted);
        user-select: none;
      }
    }

    .entries {
      margin-top: 8px;
      width: 100%;
    }

    .entry {
      display: flex;
      align-items: center;
      padding: 8px 16px;

      cursor: pointer;

      color: var(--text);

      .entry-key {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 14px;
        font-weight: 500;
        line-height: 1;
      }

      .entry-favorite:hover {
        color: var(--primary);
      }

      &:hover {
        color: var(--text-active);
      }

      &.selected {
        color: var(--primary);
      }
    }
  }

  .datastore-viewer {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
