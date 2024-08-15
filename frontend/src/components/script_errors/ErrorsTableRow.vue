<template>
  <tr class="table-row">
    <td class="error" :title="error.message">
      <div class="message">
        {{ error.message }}
      </div>

      <div class="metadata">
        <span class="version">
          v{{ error.placeVersion }}
        </span>

        <span>
          ∙
        </span>

        <!-- <span>
          {{ timeAgo.firstLocal }}
        </span>

        <span>
          ∙
        </span> -->

        <span :title="timeAgo.lastLocal">
          {{ timeAgo.last }}
        </span>
      </div>
    </td>

    <td>
      <p class="row-text">
        {{ capitalize(error.environment) }}
      </p>
    </td>

    <td>
      <p class="row-text">
        {{ (error.occurrences).toLocaleString() }}
      </p>
    </td>

    <td>
      <div class="error-actions">
        <IconButton @click="expanded = !expanded" title="Show stack trace">
          <ChevronDown v-if="!expanded" :size="16" />
          <ChevronUp v-else :size="16" />
        </IconButton>
        <BaseIndicator v-if="loading">
          <Loading />
        </BaseIndicator>
        <WithPermission :one-of="[Permissions.Errors.Errors.Update, Permissions.Errors.Errors.Delete]">
          <BaseDropdown title="Actions">
            <template v-slot:default="{ open }">
              <BaseButton :active="open" :disabled="loading" reverse>
                <IconButton>
                  <MoreVertical :size="16" />
                </IconButton>
              </BaseButton>
            </template>

            <template #content>
              <WithPermission :has="[Permissions.Errors.Errors.Update]">
                <BaseDropdownItem @click="toggleResolve">{{ props.error.resolved ? "Unresolve" : "Resolve" }}
                </BaseDropdownItem>
              </WithPermission>

              <WithPermission :has="[Permissions.Errors.Errors.Delete]">
                <BaseDropdownItem @click="deleteError">Delete</BaseDropdownItem>
              </WithPermission>
            </template>
          </BaseDropdown>
        </WithPermission>
      </div>
    </td>
  </tr>
  <tr v-if="expanded" class="table-row expanded-error">
    <td colspan="4">
      <div class="stack">
        <!-- TODO: Just did this so later we can do some fancy coloring -->
        <div v-for="[full, script, line, func] in stackLines" :key="full" class="stack-line">
          <code
            v-if="script"><span class="script">{{ script }},</span><span class="line" v-if="line"> line {{ line }}</span><span class="func" v-if="func"> - function {{ func }}</span></code>
          <code v-else>{{ full }}</code>
          <Copy class="copy-icon" :size="16" @click="copy(full)" />
        </div>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp, Copy, MoreVertical } from "lucide-vue-next";
import { capitalize, computed, ref } from "vue";
import { Permissions } from "../../lib/bloxadmin";
import { ScriptError } from "../../lib/bloxadmin/scriptErrors";
import { formatTimeAgo } from "../../lib/format";
import BaseDropdown from "../general/BaseDropdown.vue";
import BaseDropdownItem from "../general/BaseDropdownItem.vue";
import BaseIndicator from "../general/BaseIndicator.vue";
import IconButton from "../general/IconButton.vue";
import Loading from "../general/Loading.vue";
import WithPermission from "../misc/WithPermission.vue";

const STACK_LINE_REGEX = /((.*), )(line ([0-9]+))( - function (.*))?/i;

interface Props {
  gameIdentifier: string;
  error: ScriptError
}

interface Emits {
  (event: "resolve", errorId: string, resolved: boolean): Promise<void>;
  (event: "delete", errorId: string): Promise<void>
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const loading = ref<boolean>(false);
const expanded = ref<boolean>(false);

const stackLines = computed((): string[][] => {
  return [
    [props.error.message, '', '', ''],
    ...(props.error.stack
      .split("\n")
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => {
        const [file, lineNo, , columnNo] = line.split("\t");
        const match = STACK_LINE_REGEX.exec(file);

        if (!match) {
          return [line, '', '', ''];
        }

        return [match[0], match[2], match[4], match[6]];
      }))
  ];
});

const copy = (text: string): void => {
  navigator.clipboard.writeText(text.trim());
};

const toggleResolve = async () => {
  loading.value = true;

  await emits("resolve", props.error.id, !props.error.resolved)

  loading.value = false;
};

const deleteError = async () => {
  loading.value = true;

  await emits("delete", props.error.id);

  loading.value = false;
}

const timeAgo = computed(() => {
  const firstDate = new Date(props.error.created);
  const lastDate = new Date(props.error.updated);

  return {
    firstLocal: new Date(props.error.created).toLocaleString(),
    first: formatTimeAgo(firstDate.getTime()),
    lastLocal: new Date(props.error.updated).toLocaleString(),
    last: formatTimeAgo(lastDate.getTime()),
  };
});

</script>

<style lang="scss" scoped>
.error {
  display: flex;
  flex-direction: column;
  max-width: 550px;
  color: var(--text-title);

  .message {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .metadata {
    display: flex;
    color: var(--text);
    font-size: small;
    font-weight: 500;
    gap: 2.5px;

    :nth-child(3) {
      text-decoration: underline dotted;
    }
  }
}

.error-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.table-row.expanded-error {
  background-color: var(--background);
  border-bottom-width: 4px;

  .stack {
    display: flex;
    flex-direction: column;
    color: #c9d1d9;
    background-color: var(--neutral-900);
    border-radius: 4px;
    padding: 16px;

    .stack-line:first-child {
      margin-bottom: 8px;
    }

    .stack-line {
      display: flex;
      align-items: center;
      gap: 1ch;

      .copy-icon {
        min-width: 16px;
        visibility: hidden;
        cursor: pointer;

        &:hover {
          color: #a3a6a9;
        }

        &:active {
          color: #c9d1d9;
        }
      }

      &:hover {
        .copy-icon {
          visibility: visible;
        }

        code {
          color: #ffffff;
        }
      }

      code {
        flex: 1;
        white-space: pre-wrap;
        font-family: "Fira Code", monospace;
        font-size: 12px;
        line-height: 1.5;
        display: block;
        word-break: break-all;
      }
    }
  }
}

td:nth-child(2) {
  text-align: center;
}

td:nth-child(3) {
  text-align: center;
}
</style>
