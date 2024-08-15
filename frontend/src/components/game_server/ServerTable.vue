<template>
  <BaseTable :columns="columns" :paginated="!hasChartPermissions || series.length > 0 ? paginated : null" :loading="loading" @update="update" title="Servers">
    <template #header>
      <!-- <BaseDropdown title="Statistic" v-if="hasChartPermissions">
        <template v-slot:default="{ open }">
          <BaseButton reverse :active="open" :disabled="loading">
            <template #icon>
              <ChevronUp :size="16" v-if="open" />

              <ChevronDown :size="16" v-else />
            </template>

            {{ statistics[selectedStatistic].text }}
          </BaseButton>
        </template>

        <template #content>
          <BaseDropdownItem v-for="(statistic, index) in statistics" @click="selectStatistic(index)" :active="index === selectedStatistic">{{ statistic.text }}</BaseDropdownItem>
        </template>
      </BaseDropdown> -->
    </template>

    <template v-slot:default="{ index, row }: { row: Server, index: number }">
      <ServerTableRow :server="row" :series="hasChartPermissions ? series[index] : undefined" :key="row.id" />
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { ChartOptions, Paginated, Permissions, Series, Server, StatisticIdentifier, getCharts, getServers, getStatistic } from "../../lib/bloxadmin";
import { hasPermissionSync } from "../../lib/permissions";
import BaseButton from "../general/BaseButton.vue";
import BaseDropdown from "../general/BaseDropdown.vue";
import BaseDropdownItem from "../general/BaseDropdownItem.vue";
import BaseTable, { Column } from "../general/BaseTable.vue";
import ServerTableRow from "./ServerTableRow.vue";

const statistics: { text: string, identifier: StatisticIdentifier }[] = [ 
  { text: "Online players", identifier: "onlinePlayers.onlinePlayers" },
  // { text: "Heartbeat time", identifier: "heartbeat.heartbeatTimeMs" },
  // { text: "Lua heap memory", identifier: "memory.luaHeap" },
  // { text: "Total memory", identifier: "memory.total" }
];

interface Props {
  gameIdentifier: string
}

const props = defineProps<Props>();

const loading = ref<boolean>(false);
const paginated = ref<Paginated<Server> | null>(null);

const series = ref<Series[]>([]);
const selectedStatistic = ref<number>(0);

const hasChartPermissions = computed(() => {
  return hasPermissionSync(props.gameIdentifier, [Permissions.Servers.Metrics.Read]);
})

const columns = computed((): Column[] => {
  if (hasChartPermissions.value)
    return [
      { text: "Server", fill: true },
      { text: "Place version", reverse: true },
      { text: statistics[selectedStatistic.value].text, reverse: true }
    ]
  return [
    { text: "Server", fill: true },
    { text: "Place version", reverse: true }
  ]
});

const selectStatistic = (index: number) => {
  selectedStatistic.value = index;

  updateCharts();
};

// To-do: Charts functions
const updateCharts = async (): Promise<void> => {
  if (!paginated.value || paginated.value.data.length === 0 || !hasChartPermissions.value) {
    series.value = [];

    return;
  }

  const { data } = paginated.value;

  loading.value = true;

  const stop = new Date();
  const start = new Date(stop);
  start.setHours(stop.getHours() - 1);

  const statistic = getStatistic(statistics[selectedStatistic.value].identifier);

  const chartsOptions = [];

  for (let index = 0; index < data.length; index++) {
    const { id } = data[index];

    const chartOptions: ChartOptions = {
      name: index.toString(),
      stat: statistic.identifier,
      interval: "5m",
      serverId: id,
      start: start.toISOString(),
      stop: stop.toISOString()
    };

    chartsOptions.push(chartOptions);
  }

  const { body } = await getCharts(props.gameIdentifier, chartsOptions);

  if (!body) {
    // To-do: Error

    return;
  }

  series.value = body.charts.sort((a, b) => parseInt(a.name) - parseInt(b.name)).map(result => {
    return { name: statistic.identifier, data: result.data, unit: result.unit, displayValue: result.displayValue };
  });

  loading.value = false;
};

const update = async (skip: number, limit: number): Promise<void> => {
  loading.value = true;

  const { body } = await getServers(props.gameIdentifier, limit, skip);

  if (!body) {
    // To-do: Error;

    return;
  }

  paginated.value = body;

  loading.value = false;

  await updateCharts();
};

watch(() => props.gameIdentifier, () => {
  update(0, paginated.value?.limit || 5);
});
</script>
