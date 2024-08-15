<template>
  <WithPermission :has="[Permissions.RemoteConfig.Entries.List]">
    <div id="remote-config">
      <RemoteConfig :gameIdentifier="gameIdentifier" />
    </div>
  </WithPermission>

  <WithPermission :has="[Permissions.PromoCodes.PromoCodes.List]">
    <div id="promo-codes">
      <PromoCodes :gameIdentifier="gameIdentifier" :game="game" />
    </div>
  </WithPermission>

  <WithPermission :has="[Permissions.Datastores.Datastores.List]">
    <div id="datastore" v-if="game.features.includes(GameFeature.DatastoreViewer)">
      <DatastoreList :gameIdentifier="gameIdentifier" />
    </div>
  </WithPermission>
</template>

<script setup lang="ts">
import DatastoreList from "../components/datastore/DatastoreList.vue";
import WithPermission from "../components/misc/WithPermission.vue";
import PromoCodes from "../components/promo_codes/PromoCodes.vue";
import RemoteConfig from "../components/remote_config/RemoteConfig.vue";
import { Game, GameFeature, Permissions } from "../lib/bloxadmin";

interface Props {
  gameIdentifier: string;
  game: Game;
}

defineProps<Props>();
</script>
