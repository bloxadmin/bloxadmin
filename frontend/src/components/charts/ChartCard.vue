<template>
  <div class="chart-card" :class="{ disabled }">
    <div class="chart-card-header">
      <div class="chart-card-icon">
        <BarChart2 />
      </div>

      <div class="header-text">
        <p class="chart-card-description">{{ description }}</p>

        <p class="chart-card-title">{{ title }}</p>
      </div>

      <div class="header-actions" v-if="!standalone">
        <IconButton theme="primary" @click="remove">
          <Trash :size="16" />
        </IconButton>

        <IconButton class="handle">
          <GripHorizontal :size="16" />
        </IconButton>
      </div>
    </div>

    <ApexCharts :series="series" :options="options" />
  </div>
</template>

<script lang="ts" setup>
import { ApexOptions } from "apexcharts";
import { BarChart2, GripHorizontal, Trash } from "lucide-vue-next";
import { computed } from "vue";
import { Annotation, Series, Stack, StackIdentifier, StatisticIdentifier, Unit, getStack, getStatistic } from "../../lib/bloxadmin";
import IconButton from "../general/IconButton.vue";
import ApexCharts from "./ApexCharts.vue";

interface Props {
  identifier: string,
  series: Series[],
  annotations: Annotation[],
  group?: string,
  disabled?: boolean,
  standalone?: boolean
}

interface Emits {
  (e: "remove"): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const defaultOptions = (): ApexOptions => ({
  annotations: {
    xaxis: [],
  },
  xaxis: {
    type: "datetime",
    tooltip: {
      enabled: false
    },
    crosshairs: {
      stroke: {
        dashArray: 0,
        color: "var(--zinc-200)",
        width: 2
      }
    },
    axisBorder: {
      show: false
    },
    axisTicks: {
      color: "var(--zinc-200)"
    },
    labels: {
      style: {
        cssClass: "chart-card-label"
      },
      datetimeUTC: false,
      datetimeFormatter: {
        day: "MMM. d",
        hour: "h TT",
        minute: "h:mm TT"
      }
    }
  },
  chart: {
    toolbar: {
      show: false
    },
    type: "area",
    id: props.identifier,
    group: props.group,
    height: 224,
    fontFamily: "Inter, sans-serif",
    redrawOnParentResize: true,
    foreColor: "var(--secondary)",
    // To-do: Zoom
    zoom: {
      enabled: true
    }
  },
  grid: {
    borderColor: "var(--border)",
    strokeDashArray: 4,
    xaxis: {
      lines: {
        show: false
      },
    }
  },
  stroke: {
    lineCap: "round",
    width: 1
  },
  // To-do: Add more colors or limit the number of stacked statistics
  colors: ["#ef4444", "#f97316", "#eab308", "#10b981", "#3b82f6", "#a855f7"],
  fill: {
    gradient: {
      gradientToColors: ['var(--foreground)', 'var(--foreground)', 'var(--foreground)', 'var(--foreground)', 'var(--foreground)', 'var(--foreground)'],
    }
  },
  dataLabels: {
    enabled: false
  },
  legend: {
    position: "top"
  },
  tooltip: {
    x: {
      formatter: (value: number) => {
        return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" });
      }
    }
  }
});

const annotations = computed((): XAxisAnnotations[] => {
  const firstDate = props.series[0] && props.series[0].data ? props.series[0].data[0]?.[0] : undefined;
  const first = firstDate ? new Date(firstDate).getTime() : undefined;
  return props.annotations.map((a) => {
    const start = new Date(a.start).getTime();
    const stop = a.stop ? new Date(a.stop).getTime() : undefined;

    return {
      x: first && first > start  ? first : start,
      x2: stop,
      label: {
        position: "top",
        orientation: "horizontal",
        textAnchor: first && first > start ? "start" : "middle",
        text: a.title,
        offsetX: stop ? 6 : 0,
        offsetY: -1,
        borderWidth: 1,
        borderRadius: 4,
        click: () => {
          window.open(a.link, "_blank");
        },
      }
    }
  });
});

const series = computed((): ApexAxisChartSeries => {
  return props.series.map(series => {
    let { name, data } = series;
    let { text } = getStatistic(name as StatisticIdentifier);

    // To-do: ?
    if (!data) data = [];

    return { name: text, data };
  });
});

// To-do: ?
const defaultFormatY = (y: number, _unit?: Unit): string => y?.toLocaleString() ?? 0;

const options = computed((): ApexOptions => {
  // To-do: ?
  const { formatY } = getStatistic(props.series[0].name as StatisticIdentifier);

  const options = defaultOptions();

  options.annotations = {
    xaxis: annotations.value
  }

  options.yaxis = {
    labels: {
      formatter: formatY || defaultFormatY
    }
  };

  return options;
});

const remove = (): void => emit("remove");

// To-do: ?
const title = computed(() => {
  const { stackIdentifier, formatY } = getStatistic(props.series[0].name as StatisticIdentifier);

  // Formatted most recent data value for statistics
  if (props.series.length === 1) {
    const format = formatY || defaultFormatY;
    const series = props.series[0];

    if (series.displayValue !== undefined)
      return format(series.displayValue, series.unit);

    if (!series.data || series.data.length === 0)
      return "No data";

    return format(series.data[series.data.length - 1][1], series.unit);
  }

  // Stack text for stacks
  return getStack(stackIdentifier as StackIdentifier).text;
});

// To-do: ?
const description = computed(() => {
  if (props.series.length === 1) {
    const statistic = getStatistic(props.series[0].name as StatisticIdentifier);

    // Formatted statistic text for stacks
    return statistic.stackIdentifier ? (getStack(statistic.stackIdentifier) as Stack).format(statistic.text) : statistic.text;
  }

  return "Stack";
});
</script>

<style lang="scss" scoped>
.chart-card {
  border-radius: 4px;

  border: 1px solid var(--border);

  background-color: var(--foreground);

  box-shadow: 0 4px 8px rgba(black, 0.025);

  height: 313px;

  &:not(:hover) .chart-card-header .header-actions {
    display: none;
  }

  .chart-card-header {
    display: flex;
    align-items: flex-start;

    padding: 16px;

    .header-actions {
      display: flex;

      > :first-child {
        margin-right: 8px;
      }
    }

    .chart-card-icon {
      height: 40px;
      width: 40px;

      background-color: var(--primary);

      margin-right: 16px;

      display: grid;
      place-items: center;

      border-radius: 4px;

      color: var(--white);
    }

    .header-text {
      flex-grow: 1;

      line-height: 1;

      .chart-card-description {
        font-size: 12px;
        color: var(--text);

        margin-bottom: 4px;
      }

      .chart-card-title {
        font-size: 24px;
        color: var(--text-title);
        font-weight: 700;
      }
    }
  }
}

.chart-card-tooltip {
  background-color: red;
}
</style>
