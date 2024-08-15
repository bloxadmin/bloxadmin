<template>
  <div class="server-overview" :class="{ 'server-overview-maximized': maximized }">
    <div class="server-overview-header">
      <div class="header-text">
        <p class="server-overview-title">{{ props.server.privateServerId || props.server.id }}</p>

        <p class="server-overview-description" v-if="server.closedAt">{{ description }}</p>
        <p class="server-overview-description" v-else>{{ description }} -
          <Length :from="server.startedAt" />
        </p>
      </div>

      <WithPermission :has="[Permissions.Servers.Actions.Shutdown]">
        <ConfirmationButton v-if="!closedAt" v-slot="{ handleClick }" @click="shutdown">
          <BaseButton theme="primary" :disabled="shuttingDown" @click="handleClick">
            <template #icon>
              <PowerOff :size="16" />
            </template>

            Shutdown
          </BaseButton>
        </ConfirmationButton>
      </WithPermission>

      <IconButton @click="togglePinned">
        <PinOff :size="16" v-if="pinned" />

        <Pin :size="16" v-else />
      </IconButton>

      <IconButton @click="toggleMaximized">
        <Minimize :size="16" v-if="maximized" />

        <Maximize :size="16" v-else />
      </IconButton>
    </div>

    <div class="server-overview-body">
      <div class="server-overview-view">
        <div class="server-overview-chat">
          <div v-for="message in messages" class="chat-message">
            <div class="message-header">
              <p class="header-title">{{ message.player.name }}</p>

              <p class="header-description">{{ new Date(message.time).toLocaleDateString(undefined, {
                month: "short", day:
                  "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
              }) }}</p>
            </div>

            <p class="message-text">{{ message.message }}</p>
          </div>
        </div>

        <!-- To-do: Placeholder -->
      </div>

      <div class="server-overview-side-bar">
        <ServerPlayer :player="player" v-for="player in players" />

        <!-- To-do: Placeholder -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Maximize, Minimize, Pin, PinOff, PowerOff } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { Message, Permissions, Player, Server, getChat, getServerEventSource, shutdownServer } from "../../lib/bloxadmin";
import { hasPermission } from "../../lib/permissions";
import useChatStore from "../../stores/chat";
import BaseButton from "../general/BaseButton.vue";
import ConfirmationButton from "../general/ConfirmationButton.vue";
import IconButton from "../general/IconButton.vue";
import Length from "../general/Length.vue";
import WithPermission from "../misc/WithPermission.vue";
import ServerPlayer from "./ServerPlayer.vue";

interface Props {
  server: Server,
  gameIdentifier: string
}

const props = defineProps<Props>();

const chatStore = useChatStore();
const chat = storeToRefs(chatStore);
const { setServer, clear, eventSource } = chatStore;

let _eventSource: EventSource | null = null;

const _players = ref<Player[]>([]);
const _messages = ref<Message[]>([]);

const _closedAt = ref<string | null>(props.server.closedAt || null);

const maximized = ref<boolean>(false);
const loading = ref<boolean>(false);
const shuttingDown = ref<boolean>(false);

