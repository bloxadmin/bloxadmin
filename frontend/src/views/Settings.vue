<template>
  <WithPermission :has="[Permissions.Api.Keys.List]">
    <div id="roblox-config">
      <RobloxConfig :game="game" :gameIdentifier="gameIdentifier" />
    </div>
  </WithPermission>

  <div id="user-permissions">
    <UsersTable :gameIdentifier="gameIdentifier" />
  </div>

  <WithPermission :has="[Permissions.GamePerms.IngestConfig.Read]">
    <div id="script-config">
      <ScriptConfig :gameIdentifier="gameIdentifier" />
    </div>
  </WithPermission>
</template>

<script setup lang="ts">
import WithPermission from '../components/misc/WithPermission.vue';
import RobloxConfig from '../components/settings/RobloxConfig.vue';
import ScriptConfig from '../components/settings/ScriptConfig.vue';
import UsersTable from '../components/settings/UsersTable.vue';
import { Game, Permissions } from '../lib/bloxadmin';

interface Props {
  gameIdentifier: string;
  game: Game;
}

interface Emits {
  (e: "updateGame"): void
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<style>
</style>
