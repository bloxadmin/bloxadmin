<template>
  <!--<div id="aggregate-statistics">
    
  </div>

  <div id="leaderboards">
    
  </div>

  <div id="statistics">
    
  </div>-->

  <div id="players">
    <PlayersTable :gameIdentifier="gameIdentifier" />
  </div>
      
  <!--<div id="moderator-actions">

  </div>-->
</template>

<script setup lang="ts">
import PlayersTable from '../components/players/PlayersTable.vue';

interface Props {
  gameIdentifier: string
}

defineProps<Props>();
</script>
