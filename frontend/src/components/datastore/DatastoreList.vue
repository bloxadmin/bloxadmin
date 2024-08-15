<template>
  <BaseTable title="Datastores" :columns="[{ text: 'Name' }, { text: 'Added' }]" @update=" update "
    :loading=" loading " :data=" datastores ">
    <template #header>
      <div class="bar">
        <input class="bar-input" type="text" v-model=" prefix " placeholder="Search..." @keyup=" search " />

        <div class="bar-button" :class="{ disabled: loading }" @click=" search ">
          <Search :size=" 16" />
        </div>
      </div>
    </template>
    <template v-slot:default="{ row }: { row: DataStore }">
      <tr class="table-row">
        <td>
          <RouterLink :to="{ name: 'Datastore', params: { gameIdentifier, dataStore: row.name } }" class="row-link">{{ row.name }}</RouterLink>
        </td>
        <td>{{ row.addedAt ? new Date(row.addedAt).toLocaleDateString() : "Unknown" }}</td>
      </tr>
    </template>
  </BaseTable>
</template>
<script setup lang="ts">
import { Search } from "lucide-vue-next";
import { ref } from "vue";
import { DataStore, getDataStores } from "../../lib/bloxadmin";
import debounce from "../../lib/debounce";
import BaseTable from "../general/BaseTable.vue";

interface Props {
  gameIdentifier: string
}

const props = defineProps<Props>();

const loading = ref<boolean>(false);
const prefix = ref<string>("");
const datastores = ref<DataStore[]>([]);
const nextPageCursor = ref<string | undefined>(undefined);

const search = debounce(() => !loading.value && update(), 500);

const update = async () => {
  loading.value = true;

  const body = await getDataStores(props.gameIdentifier, prefix.value);

  if (!body.body) {
    loading.value = false;
    return;
  }

  datastores.value = body.body.datastores;
  nextPageCursor.value = body.body.nextPageCursor;

  loading.value = false;
};

const loadMore = async () => {
  if (!nextPageCursor.value) return;

  loading.value = true;

  const body = await getDataStores(props.gameIdentifier, prefix.value, nextPageCursor.value);

  if (!body.body) {
    loading.value = false;
    return;
  }

  datastores.value = [...datastores.value, ...body.body.datastores];
  nextPageCursor.value = body.body.nextPageCursor;

  loading.value = false;
};

// onMounted(update);
</script>
<style scoped lang="scss">
.datastore-list {
  background-color: var(--foreground);

  overflow: hidden;

  display: flex;
  flex-direction: column;

  &:not(.datastore-list-maximized) {
    border-radius: 4px;

    border: 1px solid var(--border);

    box-shadow: 0 4px 8px rgba(black, 0.025);

    max-height: 512px;
  }

  .datastore-list-header {
    border-bottom: 1px solid var(--border);

    z-index: 1;

    padding: 16px;

    display: flex;
    align-items: center;
    gap: 8px;

    p.header-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-title);

      flex-grow: 1;
    }
  }
}

.bar {
  height: 32px;

  display: flex;

  input.bar-input {
    height: 100%;
    width: 256px;

    padding: 0 16px;

    background-color: var(--background);

    border-radius: 4px 0 0 4px;

    font-size: 14px;
  }

  .bar-button {
    background-color: var(--primary);

    width: 32px;
    height: 100%;

    display: grid;
    place-items: center;

    border-radius: 0 4px 4px 0;

    cursor: pointer;

    color: var(--primary-text-title);

    &:hover {
      color: var(--white);
    }
  }
}

.base-table {
  border-radius: 4px;

  border: 1px solid var(--border);

  background-color: var(--foreground);

  box-shadow: 0 4px 8px rgba(black, 0.025);

  .base-table-placeholder {
    aspect-ratio: 4 / 1;

    background-color: var(--background);

    border-bottom: 1px solid var(--border);

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

  .base-table-footer {
    display: flex;
    gap: 8px;

    padding: 16px;

    > :first-child {
      margin-right: auto;
    }
  }

  .base-table-header {
    display: flex;
    align-items: center;
    gap: 8px;

    padding: 16px;

    .header-text {
      flex-grow: 1;

      line-height: 1;

      p.base-table-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-title);

        &:not(:last-child) {
          margin-bottom: 4px;
        }
      }

      p.base-table-description {
        font-size: 12px;
        color: var(--text);
      }
    }
  }
}
</style>
