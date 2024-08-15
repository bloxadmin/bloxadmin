<template>
  <Modal identifier="add-chart">
    <div class="add-chart-modal">
      <div class="add-chart-modal-side-bar">
        <div class="side-bar-header">
          <div class="header-text">
            <p class="side-bar-title">Stack</p>

            <p class="side-bar-description">Overlay multiple charts</p>
          </div>
          
          <BaseDropdown title="Stack">
            <template v-slot:default="{ open }">
              <BaseButton reverse :active="open" :disabled="loading">
                <template #icon>
                  <ChevronUp :size="16" v-if="open" />

                  <ChevronDown :size="16" v-else />
                </template>
                
                {{ stacks.find(stack => stack.identifier === selectedStackIdentifier)?.text || "None" }}
              </BaseButton>
            </template>

            <template #content>
              <BaseDropdownItem @click="selectStackIdentifier(null)" :active="!selectedStackIdentifier">None</BaseDropdownItem>

              <BaseDropdownItem v-for="stack in stacks" @click="selectStackIdentifier(stack.identifier)" :active="stack.identifier === selectedStackIdentifier" :key="stack.identifier">{{ stack.text }}</BaseDropdownItem>
            </template>
          </BaseDropdown>
        </div>

        <div class="side-bar-input">
          <input type="text" placeholder="Search..." v-model="input">

          <div class="input-icon">
            <Search :size="16" />
          </div>
        </div>

        <div class="side-bar-body" :class="{ disabled: loading }">
          <Component v-for="statistic in filteredStatistics" :is="selectedStackIdentifier ? Checkbox : RadioButton" :key="statistic.identifier" v-model="(selectedStatisticIdentifiers as string)" :value="statistic.identifier">{{ statistic.stackIdentifier && !selectedStackIdentifier ? getStack(statistic.stackIdentifier).format(statistic.text) : statistic.text }}</Component>
        </div>
      </div>

      <div class="add-chart-modal-preview">
        <div class="preview-header">
          <BaseIndicator v-if="loading">
            <Loading />
          </BaseIndicator>

          <IconButton v-else theme="secondary" @click="updateChart">
            <RefreshCw :size="16" />
          </IconButton>

          <IconButton theme="secondary" @click="close">
            <X :size="16" />
          </IconButton>
        </div>

        <ChartCard v-if="series && annotations" standalone identifier="preview" :series="series" :disabled="loading" :annotations="annotations" />
        
        <div class="preview-footer">
          <BaseButton theme="primary" reverse @click="add">
            <template #icon>
              <ArrowRight :size="16" />
            </template>
            
            Add
          </BaseButton>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ArrowRight, ChevronDown, ChevronUp, RefreshCw, Search, X } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { Annotation, ChartOptions, Duration, Interval, Series, StackIdentifier, Statistic, StatisticIdentifier, durations, getCharts, getStack, getStatistic, stacks, statistics } from "../../lib/bloxadmin";
import useModalStore from "../../stores/modal";
import BaseButton from "../general/BaseButton.vue";
import BaseDropdown from "../general/BaseDropdown.vue";
import BaseDropdownItem from "../general/BaseDropdownItem.vue";
import BaseIndicator from "../general/BaseIndicator.vue";
import Checkbox from "../general/Checkbox.vue";
import IconButton from "../general/IconButton.vue";
import Loading from "../general/Loading.vue";
import Modal from "../general/Modal.vue";
import RadioButton from "../general/RadioButton.vue";
import ChartCard from "./ChartCard.vue";

interface Props {
  interval: Interval,
  duration: string,
  serverIdentifier?: string,
  gameIdentifier: string
}

