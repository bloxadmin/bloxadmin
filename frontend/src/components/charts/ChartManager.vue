<template>
  <AddChartModal 
    :gameIdentifier="props.gameIdentifier" 
    :duration="selectedDuration" 
    :interval="selectedInterval" 
    @add="addChart"
  />

  <div class="chart-manager">
    <div class="chart-manager-header">
      <BaseButton theme="primary" :disabled="loading" @click="openModal">
        <template #icon>
          <Plus :size="16" />
        </template>

        Add chart
      </BaseButton>

      <BaseIndicator v-if="loading">
        <Loading />
      </BaseIndicator>

      <IconButton v-else theme="secondary" :disabled="charts.length === 0" @click="updateCharts">
        <RefreshCw :size="16" />
      </IconButton>
      
      <BaseDropdown title="Interval">
        <template v-slot:default="{ open }">
          <BaseButton :active="open" :disabled="loading" theme="secondary" reverse>
            <template #icon>
              <ChevronUp :size="16" v-if="open" />

              <ChevronDown :size="16" v-else />
            </template>
          
            {{ selectedInterval }}
          </BaseButton>
        </template>

        <template #content>
          <BaseDropdownItem v-for="interval in filteredIntervals" :active="interval === selectedInterval" @click="selectInterval(interval)" :key="interval">{{ interval }}</BaseDropdownItem>
        </template>
      </BaseDropdown>      
      
      <BaseDropdown title="Duration">
        <template v-slot:default="{ open }">
          <BaseButton :active="open" :disabled="loading" theme="secondary" reverse>
            <template #icon>
              <ChevronUp :size="16" v-if="open" />

              <ChevronDown :size="16" v-else />
            </template>
          
            {{ selectedDuration }}
          </BaseButton>
        </template>

        <template #content>
          <BaseDropdownItem v-for="duration in durations" :active="duration.text === selectedDuration" @click="selectDuration(duration.text)" :key="duration.text">{{ duration.text }}</BaseDropdownItem>
        </template>
      </BaseDropdown>
    </div>

    <div class="chart-manager-body" ref="element" :class="{ disabled: loading }">
      <ChartCard v-for="chart in charts" v-bind="chart" group="chart-manager" :key="chart.identifier" @remove="removeChart(chart.identifier)" />

      <template v-if="charts.length === 0">
        <div class="chart-manager-placeholder">
          <p class="placeholder-text">No charts have been added.</p>

          <BaseButton theme="secondary" @click="resetCharts">
            <template #icon>
              <RefreshCcw :size="16" />
            </template>
            
            Reset to default
          </BaseButton>
        </div>

        <div class="chart-manager-placeholder" />
      </template>

      <template v-else-if="charts.length % 2 !== 0">
        <div class="chart-manager-placeholder">
          <BaseButton theme="secondary" @click="openModal">
            <template #icon>
              <Plus :size="16" />
            </template>
            
            Add chart
          </BaseButton>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp, Plus, RefreshCcw, RefreshCw } from "lucide-vue-next";
import Sortable from "sortablejs";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Chart, ChartOptions, DEFAULT_DURATION, DEFAULT_INTERVAL, Duration, Interval, Series, StatisticIdentifier, durations, getCharts, intervals } from "../../lib/bloxadmin";
import useModalStore from "../../stores/modal";
import AddChartModal from "../charts/AddChartModal.vue";
import ChartCard from "../charts/ChartCard.vue";
import BaseButton from "../general/BaseButton.vue";
import BaseDropdown from "../general/BaseDropdown.vue";
import BaseDropdownItem from "../general/BaseDropdownItem.vue";
import BaseIndicator from "../general/BaseIndicator.vue";
import IconButton from "../general/IconButton.vue";
import Loading from "../general/Loading.vue";

interface Props {
  gameIdentifier: string,
  defaultCharts: StatisticIdentifier[][]
  serverIdentifier?: string,
  now?: string,
}

const props = defineProps<Props>();

const selectedDuration = ref<string>(DEFAULT_DURATION.text);
const selectedInterval = ref<Interval>(DEFAULT_INTERVAL);

const loading = ref<boolean>(false);

const element = ref<HTMLElement | null>(null);

let instance: Sortable;

// To-do: Endpoint
let key = "charts:" + props.gameIdentifier;
if (props.serverIdentifier) key = key + ":server";

const getSavedCharts = (): Chart[] => {
  const value = localStorage.getItem(key);
  const savedCharts: StatisticIdentifier[][] = value ? JSON.parse(value) : props.defaultCharts;

  return savedCharts.map(savedChart => {
    return {
      identifier: crypto.randomUUID(),
      series: savedChart.map(statisticIdentifier => {
        return { name: statisticIdentifier };
      }),
      annotations: [],
    }
  });
};

