<template>
  <div id="actions">
    <ActionManager :gameIdentifier="gameIdentifier" />
  </div>

  <!-- <div id="scheduled-actions">
    <ScheduledActionsManager :gameIdentifier="gameIdentifier" />
  </div> -->
</template>

<script setup lang="ts">
import ActionManager from "../components/actions/ActionManager.vue";
// import ScheduledActionsManager from "../components//actions/ScheduledActionsManager.vue";
interface Props {
  gameIdentifier: string
}
defineProps<Props>();
</script>
