<template>
  <div ref="canvas" @dblclick="resetZoom" />
</template>

<script lang="ts" setup>
import ApexCharts, { ApexOptions } from "apexcharts";
import { onMounted, onUnmounted, ref, watch } from "vue";

interface Props {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries,
  options: ApexOptions,
  redrawPaths?: boolean,
  animate?: boolean,
  updateSyncedCharts?: boolean
}

const props = withDefaults(defineProps<Props>(), { updateSyncedCharts: false });

const canvas = ref<HTMLElement | null>(null);

let chart: ApexCharts;

const resetZoom = () => {
  if (chart) {
    if (window && (window as any).Apex && props.options.chart?.group) {
      const instances = (window as any).Apex._chartInstances.filter((i: any) => i.group === 'chart-manager');

      instances.forEach((instance: any) => {
        instance.chart.resetSeries();
      });
    } else {
      chart.resetSeries();
    }
  }
};

const updateSeries = (): void => {
  updateOptions();
  if (chart) chart.updateSeries(props.series, props.animate);
};

const updateOptions = (): void => {
  if (chart) chart.updateOptions(props.options, props.redrawPaths, props.animate, props.updateSyncedCharts);
};

onMounted((): void => {
  let options: ApexOptions = { series: props.series };
  if (props.options) options = { ...options, ...props.options };

  chart = new ApexCharts(canvas.value, options);
  chart.render();
});

onUnmounted((): void => {
  if (chart) chart.destroy();
});

watch(() => props.options, updateOptions, { deep: true });
watch(() => props.series, updateSeries, { deep: true });
</script>
