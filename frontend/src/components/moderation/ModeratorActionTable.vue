<template>
  <BaseTable
    :columns="columns"
    :paginated="paginated"
    :loading="loading"
    :downloading="downloading"
    @update="update"
    title="Moderation Log"
  >
    <template #header>
      <BaseButton
        theme="primary"
        @click="download"
        :disabled="downloading"
      >
        <template #icon>
          <Download :size="16" />
        </template>

        Download
      </BaseButton>
    </template>
    <template v-slot:default="{ row }: { row: ModeratorAction }">
      <!-- To-do: ModeratorActionTableRow -->
      <tr class="table-row">
        <td v-if="row.player">
          <DisplayPlayer :player="row.player" />
        </td>

        <td>
          <p class="row-title">{{ capitalize(row.type) }}</p>
        </td>

        <td>
          <p class="row-text-wrap">{{ row.reason || "No reason specified" }}</p>
        </td>

        <td class="cell-center">
          <template v-if="row.createdAt">
            <p class="row-title">
              {{
                new Date(row.createdAt).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })
              }}
            </p>

            <p class="row-description">
              {{
                new Date(row.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              }}
            </p>
          </template>

          <p class="row-title" v-else>Unknown</p>
        </td>

        <td class="cell-center">
          <template v-if="row.expiresAt">
            <p class="row-title">
              {{
                new Date(row.expiresAt).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })
              }}
            </p>

            <p class="row-description">
              {{
                new Date(row.expiresAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              }}
            </p>
          </template>

          <p class="row-title" v-else>Never</p>
        </td>

        <td class="cell-right">
          <DisplayPlayer :player="row.moderator" />
        </td>
      </tr>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { Download } from "lucide-vue-next";
import { computed, ref } from "vue";
import {
ModeratorAction,
Paginated,
downloadGameModeratorActions,
downloadModeratorActions,
getGameModeratorActions,
getModeratorActions,
} from "../../lib/bloxadmin";
import { capitalize } from "../../lib/format";
import BaseButton from "../general/BaseButton.vue";
import BaseTable, { Column } from "../general/BaseTable.vue";
import DisplayPlayer from "../players/DisplayPlayer.vue";

interface Props {
  gameIdentifier: string;
  playerIdentifier?: string;
}


interface MyObject {
  [key: string]: any;
}

const columns = computed(() =>
  props.playerIdentifier
    ? ([
        { text: "Type" },
        { text: "Reason", fill: true },
        { text: "Created at", center: true },
        { text: "Expires at", reverse: true },
        { text: "Moderator", reverse: true },
      ] as Column[])
    : ([
        { text: "Player" },
        { text: "Type" },
        { text: "Reason", fill: true },
        { text: "Created at", center: true },
        { text: "Expires at", reverse: true },
        { text: "Moderator", reverse: true },
      ] as Column[])
);

const props = defineProps<Props>();
const loading = ref<boolean>(false);
const downloading = ref<boolean>(false);
const paginated = ref<Paginated<ModeratorAction> | null>(null);

const download = async () => {
  downloading.value = true;

  const { body } = props.playerIdentifier
    ? await downloadModeratorActions(props.gameIdentifier, props.playerIdentifier)
    : await downloadGameModeratorActions(props.gameIdentifier);

  downloading.value = false;

  // Convert body.data to CSV string
const csvData = convertToCSV(body?.data ?? []); // Handle the case where body?.data is undefined

  // Create a Blob from the CSV string
  const blob = new Blob([csvData], { type: 'text/csv' });

  // Create a download link
  const downloadLink = document.createElement('a');
  downloadLink.href = window.URL.createObjectURL(blob);
downloadLink.download = props.playerIdentifier ? `${props.playerIdentifier}_ModerationExport-Player.csv` : `${props.gameIdentifier}_ModerationExport-Game.csv` ;


  // Append the download link to the document
  document.body.appendChild(downloadLink);

  // Trigger a click event to initiate the download
  downloadLink.click();

  // Remove the download link from the document
  document.body.removeChild(downloadLink);
};


const convertToCSV = (data: any[]) => { // Provide type annotation for `data`
  const headers = Object.keys(flattenObject(data[0]));

  const rows = data.map((row: any) => { // Provide type annotation for `row`
    const flattenedRow = flattenObject(row);
    return headers.map(header => flattenedRow[header]).join(',');
  });

  return `${headers.join(',')}\n${rows.join('\n')}`;
};

// Function to flatten nested objects
const flattenObject = (obj: any, prefix = ''): MyObject => {
  const acc: MyObject = {}; // Provide type annotation for `acc`
  return Object.keys(obj).reduce((acc, key) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(acc, flattenObject(obj[key], newKey));
    } else {
      acc[newKey] = obj[key];
    }
    return acc;
  }, acc); // Provide `acc` as the initial value for `reduce`
};


const update = async (skip: number, limit: number): Promise<void> => {
  loading.value = true;

  const { body } = props.playerIdentifier
    ? await getModeratorActions(
        props.gameIdentifier,
        props.playerIdentifier,
        limit,
        skip
      )
    : await getGameModeratorActions(props.gameIdentifier, limit, skip);

  if (!body) {
    // To-do: Error;

    return;
  }

  paginated.value = body;

  loading.value = false;
};

defineExpose({ update });
</script>

<style lang="scss" scoped>
// .table-row td:nth-child(n + 3) {
//   text-align: right;
// }
</style>
