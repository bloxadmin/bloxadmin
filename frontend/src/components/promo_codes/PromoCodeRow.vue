<template>
  <div class="promo-code-row">
    <div class="promo-code-header">
      <span class="code">{{ code.code }}</span>
      <span class="stats">Used: {{ code.used }}</span>
    </div>
    <form class="promo-code-body" v-if="editMode" @submit.prevent="save">
      <div class="input-group">
        <div class="input-wrapper small">
          <label>Active</label>
          <Switch v-model="localCode.active" :disabled="locked && !code.active" />
        </div>
        <div class="input-wrapper">
          <label>Uses</label>
          <input placeholder="42069" v-model="localCode.uses" />
        </div>
      </div>
      <div class="attributes">
        <div class="label">
          <span>Attributes</span>
          <BaseDropdown no-auto-hide :title="`Add Attribute`" size="lg" ref="dropdown">
            <template #content>
              <form class="add-dropdown" @submit.prevent="addKey">
                <div class="input-wrapper">
                  <label>Key</label>
                  <input placeholder="coins" v-model="newKey" />
                </div>

                <BaseButton theme="primary" center type="submit">
                  <template #icon>
                    <Plus :size="16" />
                  </template>

                  Add
                </BaseButton>
              </form>
            </template>

            <IconButton theme="secondary" type="button">
              <Plus :size="16" />
            </IconButton>
          </BaseDropdown>
        </div>
        <div class="attribute-list" v-if="Object.keys(localCode.attributes).length">
          <div class="attribute" v-for="(value, key) in localCode.attributes" :key="key">
            <div class="input-group">
              <div class="input-wrapper small fixed">
                <label>Key</label>
                <input placeholder="key" :value="key" disabled />
              </div>
              <div class="input-wrapper">
                <label>Value</label>
                <input placeholder="value" v-model="localCode.attributes[key]" />
              </div>
              <IconButton theme="secondary" @click="delete localCode.attributes[key]" type="button">
                <Trash :size="16" />
              </IconButton>
            </div>
          </div>
        </div>
        <div class="attributes-empty" v-else>
          <p>No attributes</p>
        </div>
      </div>
      <!-- <div class="input-group">
        <div class="input-wrapper">
          <label>Starts</label>
          <input type="datetime-local" v-model="localCode.starts" />
        </div>
        <div class="input-wrapper">
          <label>Expires</label>
          <input type="datetime-local" v-model="localCode.expires" />
        </div>
      </div> -->

      <div class="button-group">
        <BaseButton theme="secondary" @click="cancel" type="button">
          <template #icon>
            <Undo :size="16" />
          </template>

          Cancel
        </BaseButton>
        <BaseButton theme="primary" type="submit">
          <template #icon>
            <Save :size="16" />
          </template>

          Save
        </BaseButton>
      </div>
    </form>
    <div class="promo-code-summary" v-else>
      <div class="promo-code-summary-details">
        <div class="detail">
          <span class="name">Active</span>
          <span class="value">{{ code.active ? "Yes" : "No" }}</span>
        </div>
        <div class="detail" v-if="code.uses">
          <span class="name">Uses</span>
          <span class="value">{{ code.uses }}</span>
        </div>
        <!-- <div class="detail" v-if="code.expires">
          <span class="name">Expires</span>
          <span class="value">{{ new Date(code.expires).toLocaleString() }}</span>
        </div>
        <div class="detail" v-if="code.starts">
          <span class="name">Starts</span>
          <span class="value">{{ new Date(code.starts).toLocaleString() }}</span>
        </div> -->
      </div>
      <IconButton @click="toggleEditMode" theme="primary">
        <Pencil :size="16" />
      </IconButton>

      <BaseDropdown :title="`Are you sure?`" size="lg">
        <template #content>
          <div class="delete-dropdown">
            <p>This action cannot be undone!</p>
            <BaseButton theme="primary" center @click="remove">
              <template #icon>
                <Trash :size="16" />
              </template>

              Confirm
            </BaseButton>
          </div>
        </template>

        <IconButton>
          <Trash :size="16" />
        </IconButton>
      </BaseDropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Pencil, Plus, Save, Trash, Undo } from "lucide-vue-next";
import { ref, watch } from "vue";
import { PromoCode, createPromoCode, deletePromoCode, updatePromoCode } from "../../lib/bloxadmin";
import BaseButton from "../general/BaseButton.vue";
import BaseDropdown, { DropdownRef } from "../general/BaseDropdown.vue";
import IconButton from "../general/IconButton.vue";
import Switch from "../general/Switch.vue";

interface Props {
  gameIdentifier: string;
  code: PromoCode;
  canEdit: boolean;
  locked: boolean;
}

