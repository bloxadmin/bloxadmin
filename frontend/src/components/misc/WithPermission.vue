<template>
  <slot v-if="hasPermission" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Permission } from "../../lib/bloxadmin";
import { hasPermissionSync } from "../../lib/permissions";

interface Props {
  has?: Permission[];
  oneOf?: Permission[];
}

const props = defineProps<Props>();

const route = useRoute();

const hasPermission = computed(() => {
  if (props.has && !hasPermissionSync(Number(route.params.gameIdentifier), props.has, false))
    return false;

  if (props.oneOf && !hasPermissionSync(Number(route.params.gameIdentifier), props.oneOf, true))
    return false;

  return true;
});
</script>