interface Emits {
  (e: "add", statisticIdentifiers: StatisticIdentifier[] | StatisticIdentifier): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { close } = useModalStore();

const input = ref<string | null>(null);
const selectedStackIdentifier = ref<StackIdentifier | null>(null);
const selectedStatisticIdentifiers = ref<Array<StatisticIdentifier> | StatisticIdentifier>("onlinePlayers.onlinePlayers");
const series = ref<Series[] | null>(null);
const annotations = ref<Annotation[] | null>();
const loading = ref<boolean>(false);

const filteredStatistics = computed(() => {
  return statistics
    .filter(statistic => {
      // Remove statistics not from the selected stack
      if (selectedStackIdentifier.value && statistic.stackIdentifier !== selectedStackIdentifier.value) return false;

      // Remove statistics not matching the input
      if (input.value && !statistic.text.toLocaleLowerCase().includes(input.value.toLocaleLowerCase())) return false;

      return true;
    })
    .map(statistic => getStatistic(statistic.identifier))
});

const add = (): void => {
  emit("add", selectedStatisticIdentifiers.value);

  selectedStackIdentifier.value = null;
  selectedStatisticIdentifiers.value = statistics[0].identifier;

  close();
};

const updateChart = async (): Promise<void> => {
  loading.value = true;

  const stop = new Date();
  const start = (durations.find(duration => duration.text === props.duration) as Duration).getStart(stop);
  const interval = props.interval;

  const getChartOption = (statisticIdentifier: StatisticIdentifier): ChartOptions => {
    const chartOption: ChartOptions = {
      name: statisticIdentifier,
      stat: statisticIdentifier,
      interval,
      start: start.toISOString(),
      stop: stop.toISOString() 
    }

    if (props.serverIdentifier) chartOption.serverId = props.serverIdentifier;

    return chartOption;
  };

  let chartOptions: ChartOptions[] = typeof(selectedStatisticIdentifiers.value) === "string" ? [ getChartOption(selectedStatisticIdentifiers.value) ] : selectedStatisticIdentifiers.value.map(getChartOption);

  const { body } = await getCharts(props.gameIdentifier, chartOptions);

  if (!body) {
    // To-do: Error

    return;
  }

  annotations.value = body.annotations;
  series.value = body.charts;

  loading.value = false;
};

const selectStackIdentifier = (stackIdentifier: StackIdentifier | null) => {
  selectedStackIdentifier.value = stackIdentifier;

  if (selectedStackIdentifier.value) selectedStatisticIdentifiers.value = [ (statistics.find(statistic => statistic.stackIdentifier === selectedStackIdentifier.value) as Statistic).identifier ];
  else selectedStatisticIdentifiers.value = selectedStatisticIdentifiers.value[0] as StatisticIdentifier;

  updateChart();
};

watch(selectedStatisticIdentifiers, updateChart);

onMounted(updateChart);
</script>

<style lang="scss" scoped>
.add-chart-modal {
  width: 992px;

  height: 512px;

  background-color: var(--background);

  border-radius: 4px;

  overflow: hidden;

  display: flex;
  align-items: stretch;

  .add-chart-modal-preview {
    padding: 32px;

    flex-grow: 1;

    position: relative;

    display: flex;
    flex-direction: column;
    justify-content: center;

    .preview-header {
      position: absolute;

      display: flex;
      align-items: center;

      right: 16px;
      top: 16px;

      > :not(:last-child) {
        margin-right: 8px;
      }
    }

    .preview-footer {
      position: absolute;

      right: 16px;
      bottom: 16px;
    }
  }

  .add-chart-modal-side-bar {
    width: 384px;

    background-color: var(--foreground);

    border-right: 1px solid var(--border);

    box-shadow: 4px 0 8px rgba(black, 0.025);

    display: flex;
    flex-direction: column;

    overflow: hidden;

    .side-bar-body {
      flex-grow: 1;

      overflow: auto;

      padding: 16px;

      > :not(:last-child) {
        margin-bottom: 16px;
      }
    }

    .side-bar-input {
      height: 48px;

      flex-shrink: 0;

      background-color: var(--background);

      border-bottom: 1px solid var(--border);

      position: relative;

      &:hover .input-icon, &:focus-within .input-icon {
        color: var(--text-active);
      }

      input {
        height: 100%;
        width: 100%;

        font-size: 14px;

        padding: 0 48px 0 16px;

        color: var(--text-input);
      }

      .input-icon {
        position: absolute;

        pointer-events: none;
        
        color: var(--text);

        top: 16px;
        right: 16px;
      }
    }

    .side-bar-header {
      padding-top: 16px;

      border-bottom: 1px solid var(--border);

      box-shadow: 0 4px 8px rgba(black, 0.025);

      padding: 16px;

      display: flex;
      align-items: flex-start;

      .header-text {
        flex-grow: 1;

        line-height: 1;
      
        p.side-bar-title {
          color: var(--text-title);
          font-weight: 500;
          font-size: 14px;

          margin-bottom: 4px;
        }

        p.side-bar-description {
          color: var(--text);
          font-size: 12px;
        }
      }
    }
  }
}
</style>
