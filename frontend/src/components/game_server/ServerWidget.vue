<template> 
  <div class="server-widget" :class="{ 'server-widget-collapsed': collapsed }">
    <div class="server-widget-header">
      <div class="header-row">
        <div class="row-text">
          <p class="server-widget-title">{{ serverIdentifier }}</p>

          <p class="server-widget-description">{{ description }}</p>
        </div>

        <IconButton :to="{ name: 'Server', params: { serverIdentifier } }">
          <ArrowRight :size="16" />
        </IconButton>

        <IconButton theme="primary" @click="clear(true)">
          <PinOff :size="16" />
        </IconButton>

        <IconButton @click="collapsed = !collapsed">
          <ChevronsUpDown :size="16" v-if="collapsed" />

          <ChevronsDownUp :size="16" v-else />
        </IconButton>
      </div>

      <div class="header-menu">
        <div class="menu-item" :class="{ active: view }" @click="view = true">Chat</div>

        <div class="menu-item" :class="{ active: !view }" @click="view = false">Players</div>
      </div>
    </div>

    <div class="server-widget-body">
      <div class="server-widget-chat" v-show="view">
        <div class="server-widget-view">
          <!-- To-do: Message component -->
          <div v-for="message in messages" class="chat-message">
            <div class="message-header">
              <p class="header-title">{{ message.player.name }}</p>

              <p class="header-description">{{ new Date(message.time).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) }}</p>
            </div>

            <p class="message-text">{{ message.message }}</p>
          </div>

          <!-- To-do: Placeholder -->
        </div>
      </div>

      <div class="server-widget-view" v-show="!view">
        <ServerPlayer :player="player" v-for="player in players" />

        <!-- To-do: Placeholder -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, ChevronsDownUp, ChevronsUpDown, PinOff } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import useChatStore from "../../stores/chat";
import IconButton from "../general/IconButton.vue";
import ServerPlayer from "./ServerPlayer.vue";

const chatStore = useChatStore();
const { clear } = chatStore;
const { messages, players, serverIdentifier, closedAt } = storeToRefs(chatStore);

const collapsed = ref<boolean>(false);
const view = ref<boolean>(true);

const description = computed(() => {
  if (closedAt.value) {
    const date = new Date(closedAt.value);
    const day = date.toLocaleDateString(navigator.language, { month: "long", day: "numeric", year: "numeric" });
    const time = date.toLocaleTimeString(navigator.language, { hour: "numeric", minute: "2-digit" });

    return `Offline since ${day} at ${time}`;
  }

  return players.value.length + (players.value.length === 1 ? " online player" : " online players");
});
</script>

<style lang="scss">
.server-widget {
  position: fixed;

  z-index: 998;

  display: flex;
  flex-direction: column;

  height: 512px;
  width: 512px;

  bottom: 0;
  right: 32px;

  background-color: var(--foreground);

  border-width: 1px 1px 0;
  border-style: solid;
  border-color: var(--border);

  border-radius: 4px 4px 0 0;

  box-shadow: 0 -4px 8px rgba(black, 0.025);

  &.server-widget-collapsed {
    height: 64px;
  }

  .server-widget-header {
    border-bottom: 1px solid var(--border);

    box-shadow: 0 4px 8px rgba(black, 0.025);

    padding: 16px 16px 0;

    .header-row {
      display: flex;
      align-items: center;
      gap: 8px;

      margin-bottom: 16px;

      .row-text {
        line-height: 1;

        flex-grow: 1;

        .server-widget-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-title);
          
          margin-bottom: 4px;
        }

        .server-widget-description {
          font-size: 12px;
          color: var(--text);
        }
      }
    }

    .header-menu {
      display: flex;
      gap: 16px;

      .menu-item {
        height: 24px;

        vertical-align: top;

        cursor: pointer;

        font-size: 14px;
        font-weight: 500;
        color: var(--text);
        line-height: 1;

        &.active {
          border-bottom: 2px solid var(--neutral-900);
        }

        &:hover, &.active {
          color: var(--text-active);
        }
      }
    }
  }

  .server-widget-body {
    flex-grow: 1;

    overflow: hidden;

    .server-widget-view {
      padding: 16px;
    }

    .server-widget-chat {
      display: flex;
      flex-direction: column-reverse;

      overflow: auto;

      height: 100%;

      .chat-message {
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
        }

        &:not(:last-child) {
          margin-bottom: 16px;
        }
      }
    }
  }
}
</style>
