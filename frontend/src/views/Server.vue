<template>
  <template v-if="server">
    <WithPermission
      :one-of="[Permissions.Servers.Sessions.List, Permissions.Servers.Chat.Read, Permissions.Servers.Actions.Shutdown]">
      <div id="overview">
        <ServerOverview :server="server" :gameIdentifier="gameIdentifier" />
      </div>
    </WithPermission>

    <WithPermission v-if="current" :has="[Permissions.Servers.Metrics.Read]">
      <div id="charts">
        <ChartManager :gameIdentifier="props.gameIdentifier" :serverIdentifier="props.serverIdentifier"
          :defaultCharts="defaultGraphs" :now="server.closedAt" />
      </div>
    </WithPermission>

    <!-- <WithPermission :has="[Permissions.Servers.Metrics.Read]">
      <div id="logs">
        <Logs :game-identifier="props.gameIdentifier" :server-identifier="props.serverIdentifier" />
      </div>
    </WithPermission> -->

    <WithPermission :has="[Permissions.Servers.Sessions.List]">
      <div id="sessions">
        <SessionTable :gameIdentifier="gameIdentifier" :serverIdentifier="serverIdentifier" />
      </div>
    </WithPermission>
  </template>

  <!-- To-do: Loading indicator -->
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ChartManager from "../components/charts/ChartManager.vue";
import ServerOverview from "../components/game_server/ServerOverview.vue";
import Logs from "../components/logging/Logs.vue";
import WithPermission from "../components/misc/WithPermission.vue";
import SessionTable from "../components/players/SessionTable.vue";
import { Permissions, Server, StatisticIdentifier, getServer } from "../lib/bloxadmin";

interface Props {
  serverIdentifier: string,
  gameIdentifier: string
}

const props = defineProps<Props>();

const router = useRouter();

const server = ref<Server | null>(null);

const current = computed(() => {
  const previous = new Date(server.value!.startedAt);
  previous.setDate(previous.getDate() + 3);
  return previous.getTime() > Date.now();
});

const defaultGraphs: StatisticIdentifier[][] = [
  ["onlinePlayers.onlinePlayers"],
  // ["memory.luaHeap"]
];

const updateServer = async (): Promise<void> => {
  server.value = null;

  const { body } = await getServer(props.gameIdentifier, props.serverIdentifier);

  if (!body) {
    router.push({ name: "Servers" });

    return;
  }

  server.value = body;
};

watch(() => props.serverIdentifier, updateServer);

onMounted(updateServer);
</script>
