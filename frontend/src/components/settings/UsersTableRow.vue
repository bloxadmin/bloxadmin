<template>
  <tr class="table-row">
    <td>
      <DisplayPlayer :player="{ id: user.id, name: user.name }" />
    </td>

    <td v-if="canManageRow">
      <!-- <select @change="updatePermissions(($event.target! as HTMLSelectElement).value)">
        <option v-if="activeRole === 'custom'" selected value="custom" disabled>Custom</option>
        <option v-for="role in GAME_ROLES" :key="role.name" :value="role.name" :selected="activeRole === role.name">
          {{ role.name }}
        </option>
      </select> -->
    </td>

    <td v-else>
      <!-- {{ activeRole }} -->
    </td>

    <td v-if="canManage">
        <IconButton :disabled="!canManageRow" theme="primary" @click="remove">
          <Trash :size="16" />
        </IconButton>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { Trash } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { GameUser } from "../../lib/bloxadmin";
import useAuthenticationStore from "../../stores/authentication";
import IconButton from "../general/IconButton.vue";
import DisplayPlayer from "../players/DisplayPlayer.vue";

const authenticationStore = useAuthenticationStore();
const { user: authUser } = storeToRefs(authenticationStore);

interface Props {
  gameIdentifier: string;
  user: GameUser;
  canManage: boolean;
}

interface Emits {
  (e: "remove"): void;
  (e: "update", permissions: string[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const canManageRow = computed(() => {
  return props.canManage && props.user.sequence !== 2500 && props.user.id !== authUser.value?.id;
});

const remove = () => {
  emit("remove");
};
</script>

<style lang="scss" scoped>
td:nth-child(n + 2) {
  text-align: right;
}
</style>
