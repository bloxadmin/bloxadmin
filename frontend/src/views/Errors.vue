<template>
  <div id="script-errors">
    <ErrorsTable :gameIdentifier="gameIdentifier" />
  </div>
</template>

<script setup lang="ts">
import ErrorsTable from "../components/script_errors/ErrorsTable.vue";

interface Props {
  gameIdentifier: string
}

defineProps<Props>();
</script>
