<template>
  <div class="promo-codes">
    <div class="promo-codes-header">
      <p class="header-text">Promo Codes</p>

      <p class="limits">
        <span>Used {{ totalActive }} of {{ max }}</span>{{ " " }}
      </p>

      <BaseButton href="https://docs.bloxadmin.com/docs/guides/promo-codes" target="_blank">
        <template #icon>
          <HelpCircle :size="16" />
        </template>
        Help
      </BaseButton>

      <BaseIndicator v-if="loading">
        <Loading />
      </BaseIndicator>

      <IconButton v-else @click="update">
        <RefreshCcw :size="16" />
      </IconButton>

      <BaseDropdown no-auto-hide :title="`New Promo Code`" size="lg" ref="dropdown" v-if="canEdit">
        <template #content>
          <form class="add-dropdown" @submit="addPromoCode">
            <div class="input-wrapper">
              <label>Code</label>
              <input placeholder="FREE_123" v-model="newPromoCode" pattern="[a-zA-Z0-9_]{1,32}" />
            </div>

            <BaseButton theme="primary" center type="submit">
              <template #icon>
                <Plus :size="16" />
              </template>

              Add
            </BaseButton>
          </form>
        </template>

        <IconButton>
          <Plus :size="16" />
        </IconButton>
      </BaseDropdown>
    </div>

    <div class="promo-codes-body" :class="{ disabled: loading }">
      <PromoCodeRow v-for="code in promoCodes" :key="code.code" :gameIdentifier="props.gameIdentifier" :code="code"
        :canEdit="canEdit" @loading="loadingCounter += $event" @update="updateCode(code.code, $event)"
        @remove="removeCode($event)" :locked="totalActive >= max" />
      <PromoCodeRow v-for="code in fakePromoCodes" :key="code.code" :gameIdentifier="props.gameIdentifier" :code="code"
        :canEdit="canEdit" @loading="loadingCounter += $event" @update="updateCode(code.code, $event)"
        @remove="removeCode($event)" :locked="totalActive >= max" />

      <div v-if="!length" class="promo-codes-placeholder">
        <Cloud :size="16" />

        <p class="placeholder-text">Nothing to see here.</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Cloud, HelpCircle, Plus, RefreshCcw } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { Game, GameFeature, Permissions, PromoCode, getPromoCodes } from "../../lib/bloxadmin";
import { hasPermissionSync } from "../../lib/permissions";
import useModalStore from "../../stores/modal";
import BaseButton from "../general/BaseButton.vue";
import BaseDropdown, { DropdownRef } from "../general/BaseDropdown.vue";
import BaseIndicator from "../general/BaseIndicator.vue";
import IconButton from "../general/IconButton.vue";
import LinkButton from "../general/LinkButton.vue";
import Loading from "../general/Loading.vue";
import PromoCodeRow from "./PromoCodeRow.vue";

interface Props {
  gameIdentifier: string;
  game: Game;
}

const props = defineProps<Props>();

const promoCodes = ref<PromoCode[]>([]);
const fakePromoCodes = ref<PromoCode[]>([]);
const loadingCounter = ref<number>(0);
const newPromoCode = ref<string>("");
const dropdown = ref<DropdownRef | null>(null);
const modals = useModalStore();

const addPromoCode = (e: Event) => {
  e.preventDefault();

  if (!newPromoCode.value)
    return;

  fakePromoCodes.value.push({
    code: newPromoCode.value,
    attributes: {},
    active: totalActive < max,
    created: new Date().toLocaleString(),
    used: 0,
    fake: true,
  });

  newPromoCode.value = "";
  dropdown.value?.hide();
};

const loading = computed(() => {
  return loadingCounter.value > 0;
});

const canEdit = computed(() => {
  return hasPermissionSync(props.gameIdentifier, [Permissions.PromoCodes.PromoCodes.Update]);
})

const length = computed(() => {
  return promoCodes.value.length + fakePromoCodes.value.length;
});

const max = computed(() => {
  return props.game.features.includes(GameFeature.ExtendedPromoCodes) ? 250 : 10;
});

const totalActive = computed(() => {
  return promoCodes.value.filter((c) => c.active).length + fakePromoCodes.value.filter((c) => c.active).length;
});

const updateCode = (code: string, value: PromoCode) => {
  const index = promoCodes.value.findIndex((c) => c.code === code);

  if (index === -1) {
    promoCodes.value.push(value);

    // Remove from fakePromoCodes
    const fakeIndex = fakePromoCodes.value.findIndex((c) => c.code === code);

    if (fakeIndex !== -1)
      fakePromoCodes.value.splice(fakeIndex, 1);

    return;
  }

  promoCodes.value[index] = value;

};

const removeCode = (code: string) => {
  const index = promoCodes.value.findIndex((c) => c.code === code);
  const fakeIndex = fakePromoCodes.value.findIndex((c) => c.code === code);

  if (index !== -1)
    promoCodes.value.splice(index, 1);
  if (fakeIndex !== -1)
    fakePromoCodes.value.splice(fakeIndex, 1);
};

const update = async () => {
  loadingCounter.value++;

  const { body } = await getPromoCodes(props.gameIdentifier, true);

  if (!body) {
    // To-do: Error

    return;
  }

  promoCodes.value = body;

  loadingCounter.value--;
};

onMounted(update);
</script>

<style lang="scss" scoped>
.promo-codes {
  background-color: var(--foreground);

  overflow: hidden;

  display: flex;
  flex-direction: column;

  border-radius: 4px;

  border: 1px solid var(--border);

  box-shadow: 0 4px 8px rgba(black, 0.025);

  max-height: 1024px;

  .promo-codes-body .promo-codes-placeholder {
    aspect-ratio: 4 / 1;
  }

  .promo-codes-header,
  .promo-codes-footer {
    padding: 16px;

    display: flex;
    align-items: center;
    gap: 8px;
  }

  .promo-codes-header {
    border-bottom: 1px solid var(--border);

    z-index: 1;

    p.header-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-title);
    }

    p.limits {
      font-size: 12px;
      color: var(--text);
      line-height: 1;

      flex-grow: 1;
    }

    .add-dropdown {
      padding: 16px;

      input {
        text-transform: uppercase;
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

      input {
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
      }
    }
  }

  .promo-codes-footer {
    border-top: 1px solid var(--border);
  }

  .promo-codes-body {
    flex-grow: 1;

    overflow: auto;

    .promo-codes-placeholder {
      background-color: var(--background);

      display: flex;
      align-items: center;
      justify-content: center;

      color: var(--text);

      p.placeholder-text {
        margin-left: 16px;

        font-size: 14px;
        line-height: 1;
      }
    }
  }
}
</style>
