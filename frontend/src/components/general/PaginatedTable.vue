<template>
  <BaseTable :paginated="paginated" :title="title" :loading="loading" :columns="columns" @update="update" :default-limit="defaultLimit">
    <template #header>
      <slot name="header" />
    </template>

    <template v-slot:default="{ row, index }">
      <slot :row="row" :index="index" />
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Paginated } from "../../lib/bloxadmin";
import BaseTable, { Column } from "./BaseTable.vue";

interface Props {
  data: any[],
  title: string,
  loading: boolean,
  columns: Column[],
  defaultLimit?: number
}

interface Emits {
  (e: "update"): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const _limit = ref<number | null>(null);
const paginated = ref<Paginated<any> | null>(null);

const update = (skip: number, limit: number, refresh?: boolean) => {
  _limit.value = limit;

  if (refresh) return emit("update");

  paginated.value = { ...(paginated.value as Paginated<any>), limit, skip, data: props.data.slice(skip, skip + limit) };
};

watch(() => props.data, () => {
  paginated.value = { limit: _limit.value as number, skip: 0, total: props.data.length, data: props.data.slice(0, _limit.value as number) };
});
</script>
