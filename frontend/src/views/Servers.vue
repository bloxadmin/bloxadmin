<template>
  <WithPermission :has="[Permissions.Servers.Metrics.Read]">
    <div id="charts">
      <ChartManager :gameIdentifier="gameIdentifier" :defaultCharts="defaultCharts" />
    </div>
  </WithPermission>

  <WithPermission :has="[Permissions.Servers.Servers.List]">
    <div id="servers">
      <ServerTable :gameIdentifier="gameIdentifier" />
    </div>
  </WithPermission>
</template>

<script setup lang="ts">
import { watch } from "vue";
import ChartManager from "../components/charts/ChartManager.vue";
import ServerTable from "../components/game_server/ServerTable.vue";
import WithPermission from "../components/misc/WithPermission.vue";
import { Permissions, StatisticIdentifier } from "../lib/bloxadmin";

interface Props {
  gameIdentifier: string
}

const props = defineProps<Props>();

watch(() => props.gameIdentifier, () => {
  console.log(props.gameIdentifier);
});

const defaultCharts: StatisticIdentifier[][] = [
  ["onlinePlayers.onlinePlayers"],
  ["activeServers.activeServers"],
  ["playerJoins.desktop", "playerJoins.mobile", "playerJoins.console", "playerJoins.unknown"],
  ["playerRetention.new", "playerRetention.returning"]
];
</script>
