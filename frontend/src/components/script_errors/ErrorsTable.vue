<template>
  <BaseTable :columns="columns" :paginated="paginated" :loading="loading" @update="update" title="Script Errors"
    :default-limit="25">
    <template #header>
      <Checkbox v-model="model" />
      Show Resolved
    </template>

    <template v-slot:default="{ row }: { row: ScriptError, index: number }">
      <ErrorsTableRow v-if=" !filterOut.includes(row.id) " :game-identifier=" props.gameIdentifier "
        :key=" row.id " :error=" row " @resolve=" resolve " @delete=" deleteError "/>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Paginated, ScriptError, deleteScriptError, getScriptErrors, resolveScriptError } from "../../lib/bloxadmin";
import BaseTable, { Column } from "../general/BaseTable.vue";
import Checkbox from "../general/Checkbox.vue";
import ErrorsTableRow from "./ErrorsTableRow.vue";

interface Props {
  gameIdentifier: string
}

const props = defineProps<Props>();

const loading = ref<boolean>(false);
const paginated = ref<Paginated<ScriptError> | null>(null);
const showResolved = ref<boolean>(false);
const filterOut = ref<string[]>([]);

const columns = computed((): Column[] => {
  return [
    { text: "Script", fill: true },
    { text: "Environment", center: true },
    { text: "Occurrences", center: true },
    { text: "Actions", center: true }
  ]
});

const model = computed({
  get: () => showResolved.value,
  set: (value) => {
    showResolved.value = value;

    if (paginated.value) {
      update(paginated.value.skip, paginated.value.limit);
    } else {
      update(0, 25);
    }
  }
});

const resolve = async (errorId: string, resolved: boolean): Promise<void> => {
  const { body } = await resolveScriptError(props.gameIdentifier, errorId, resolved);

  if (!body) {
    // To-do: Error;

    return;
  }

  if (paginated.value)
    update(paginated.value.skip, paginated.value.limit);
};

const deleteError = async (errorId: string) => {
  await deleteScriptError(props.gameIdentifier, errorId);

  if (paginated.value)
    update(paginated.value.skip, paginated.value.limit);
};

const update = async (skip: number, limit: number): Promise<void> => {
  loading.value = true;

  const { body } = await getScriptErrors(props.gameIdentifier, limit, skip, showResolved.value);

  if (!body) {
    // To-do: Error;

    return;
  }

  paginated.value = body;

  filterOut.value = [];

  loading.value = false;
};
</script>