const description = computed(() => {
  if (closedAt.value) {
    const date = new Date(closedAt.value);
    const day = date.toLocaleDateString(navigator.language, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const time = date.toLocaleTimeString(navigator.language, { hour: "numeric", minute: "2-digit" });

    return `Offline since ${day} at ${time}`;
  }

  return (props.server.isPrivate ? 'Private Server - ' : '') + players.value.length + (players.value.length === 1 ? " online player" : " online players");
});

const pinned = computed(() => {
  return chat.serverIdentifier.value === props.server.id;
});

const players = computed(() => {
  return pinned.value ? chat.players.value : _players.value;
});

const messages = computed(() => {
  return pinned.value ? chat.messages.value : _messages.value;
});

const closedAt = computed(() => {
  return pinned.value ? chat.closedAt.value : _closedAt.value;
});

const togglePinned = () => {
  if (pinned.value) {
    _players.value = chat.players.value;
    _messages.value = chat.messages.value;

    _eventSource = eventSource as EventSource;
    _eventSource?.addEventListener("message", handleMessage);

    _closedAt.value = chat.closedAt.value;

    clear(true);

    return;
  }

  setServer(props.gameIdentifier, props.server.id, _players.value, _messages.value, _eventSource as EventSource, _closedAt.value);

  _players.value = [];
  _messages.value = [];

  _closedAt.value = null;

  _eventSource?.removeEventListener("message", handleMessage);
  _eventSource = null;
};

const toggleMaximized = (): void => {
  maximized.value = !maximized.value;
};

const shutdown = async (): Promise<void> => {
  shuttingDown.value = true;

  const { ok } = await shutdownServer(props.gameIdentifier, props.server.id);

  if (ok) return;

  // To-do: Error
};

const handleMessage = (event: MessageEvent): void => {
  const { type, time, data } = JSON.parse(event.data);

  if (type === "playerJoin") {
    _players.value.push(data.player);
  }

  if (type === "playerLeave") {
    const index = _players.value.findIndex(player => player.id === data.playerId);
    _players.value.splice(index as number, 1);
  }

  if (type === "playerChat") {
    const { message, playerId } = data;
    const player = _players.value.find(player => player.id === playerId) as Player;
    _messages.value.push({ time, message, player });
  }

  if (type === "serverClose") {
    _closedAt.value = time;
  }
}

onMounted(async () => {
  if (pinned.value) return;

  loading.value = true;

  _players.value = props.server.onlinePlayers;

  if (await hasPermission(props.gameIdentifier, [Permissions.Servers.Chat.Read])) {
    const { body } = await getChat(props.gameIdentifier, props.server.id);

    if (!body) {
      // To-do: Error

      return;
    }

    _messages.value = body.data.reverse();

    _eventSource = getServerEventSource(props.gameIdentifier, props.server.id);
    _eventSource.addEventListener("message", handleMessage);
  }

  loading.value = false;
});

onUnmounted(() => {
  eventSource?.close();
});
</script>

<style lang="scss">
.server-overview {
  background-color: var(--foreground);

  overflow: hidden;

  display: flex;
  flex-direction: column;

  &:not(.server-overview-maximized) {
    border-radius: 4px;

    aspect-ratio: 16 / 9;

    box-shadow: 0 4px 8px rgba(black, 0.025);

    border: 1px solid var(--border);
  }

  &.server-overview-maximized {
    position: fixed;

    z-index: 999;

    height: 100vh;
    width: 100vw;

    left: 0;
    top: 0;
  }

  .server-overview-header {
    border-bottom: 1px solid var(--border);

    box-shadow: 0 4px 8px rgba(black, 0.025);

    flex-shrink: 0;

    display: flex;
    align-items: center;

    padding: 16px;

    .header-text {
      line-height: 1;

      flex-grow: 1;

      margin-right: 16px;

      .server-overview-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-title);

        margin-bottom: 4px;
      }

      .server-overview-description {
        font-size: 12px;
        color: var(--text);
      }
    }

    > :not(:last-child) {
      margin-right: 8px;
    }
  }

  .server-overview-body {
    display: flex;
    align-items: stretch;

    flex-grow: 1;

    overflow: hidden;

    .server-overview-view {
      display: flex;
      flex-direction: column-reverse;

      flex-grow: 1;

      overflow: auto;

      .server-overview-chat {
        padding: 16px 0;

        .chat-message {
          padding: 0 16px;

          &:not(:hover) .message-header .header-description {
            display: none;
          }

          .message-header {
            display: flex;

            margin-bottom: 4px;

            line-height: 1;
            font-size: 12px;

            .header-title {
              font-weight: 500;
              color: var(--text-title);

              margin-right: 8px;
            }

            .header-description {
              color: var(--neutral-300);
            }
          }

          .message-text {
            font-size: 14px;
            color: var(--text);

            word-break: break-all;
          }

          &:not(:last-child) {
            margin-bottom: 16px;
          }
        }
      }
    }

    .server-overview-side-bar {
      width: 288px;

      flex-shrink: 0;

      border-left: 1px solid var(--border);

      display: flex;
      flex-direction: column;
      gap: 16px;

      padding: 16px;

      overflow: auto;
    }
  }
}
</style>
