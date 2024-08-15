<template>
  <div id="moderation-log">
    <ModeratorActionTable :gameIdentifier="gameIdentifier" />
  </div>
</template>

<script setup lang="ts">
import ModeratorActionTable from "../components/moderation/ModeratorActionTable.vue";

interface Props {
  gameIdentifier: string
}

defineProps<Props>();
</script>
