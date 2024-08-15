<template>
  <Container>

    <BaseTable :columns="columns" :paginated="paginated" :loading="loading" @update="update" title="Games">
      <template v-slot:default="{ row }: { row: AdminGame, index: number }">
        <tr class="table-row">
          <td class="info">
            <RouterLink class="name" :to=" { name: 'Admin Game', params: { gameIdentifier: row.id } } ">
              {{ row.name }}
            </RouterLink>
            <p>Game: <code>{{ row.id }}</code></p>
            <p>Place: <code>{{ row.rootPlaceId }}</code></p>
          </td>
          <td>
            {{ row.serverCount }}
          </td>
          <td>
            <div class="features">
              <div class="feature" :title=" feature " :style="
                { backgroundColor: FEATURE_INFO[feature]?.backgroundColor, color: FEATURE_INFO[feature]?.color, }
              " v-for="     feature     in     row.features     " :key=" feature ">
                {{ FEATURE_INFO[feature]?.name || feature || "empty" }}
              </div>
            </div>
          </td>
          <td>
            <DisplayPlayer :player=" row.ownerPlayer " :gameIdentifier=" row.id " />
          </td>
          <td>
            <RouterLink v-if=" row.ownerGroup " class="name"
              :to=" { name: 'Group', params: { groupIdentifier: row.ownerGroup.id } } ">
              {{ row.ownerGroup.name }}
            </RouterLink>
            <i v-else>None</i>
          </td>
        </tr>
      </template>
    </BaseTable>
  </Container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import BaseTable, { Column } from "../../components/general/BaseTable.vue";
import Container from "../../components/general/Container.vue";
import DisplayPlayer from "../../components/players/DisplayPlayer.vue";
import { AdminGame, GameFeature, Paginated, getGamesAdmin } from "../../lib/bloxadmin";

const props = defineProps<{
  features?: GameFeature[];
}>();

const FEATURE_INFO: Record<GameFeature, {
  name: string;
  color?: string;
  backgroundColor?: string;
}> = {
  [GameFeature.ErrorOccurrenceTracking]: {
    name: "Error Occurrence Tracking",
    color: "var(--white)",
    backgroundColor: "indianred",
  },
  [GameFeature.ExtendedChatLogs]: {
    name: "Extended Chat Logs",
    color: "var(--white)",
    backgroundColor: "dodgerblue",
  },
  [GameFeature.ExtendedSessionLogs]: {
    name: "Extended Session Logs",
    color: "var(--white)",
    backgroundColor: "seagreen",
  },
  [GameFeature.FasterIngestion]: {
    name: "Faster Ingestion",
    color: "var(--white)",
    backgroundColor: "darkorange",
  },
  [GameFeature.ShorterMetricsInterval]: {
    name: "Shorter Metrics Interval",
    color: "var(--white)",
    backgroundColor: "darkorchid",
  },
  [GameFeature.DatastoreViewer]: {
    name: "Datastore Viewer",
    color: "var(--white)",
    backgroundColor: "darkslateblue",
  },
  [GameFeature.Block]: {
    name: "Extended Promo Codes",
    color: "var(--white)",
    backgroundColor: "red",
  },
  [GameFeature.ExtendedPromoCodes]: {
    name: "Extended Promo Codes",
    color: "var(--white)",
    backgroundColor: "darkslateblue",
  },
  [GameFeature.Actions]: {
    name: "Actions",
    color: "var(--white)",
    backgroundColor: "darkslateblue",
  },
}

const columns: Column[] = [
  { text: "Info", },
  { text: "Servers" },
  { text: "Features", },
  { text: "Owning Player" },
  { text: "Owning Group" },
]

const paginated = ref<Paginated<AdminGame> | null>(null);
const loading = ref<boolean>(false);

const update = async (skip: number, limit: number): Promise<void> => {
  loading.value = true;
  const { body } = await getGamesAdmin(skip, limit, props.features);

  if (!body) {
    // To-do: Error;

    return;
  }

  paginated.value = body;
  loading.value = false;
};
</script>

<style lang="scss" scoped>
.info {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;

  .name {
    font-weight: bold;
  }

  code {
    background-color: var(--background);
    padding: 0.25em 0.5em;
    border-radius: 4px;
  }

}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  flex-direction: row;
  flex-wrap: wrap;
}

.feature {
  font-size: 0.8rem;
  padding: 0.125em 0.375em;
  border-radius: 24px;
  background-color: #f0f0f0;
  color: var(--black);
}
</style>
