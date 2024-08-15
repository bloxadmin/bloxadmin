<template>
  <div class="onboarding" v-if="game && scriptConfig">
    <div class="onboarding-header" :style="`--thumbnail: url(${API_BASE}/roblox/assetThumbnails/${game.rootPlaceId})`">
      <div class="onboarding-header-content">
        <h1>Lets get started with</h1>
        <h2>{{ game.name }}</h2>
      </div>
    </div>

    <div class="onboarding-content">
      <p>To get started, add this code snippit to your game in a <b>ServerScript</b></p>
      <p class="smol">Make sure to <a target="_blank"
          href="https://create.roblox.com/docs/reference/engine/classes/HttpService#HttpEnabled">enable HTTP Requests</a>
      </p>
      <code><LuaHighlight>{{ code }}</LuaHighlight></code>
      <div class="button-group">
        <BaseButton theme="primary" @click="copy" v-if="copied === 0">
          <template #icon>
            <Copy :size="16" />
          </template>

          Copy to clipboard
        </BaseButton>
        <BaseButton theme="primary" v-else>
          <template #icon>
            <Check :size="16" />
          </template>

          Copied!
        </BaseButton>
        <BaseButton theme="secondary" :href="`https://www.roblox.com/games/${game.rootPlaceId}`">
          <template #icon>
            <ExternalLink :size="16" />
          </template>

          Open on Roblox
        </BaseButton>
      </div>

      <div class="divider" />

      <div class="waiting" v-if="game.features.includes(GameFeature.Block)">
        <X :size="64" color="var(--red-500)" />
        <p>Game is blocked!</p>
        <p class="note">This game has been blocked</p>
      </div>
      <div class="waiting" v-else-if="!gotData && !game.isSetup">
        <RefreshCw :size="64" class="spinner" />
        <p>Waiting for data from your game...</p>
        <p class="note">After you put the code in your game, publish and join a private server</p>
        <p class="note">bloxadmin does not collect data while in Roblox Studio</p>
        <p class="note extra">Taking too long? Try refreshing</p>
      </div>
      <div class="waiting" v-else>
        <Check :size="64" color="green" />
        <p>Connected to your game!</p>
        <p class="note">You can now view your game's data on bloxadmin</p>
        <BaseButton :to="next.to" theme="primary">
          <template #icon>
            <ArrowRight :size="16" />
          </template>

          {{ next.text }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import "@fontsource/roboto-mono";
import { ArrowRight, Check, Copy, ExternalLink, RefreshCw } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from "vue-router";
import BaseButton from '../components/general/BaseButton.vue';
import LuaHighlight from "../components/general/LuaHighlight.vue";
import { API_BASE, Game, GameFeature, ScriptConfig, getGame, getGameEventSource, getScriptConfig } from '../lib/bloxadmin';
import { X } from "lucide-vue-next";
import { HelpCircle } from "lucide-vue-next";

interface Props {
  gameIdentifier: string
}

const props = defineProps<Props>();

const game = ref<Game | null>(null);
const scriptConfig = ref<ScriptConfig | null>(null);
const copied = ref<number>(0);
const eventSource = ref<EventSource | null>(null);
const gotData = ref(false);
const timer = ref<number | null>(null);

const route = useRoute();

const code = computed(() => `require(7586411088)("${scriptConfig.value?.ingestKey}")`);
const next = computed(() => {
  const next = route.query.next as string | undefined;

  if (!next) {
    return {
      to: { name: "Servers", params: { gameIdentifier: props.gameIdentifier } },
      text: "View Game"
    };
  }

  const ids = next.split(",");
  const id = ids[0];
  const rest = ids.slice(1).join(",");

  return {
    to: { path: `/new/${id}` + (rest ? `?next=${rest}` : "") },
    text: "Add next game"
  };
});

const copy = () => {
  navigator.clipboard.writeText(code.value);

  if (copied.value) {
    clearTimeout(copied.value);
  }

  copied.value = setTimeout(() => {
    copied.value = 0;
  }, 2500);
}

const update = async () => {
  const gameBody = await getGame(props.gameIdentifier);
  const scriptConfigBody = await getScriptConfig(props.gameIdentifier);

  if (!gameBody.ok || !scriptConfigBody.ok) {
    return;
  }

  game.value = gameBody.body;
  scriptConfig.value = scriptConfigBody.body;
};

const listen = () => {
  if (eventSource.value)
    return;

  const source = getGameEventSource(props.gameIdentifier);

  source.addEventListener("message", (event) => {
    gotData.value = true;

    source.close();
  });

  eventSource.value = source;
}

watch(() => props.gameIdentifier, () => {
  eventSource.value?.close();
  gotData.value = game.value?.apiKeySet ?? false;
  scriptConfig.value = null;
  game.value = null;
  eventSource.value = null;

  if (copied.value) {
    clearTimeout(copied.value);
    copied.value = 0;
  }

  update();
  listen();
})

onMounted(() => {
  update();
  listen();

  timer.value = setInterval(() => {
    if (!gotData.value && !game.value?.isSetup)
      update();
  }, 5000);
});

onUnmounted(() => {
  eventSource.value?.close();

  if (timer.value) {
    clearInterval(timer.value);
  }
});
</script>
<style lang="scss">
.onboarding {
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;

  .onboarding-header {
    height: 30vh;
    width: 100%;

    background: var(--thumbnail) center / cover no-repeat;

    .onboarding-header-content {
      height: 100%;

      display: flex;
      flex-direction: column;
      text-align: center;
      justify-content: center;

      backdrop-filter: brightness(0.3);

      color: var(--white);

      h1 {
        font-size: 2rem;
        font-weight: normal;
      }

      h2 {
        font-size: 3rem;
        font-weight: bold;

        @media screen and (width <=992px) {
          font-size: 2.5rem;
        }
      }

      .base-button {
        align-self: center;
        width: max-content;

        transition: ease-in 0.5s;

        &.started {
          opacity: 0;

          @media screen and (width <=576px) {
            display: none;
          }
        }
      }
    }
  }

  .onboarding-content {
    flex: 1;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    margin-top: 128px;
    text-align: center;

    padding: 0 8px;

    max-width: min(100vw, 900px);

    @media screen and (width <=992px) {
      margin-top: 64px;
    }

    @media screen and (width <=768px) {
      margin-top: 32px;
    }

    @media screen and (width <=576px) {
      margin-top: 16px;
    }

    p {
      font-size: 1.5rem;

      &.smol {
        font-size: 1.25rem;
      }
    }

    code {
      padding: 16px 32px;

      background-color: var(--neutral-900);

      font-family: 'Fira Code', "Roboto Mono", monospace;
      font-size: 16px;
      font-variant-ligatures: additional-ligatures;

      color: rgba(var(--white), 0.15);

      border-radius: 4px;

      user-select: all;

      @media screen and (width <=768px) {
        padding: 8px 8px;
      }
    }

    .button-group {
      display: flex;
      gap: 16px;
    }

    .divider {
      width: 90%;
      height: 1px;

      background-color: var(--border);

      margin: 32px 0;

      @media screen and (width <=768px) {
        margin: 16px 0;
      }

      border-radius: 2px;
    }

    .waiting {
      display: flex;
      flex-direction: column;
      align-items: center;

      margin-bottom: 64px;

      .spinner {
        margin-bottom: 16px;
        animation: spin 1.5s linear infinite;
      }

      @keyframes spin {
        100% {
          transform: rotate(360deg);
        }
      }

      .note {
        font-size: 1rem;
        color: rgba(var(--black), 0.75);

        &.extra {
          margin-top: 8px;
        }
      }

      a {
        margin-top: 8px;
      }
    }
  }
}
</style>
