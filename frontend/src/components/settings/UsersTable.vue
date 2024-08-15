<template>
  <PaginatedTable :columns="columns" :loading="loading" title="User Permissions" @update="update" :data="users" :default-limit="25">
    <template #header>
      <form @submit="add" class="users-form" v-if="hasManagePermission">
        <div class="bar">
          <input id="addUserIdentifier" class="bar-input" type="text" v-model="addUser" placeholder="Add Player ID" autocomplete="off" />

          <div class="bar-button" :class="{ disabled: loading }" @click="add">
            <Plus :size="16" />
          </div>
        </div>
      </form>
    </template>

    <template v-slot:default="{ row }">
      <UsersTableRow 
        :user="(row as GameUser)" 
        :key="(row as GameUser).id" 
        :game-identifier="gameIdentifier"
        :can-manage="hasManagePermission"
        @remove="remove((row as GameUser).id)" 
        @update="updatePermissions((row as GameUser).id, $event)"
      />
    </template>
  </PaginatedTable>
</template>

<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { computed, ref } from "vue";
import { GameUser, Permissions, addGameUser, getGameUsers, removeGameUser, updateGameUser } from "../../lib/bloxadmin";
import { hasPermissionSync } from "../../lib/permissions";
import { Column } from "../general/BaseTable.vue";
import PaginatedTable from "../general/PaginatedTable.vue";
import UsersTableRow from "./UsersTableRow.vue";

interface Props {
  gameIdentifier: string
}

const props = defineProps<Props>();

const addUser = ref<string>("");
const loading = ref<boolean>(false);
const users = ref<GameUser[]>([]);

const hasManagePermission = computed(() => {
  return hasPermissionSync(props.gameIdentifier, [Permissions.Security.Users.Update]);
});

const columns = computed((): Column[] => {
  if (hasManagePermission.value)
    return [
      { text: "User", fill: true },
      { text: "Role", reverse: true },
      { text: "", reverse: true },
    ]
  return [
    { text: "User", fill: true },
    { text: "Role", reverse: true },
  ]
});

const add = (e: Event): void => {
  e.preventDefault();

  if (!/^[0-9]+$/.test(addUser.value)) {
    // To-do: Error;

    return;
  }

  loading.value = true;

  addGameUser(props.gameIdentifier, addUser.value)
    .then(() => update())
    .then(() => {
      addUser.value = "";
      loading.value = false;
    });
}

const remove = (userIdentifier: number) => {
  loading.value = true;

  removeGameUser(props.gameIdentifier, userIdentifier)
    .then(() => update())
    .finally(() => {
      loading.value = false;
    });
}

const updatePermissions = (userIdentifier: number, permissions: string[]) => {
  loading.value = true;

  updateGameUser(props.gameIdentifier, userIdentifier, permissions)
    .then(() => update())
    .finally(() => {
      loading.value = false;
    });
}

const update = async (): Promise<void> => {
  loading.value = true;

  const { body } = await getGameUsers(props.gameIdentifier);

  if (!body) {
    // To-do: Error;

    return;
  }

  users.value = body;

  loading.value = false;

  // await updateCharts();
};
</script>

<style lang="scss" scoped>
.users-form {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bar {
  height: 32px;

  display: flex;

  input.bar-input {
    height: 100%;
    width: 256px;

    padding: 0 16px;

    background-color: var(--background);

    border-radius: 4px 0 0 4px;

    font-size: 14px;
  }

  .bar-button {
    background-color: var(--primary);

    width: 32px;
    height: 100%;

    display: grid;
    place-items: center;

    border-radius: 0 4px 4px 0;

    cursor: pointer;

    color: var(--primary-text-title);

    &:hover {
      color: var(--white);
    }
  }
}
</style>