const setSavedCharts = (savedCharts?: StatisticIdentifier[][]): void => {
  savedCharts = savedCharts || charts.value.map(chart => {
    return chart.series.map(statistic => statistic.name as StatisticIdentifier);
  });

  const value = JSON.stringify(savedCharts);
  localStorage.setItem(key, value);
};

const resetCharts = () => {
  setSavedCharts(props.defaultCharts);

  charts.value = getSavedCharts();

  updateCharts();
};

const charts = ref<Chart[]>(getSavedCharts());

const openModal = (): void => {
  const { open } = useModalStore();
  open("add-chart");
};

const selectDuration = (text: string): void => {
  const duration = durations.find(duration => duration.text === text) as Duration;
  const [ min, max ] = duration.interval;
  selectedDuration.value = text;
  
  const intervalIndex = intervals.findIndex(interval => interval === selectedInterval.value);
  const interval = intervals[Math.max(Math.min(intervalIndex, max), min)];
  selectedInterval.value = interval;

  updateCharts();
};

const selectInterval = (interval: Interval): void => {
  selectedInterval.value = interval;

  updateCharts();
};

const filteredIntervals = computed(() => {
  const [ min, max ] = (durations.find(duration => duration.text === selectedDuration.value) as Duration).interval;
  return intervals.slice(min, max + 1);
});

const removeChart = (chartIdentifier: string): void => {
  const chartIndex = charts.value.findIndex(chart => chart.identifier === chartIdentifier);
  if (chartIndex === -1) return;
  charts.value.splice(chartIndex, 1);

  setSavedCharts();
};

const moveChart = (previousIndex: number, index: number): void => {
  const [ chart ] = charts.value.splice(previousIndex, 1);
  charts.value.splice(index, 0, chart);

  setSavedCharts();
};

const addChart = (statisticIdentifiers: StatisticIdentifier[] | StatisticIdentifier): void => {
  const getSeries = (statisticIdentifier: StatisticIdentifier): Series => { 
    return { name: statisticIdentifier };
  };

  const series = typeof(statisticIdentifiers) === "string" ? [ getSeries(statisticIdentifiers) ] : statisticIdentifiers.map(getSeries);

  const identifier = crypto.randomUUID();
  charts.value.unshift({ identifier, series, annotations: [] });

  setSavedCharts();
  updateCharts();
};

const updateCharts = async (): Promise<void> => { 
  loading.value = true;

  if (charts.value.length === 0) {
    loading.value = false;

    return;
  }

  const stop = props.now ? new Date(props.now) : new Date();
  const start = (durations.find(duration => duration.text === selectedDuration.value) as Duration).getStart(stop);
  const interval = selectedInterval.value;

  const chartOptions: ChartOptions[] = [];

  for (let index = 0; index < charts.value.length; index++) {
    const chart = charts.value[index];

    for (const series of chart.series) {
      const chartOption: ChartOptions = {
        name: chart.identifier + ":" + series.name,
        stat: series.name as StatisticIdentifier,
        interval: interval,
        start: start.toISOString(),
			  stop: stop.toISOString() 
      }

      if (props.serverIdentifier) chartOption.serverId = props.serverIdentifier;
      chartOptions.push(chartOption);
    }
  };

  const { body } = await getCharts(props.gameIdentifier, chartOptions);

  if (!body) {
    // To-do: Error

    return;
  }

  for (let index = 0; index < body.charts.length; index++) {
    const { name, data, displayValue, unit } = body.charts[index];
    
    const [ identifier, statistic ] = name.split(":");

    const chart = charts.value.find(chart => chart.identifier === identifier);
    if (!chart) continue;

    chart.annotations = body.annotations;

    const series = chart.series.find(series => series.name === statistic) as Series;
    series.data = data;
    series.unit = unit;
    series.displayValue = displayValue;
  }

  loading.value = false;
};

watch(() => props.gameIdentifier, () => {
  charts.value = getSavedCharts();
  updateCharts();
});

onMounted(() => {
  updateCharts();

  instance = new Sortable(element.value as HTMLElement, {
    handle: ".handle",
    draggable: ".chart-card",
    onEnd: ({ oldDraggableIndex, newDraggableIndex }) => moveChart(oldDraggableIndex as number, newDraggableIndex as number)
  });
});

onBeforeUnmount(() => {
  instance.destroy();
});
</script>

<style scoped lang="scss">
.chart-manager {
  .chart-manager-header {
    display: flex;

    margin-bottom: 16px;

    > :not(:last-child) {
      margin-right: 8px;
    }

    > :first-child {
      margin-right: auto;
    }
  }

  .chart-manager-body {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .chart-manager-placeholder {
      height: 313px;

      border-radius: 4px;

      border: 4px dashed var(--border);

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      padding: 0 16px;

      .placeholder-text {
        font-size: 14px;
        color: var(--text);
        line-height: 1.5;

        text-align: center;

        margin-bottom: 16px;
      }
    }
  }
}
</style>
