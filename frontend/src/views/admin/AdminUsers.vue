<template>
  <Container>

    <BaseTable :columns="columns" :paginated="paginated" :loading="loading" @update="update" title="Users">
      <template v-slot:default="{ row }: { row: AdminUser, index: number }">
        <tr class="table-row">
          <td>
            <code>{{ row.id }}</code>
          </td>

          <td>
            <img :key=" row.id " :width="48" :src=" `${API_BASE}/roblox/avatars/${row.id}` " />
          </td>

          <td>
            <a class="row-text" :href="`https://roblox.com/users/${row.id}`" target="_blank">{{ row.name }}</a>
          </td>
        </tr>
      </template>
    </BaseTable>
  </Container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BaseTable, { Column } from "../../components/general/BaseTable.vue";
import Container from "../../components/general/Container.vue";
import { API_BASE, AdminUser, Paginated, getUsersAdmin } from "../../lib/bloxadmin";

const columns: Column[] = [
  { text: "ID", },
  { text: "Avatar", },
  { text: "Name", },
]

const paginated = ref<Paginated<AdminUser> | null>(null);
const loading = ref<boolean>(false);

const update = async (skip: number, limit: number): Promise<void> => {
  loading.value = true;
  const { body } = await getUsersAdmin(skip, limit);

  if (!body) {
    // To-do: Error;

    return;
  }

  paginated.value = body;
  loading.value = false;
};
</script>

<style lang="scss" scoped>
.info {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;

  .name {
    font-weight: bold;
  }

  code {
    background-color: #f0f0f0;
    padding: 0.25em 0.5em;
    border-radius: 4px;
  }

}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  flex-direction: row;
  flex-wrap: wrap;
}

.feature {
  font-size: 0.8rem;
  padding: 0.125em 0.375em;
  border-radius: 24px;
  background-color: #f0f0f0;
  color: var(--black);
}
</style>
