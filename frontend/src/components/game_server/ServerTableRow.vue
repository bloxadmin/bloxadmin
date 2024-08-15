<template>
  <tr class="table-row">
    <td>
      <RouterLink :to="{ name: 'Server', params: { serverIdentifier: server.id } }" class="row-link">{{ server.id }}</RouterLink>
    </td>

    <td>
      <p class="row-text">{{ server.placeVersion }}</p>
    </td>

    <td v-if="statistic">
      <div class="row-column">
        <p class="row-text">{{ statistic.formatY(series[0].displayValue, series[0].unit) }}</p>

        <ApexCharts :series="series" :options="options" />
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { ApexOptions } from "apexcharts";
import { computed } from "vue";
import { Series, Server, StatisticIdentifier, getStatistic } from "../../lib/bloxadmin";
import ApexCharts from "../charts/ApexCharts.vue";

interface Props {
  server: Server,
  series?: Series
}

const props = defineProps<Props>();

const statistic = computed(() => {
  if (!props.series)
    return null;
  return getStatistic(props.series.name as StatisticIdentifier);
});

const options: ApexOptions =  {
  xaxis: {
    type: "datetime"
  },
  chart: {
    type: "area",
    height: 32,
    width: 64,
    sparkline: {
      enabled: true
    }
  },
  stroke: {
    lineCap: "round",
    width: 1
  },
  colors: ["#ef4444"],
  fill: {
    gradient: {
      gradientToColors: ['var(--foreground)'],
    },
  },
  tooltip: {
    enabled: false
  },
};

const series = computed(() => {
  if (!statistic.value || !props.series)
    return [];

  return [{ 
    name: statistic.value.text, 
    data: props.series.data || [],
    unit: props.series.unit,
    displayValue: props.series.displayValue || 0,
  }];
});
</script>

<style lang="scss" scoped>
td:nth-child(n + 2) {
  text-align: right;
}
</style>
