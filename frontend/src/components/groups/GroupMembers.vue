<template>
  <BaseTable v-if="roles" :columns="columns" :paginated="paginated" :loading="loading" @update="update"
    title="Group Members">
    <template #header>
      <BaseDropdown title="Role Filters" noAutoHide>
        <template #content>
          <BaseDropdownItem v-for="role in roles" :key="role.id">
            <Checkbox :modelValue="selectedRoles.includes(role.id)" @update:model-value="toggleRole(role.id)"
              :value="role.id.toString()">
              {{ role.name }}
            </Checkbox>
          </BaseDropdownItem>
        </template>

        <BaseButton theme="secondary">
          <template #icon>
            <Filter :size="16" />
          </template>

          Role Filters
        </BaseButton>
      </BaseDropdown>
    </template>
    <template v-slot:default="{ row }: { row: GroupUser, index: number }">
      <tr class="table-row">
        <td>
          <DisplayPlayer group :player=" row " />
          <!-- {{ row.name }} -->
        </td>
        <td>
          {{ row.role.name }}
        </td>
      </tr>
    </template>
  </BaseTable>
</template>
<script setup lang="ts">
import { Filter } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { GroupRole, GroupUser, Paginated, getGroupRoles, getGroupUsers } from "../../lib/bloxadmin";
import BaseButton from "../general/BaseButton.vue";
import BaseDropdown from "../general/BaseDropdown.vue";
import BaseDropdownItem from "../general/BaseDropdownItem.vue";
import BaseTable from "../general/BaseTable.vue";
import Checkbox from "../general/Checkbox.vue";
import DisplayPlayer from "../players/DisplayPlayer.vue";

interface Props {
  groupIdentifier: string;
}

const props = defineProps<Props>();

const columns = [
  {
    text: "Player",
  },
  {
    text: "Role",
  },
];

const loading = ref<boolean>(false);
const paginated = ref<Paginated<GroupUser> | null>(null);
const roles = ref<GroupRole[] | null>(null);
const selectedRoles = ref<number[]>([]);

const toggleRole = async (roleId: number) => {
  if (selectedRoles.value.includes(roleId)) {
    selectedRoles.value = selectedRoles.value.filter((id) => id !== roleId);
  } else {
    selectedRoles.value = [...selectedRoles.value, roleId];
  }

  await refresh();
}

const updateRoles = async () => {
  const { body } = await getGroupRoles(props.groupIdentifier);

  if (!body) {
    // To-do: Error;

    return;
  }

  selectedRoles.value = body.filter((role) => role.canViewGroup).map((role) => role.id);
  roles.value = body;
};

const refresh = () => {
  if (!paginated.value) {
    return;
  }
  return update(paginated.value.skip, paginated.value.limit);
}

const update = async (skip: number, limit: number): Promise<void> => {
  loading.value = true;

  const { body } = await getGroupUsers(props.groupIdentifier, limit, skip, selectedRoles.value);

  if (!body) {
    // To-do: Error;

    return;
  }

  paginated.value = body;

  loading.value = false;
};

onMounted(updateRoles)
</script>
