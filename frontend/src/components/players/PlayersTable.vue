<template>
  <BaseTable :columns="columns" :paginated="paginated" :loading="loading" @update="update" title="Players" :defaultLimit="25">
    <template v-slot:default="{ row }: { row: Player }">
      <!-- To-do: ModeratorActionTableRow -->
      <tr class="table-row">
        <td>
          <DisplayPlayer :player="row" />
        </td>

        <td>
          <p class="row-text">{{ row.playtime < 3600 ? (row.playtime / 60 / 60).toFixed(2) : Math.round(row.playtime / 60 / 60)}} h</p>
        </td>
      </tr>
    </template>

    <template #header>
      <div class="bar">
        <input class="bar-input" type="text" v-model="input" placeholder="Search..." @keyup="search" />

        <div class="bar-button" :class="{ disabled: loading }" @click="search">
          <Search :size="16" />
        </div>
      </div>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { Search } from "lucide-vue-next";
import { ref } from "vue";
import { Paginated, Player, getPlayers } from "../../lib/bloxadmin";
import debounce from "../../lib/debounce";
import BaseTable, { Column } from "../general/BaseTable.vue";
import DisplayPlayer from "./DisplayPlayer.vue";

interface Props {
  gameIdentifier: string
}

const columns: Column[] = [
  { text: "Player", fill: true },
  { text: "Playtime", reverse: true },
]

const props = defineProps<Props>();

const input = ref<string>("");
const loading = ref<boolean>(false);
const paginated = ref<Paginated<Player> | null>(null);

// Unfortunately, we have to save the previous limit
let cachedLimit: number;

const search = debounce(() => !loading.value && update(0, cachedLimit), 500);

const update = async (skip: number, limit: number): Promise<void> => {
  loading.value = true;

  cachedLimit = limit;

  const { body } = await getPlayers(props.gameIdentifier, limit, skip, input.value);

  if (!body) {
    // To-do: Error;

    return;
  }

  paginated.value = body;

  loading.value = false;
};
</script>

<style lang="scss" scoped>
.table-row td:nth-child(n + 2) {
  text-align: right;
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
</style>
