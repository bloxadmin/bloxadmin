<template>
  <BaseTable :columns="columns" :paginated="paginated" :loading="loading" @update="update" title="Sessions">
    <!-- To-do: SessionTableRow -->
    <template v-slot:default="{ row }: { row: Session }">
      <tr class="table-row" :key="row.sessionId">
        <td v-if="row.player">
          <DisplayPlayer :player="row.player" />
        </td>

        <td v-if="playerIdentifier">
          <RouterLink :to="{ name: 'Server', params: { serverIdentifier: row.serverId } }" class="row-link" :title="row.serverId">{{ row.serverId }}</RouterLink>
        </td>
        
        <td>
          <p class="row-title" v-if="row.leftAt">{{ formatDuration(row.playTime) }}</p>
          <p class="row-title" v-else>
            <Length :from="row.joinedAt" />
          </p>
        </td>

        <td :title="row.joinedAt">
          <p class="row-title">{{ new Date(row.joinedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) }}</p>

          <p class="row-description">{{ new Date(row.joinedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) }}</p>
        </td>

        <td :title="row.leftAt">
          <template v-if="row.leftAt">
            <p class="row-title">{{ new Date(row.leftAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) }}</p>

            <p class="row-description">{{ new Date(row.leftAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) }}</p>
          </template>

          <div class="indicator" v-else>Online</div>
        </td>
      </tr>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getServerSessions, getSessions, Paginated, Session } from "../../lib/bloxadmin";
import { formatDuration } from "../../lib/format";
import BaseTable, { Column } from "../general/BaseTable.vue";
import Length from "../general/Length.vue";
import DisplayPlayer from "./DisplayPlayer.vue";

interface Props {
  gameIdentifier: string,
  playerIdentifier?: string,
  serverIdentifier?: string,
}

const props = defineProps<Props>();

const loading = ref<boolean>(false);
const paginated = ref<Paginated<Session> | null>(null);

const columns: Column[] = props.playerIdentifier ? [
  { text: "Server", fill: true },
  { text: "Duration", minWidth: "5rem", center: true },
  { text: "Joined at",  },
  { text: "Left at",  },
] : [
  { text: "Player", fill: true },
  { text: "Duration", minWidth: "5rem", center: true },
  { text: "Joined at", },
  { text: "Left at", },
]

const requestData = (skip: number, limit: number) => {
  if (props.playerIdentifier) {
    return getSessions(props.gameIdentifier, props.playerIdentifier, limit, skip);
  } else if (props.serverIdentifier) {
    return getServerSessions(props.gameIdentifier, props.serverIdentifier, limit, skip);
  }

  throw new Error("Either playerIdentifier or serverIdentifier must be provided");
}

const update = async (skip: number, limit: number): Promise<void> => {
  loading.value = true;

  const { body } = await requestData(skip, limit);

  if (!body) {
    // To-do: Error;

    return;
  }

  paginated.value = body;

  loading.value = false;
};
</script>

<style lang="scss" scoped>
.table-row td:nth-child(2) {
  text-align: center;
}

// To-do: Indicator component
.indicator {
  height: 24px;

  background-color: var(--success-background);

  border-radius: 12px;

  font-size: 14px;
  color: var(--success);
  line-height: 1;
  font-weight: 500;

  display: inline-flex;
  align-items: center;

  padding: 0 12px 0 8px;

  position: relative;

  &::before {
    content: "";

    height: 8px;
    width: 8px;

    background-color: var(--success);

    margin-right: 12px;

    border-radius: 50%;
  }
}
</style>
