<template>
  <div class="base-table">
    <div class="base-table-header">
      <div class="header-text">
        <p class="base-table-title">{{ title }}</p>

        <p class="base-table-description">{{ description }}</p>
      </div>

      <slot name="header" />

      <BaseIndicator v-if="loading">
        <Loading />
      </BaseIndicator>

      <IconButton v-else @click="refresh">
        <RefreshCw :size="16" />
        
      </IconButton>
      

    </div>

    <div :class="{ disabled: loading }" class="base-table-body">
      <!-- To-do: Table styles -->
      <table class="table">
        <thead class="table-header">
          <tr>
            <th v-for="column in columns" :style="getColumnStyle(column)">
              <p class="header-text">{{ column.text }}</p>
            </th>
          </tr>
        </thead>

        <tbody v-if="_total > 0">
          <slot
            v-for="(row, index) in paginated?.data || data || []"
            :row="row"
            :index="index"
          />
        </tbody>
      </table>

      <div class="base-table-placeholder" v-if="_total === 0">
        <Cloud :size="16" />

        <p class="placeholder-text">Nothing to see here.</p>
      </div>
    </div>

    <div class="base-table-footer" v-if="paginated !== undefined">
      <BaseDropdown title="Limit" placement="top-start">
        <template v-slot:default="{ open }">
          <BaseButton reverse :active="open" :disabled="loading">
            <template #icon>
              <ChevronDown :size="16" v-if="open" />

              <ChevronUp :size="16" v-else />
            </template>

            {{ selectedLimit }}
          </BaseButton>
        </template>

        <template #content>
          <BaseDropdownItem
            v-for="limit in limits"
            @click="selectLimit(limit)"
            :active="limit === selectedLimit"
            >{{ limit }}</BaseDropdownItem
          >
        </template>
      </BaseDropdown>

      <IconButton :disabled="loading || skip === 0" @click="updateSkip(0)">
        <ChevronFirst :size="16" />
      </IconButton>

      <IconButton
        :disabled="loading || skip === 0"
        @click="updateSkip(skip - selectedLimit)"
      >
        <ChevronLeft :size="16" />
      </IconButton>

      <IconButton
        :disabled="loading || _total === 0 || skip + selectedLimit >= _total"
        @click="updateSkip(skip + selectedLimit)"
      >
        <ChevronRight :size="16" />
      </IconButton>

      <IconButton
        :disabled="loading || _total === 0 || skip + selectedLimit >= _total"
        @click="updateSkip(_total - (_total % selectedLimit))"
      >
        <ChevronLast :size="16" />
      </IconButton>
    </div>
  </div>
</template>

<script lang="ts">
export interface Column {
  text: string;
  reverse?: boolean;
  fill?: boolean;
  minWidth?: string | number;
  center?: boolean;
}
</script>

<script setup lang="ts">
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cloud,
  RefreshCw,
} from "lucide-vue-next";
import { StyleValue, computed, onMounted, ref } from "vue";
import { Paginated } from "../../lib/bloxadmin";
import BaseButton from "./BaseButton.vue";
import BaseDropdown from "./BaseDropdown.vue";
import BaseDropdownItem from "./BaseDropdownItem.vue";
import BaseIndicator from "./BaseIndicator.vue";
import IconButton from "./IconButton.vue";
import Loading from "./Loading.vue";

interface Props {
  title: string;
  paginated?: Paginated<any> | null;
  data?: any[];
  loading: boolean;
  columns: Column[];
  defaultLimit?: number;
}

interface Emits {
  (e: "update", skip: number, limit: number, refresh?: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const limits = [5, 10, 25, 100];

const skip = ref<number>(0);
const selectedLimit = ref<number>(props.defaultLimit || 25);

const _total = computed(() => {
  return props.paginated?.total || props.data?.length || 0;
});

const description = computed(() => {
  if (_total.value === 0) return "No data";

  if (!props.paginated) return `Viewing ${_total.value} of unknown`;

  const { total, skip, limit } = props.paginated as Paginated<any>;

  if (total <= limit) return `Viewing ${total}`;

  const start = (skip + 1).toLocaleString();
  const stop = Math.min(skip + limit, total).toLocaleString();
  const maximum = total.toLocaleString();

  return `Viewing ${start} through ${stop} of ${maximum}`;
});

const getColumnStyle = (column: Column): StyleValue | undefined => {
  return {
    width: column.fill ? "100%" : undefined,
    textAlign: column.reverse ? "right" : column.center ? "center" : undefined,
    minWidth: column.minWidth || undefined,
  };
};

const update = (refresh?: boolean) =>
  emit("update", skip.value, selectedLimit.value, refresh);

const selectLimit = (limit: number) => {
  selectedLimit.value = limit;

  update();
};

const updateSkip = (_skip: number) => {
  skip.value = Math.max(_skip, 0);

  update();
};

const refresh = () => {
  skip.value = 0;

  update(true);
};

onMounted(() => {
  update(true);
});
</script>

<style lang="scss" scoped>
.base-table {
  border-radius: 4px;

  border: 1px solid var(--border);

  background-color: var(--foreground);

  box-shadow: 0 4px 8px rgba(black, 0.025);

  .base-table-placeholder {
    aspect-ratio: 4 / 1;

    background-color: var(--background);

    border-bottom: 1px solid var(--border);

    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--text);

    p.placeholder-text {
      margin-left: 16px;

      font-size: 14px;
      line-height: 1;
    }
  }

  .base-table-footer {
    display: flex;
    gap: 8px;

    padding: 16px;

    > :first-child {
      margin-right: auto;
    }
  }

  .base-table-header {
    display: flex;
    align-items: center;
    gap: 8px;

    padding: 16px;

    .header-text {
      flex-grow: 1;

      line-height: 1;

      p.base-table-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-title);

        &:not(:last-child) {
          margin-bottom: 4px;
        }
      }

      p.base-table-description {
        font-size: 12px;
        color: var(--text);
      }
    }
  }
}
</style>