interface Emits {
  (e: "loading", value: 1 | -1): void,
  (e: "update", value: PromoCode): void,
  (e: "remove", value: string): void,
}

const cloneCode = () => {
  return {
    ...props.code,
    attributes: { ...props.code.attributes },
  };
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const editMode = ref<boolean>(!!props.code.fake);
const localCode = ref<PromoCode>(cloneCode());
const newKey = ref<string>("");
const dropdown = ref<DropdownRef | null>(null);

const addKey = () => {
  if (!newKey.value)
    return;

  localCode.value.attributes[newKey.value] = "";
  newKey.value = "";
  dropdown.value?.hide();
};

const toggleEditMode = () => {
  editMode.value = !editMode.value;
  localCode.value = cloneCode();
};

const cancel = () => {
  if (props.code.fake)
    return emit("remove", props.code.code);
  toggleEditMode();
};

const save = async () => {
  emit("loading", 1);

  const { body, ok } = props.code.fake
    ? await createPromoCode(props.gameIdentifier, props.code.code.trim(), {
      active: localCode.value.active || false,
      attributes: localCode.value.attributes,
      uses: localCode.value.uses === undefined ? undefined : Number(localCode.value.uses),
    })
    : await updatePromoCode(props.gameIdentifier, props.code.code.trim(), {
      active: localCode.value.active || false,
      attributes: localCode.value.attributes,
      // expires: localCode.value.expires && new Date(localCode.value.expires).toISOString(),
      // starts: localCode.value.starts && new Date(localCode.value.starts).toISOString(),
      uses: localCode.value.uses === undefined ? undefined : Number(localCode.value.uses),
    });

  if (ok) {
    editMode.value = false;

    emit("update", body);
  }
  emit("loading", -1);
};

const remove = async () => {
  if (props.code.fake) {
    emit("remove", props.code.code);
    return;
  }

  emit("loading", 1);

  const { ok } = await deletePromoCode(props.gameIdentifier, props.code.code);
  if (ok)
    emit("remove", props.code.code);

  emit("loading", -1);
};

watch(() => props.code, (value) => {
  localCode.value = cloneCode();
});
</script>

<style lang="scss" scoped>
.promo-code-row {
  display: flex;

  &:not(:last-of-type) {
    border-bottom: 1px solid var(--border);
  }

  .promo-code-header {
    width: 256px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);

    .code {
      text-transform: uppercase;
      font-weight: 600;
    }

    .stats {
      color: var(--text);
      font-size: small;
      font-weight: 500;
    }
  }

  .promo-code-body,
  .promo-code-summary {
    flex: 1;
  }

  .promo-code-summary {
    display: flex;
    padding: 16px;
    align-items: center;
    gap: 0.5em;

    .delete-dropdown {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .promo-code-summary-details {
      flex: 1;
      display: flex;
      gap: 1em;

      .detail {
        display: flex;
        flex-direction: column;

        .name {
          color: var(--text);
          line-height: 1;
        }

        .value {
          font-size: 0.9em;
          color: var(--text-input);
        }
      }
    }
  }

  .promo-code-body {
    padding: 16px;
    background-color: var(--foreground);

    .button-group {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 32px;
    }

    .input-group {
      display: flex;
      gap: 16px;

      .input-wrapper {
        flex: 1;

        &.small {
          flex: 0;
        }

        &.fixed {
          min-width: 192px;
        }
      }

      .icon-button {
        padding: 0;
        border: none;
        background: none;
        align-self: center;
      }
    }

    .input-wrapper {
      display: flex;
      flex-direction: column;
      width: 100%;
      margin-bottom: 16px;

      label {
        font-size: 12px;
        color: var(--text);
        line-height: 1;

        margin-bottom: 8px;
      }

      input:not([type="checkbox"]) {
        height: 40px;
        width: 100%;

        padding: 0 16px;

        background-color: var(--secondary-background);

        border-radius: 4px;

        border: 1px solid var(--border);

        font-size: 14px;
        color: var(--text-input);
        line-height: 1;

        &::placeholder {
          color: var(--text);
        }

        &:disabled {
          background-color: var(--background);
          color: var(--text);
          cursor: not-allowed;
        }
      }
    }

    .attributes {
      .label {
        display: flex;
        align-items: center;
        justify-content: space-between;

        margin-bottom: 4px;

        .icon-button {
          padding: 0;
          border: none;
          background: none;
        }

        .add-dropdown {
          padding: 16px;
        }
      }

      .attribute-list {
        display: flex;
        flex-direction: column;
      }

      .attributes-empty {
        display: flex;
        align-items: center;
        justify-content: center;

        height: 48px;

        background-color: var(--secondary-background);

        border-radius: 4px;

        font-size: 14px;
        color: var(--text);
        line-height: 1;
      }
    }
  }
}
</style>
