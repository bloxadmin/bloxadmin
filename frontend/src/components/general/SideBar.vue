<template>
  <div class="side-bar" :class="{ 'side-bar-collapsed': collapsed }">
    <div class="side-bar-header">
      <div class="side-bar-icon">
        <img :src="`${API_BASE}/roblox/gameIcons/${game.id}`">
      </div>

      <div class="side-bar-name">
        <div class="side-bar-text" :title="props.game.name">{{ props.game.name }}</div>
      </div>

      <SideBarDropdown />
    </div>

    <div class="side-bar-body">
      <!--<SideBarButton :to="{ name: 'Analytics' }" exact>
        <template #icon>
          <TrendingUp :size="16" />
        </template>

        Analytics
      </SideBarButton>-->

      <SideBarButton :to="{ name: 'Servers' }" :permissions="[Permissions.Servers.Servers.List, Permissions.Servers.Metrics.Read]">
        <template #icon>
          <Server :size="16" />
        </template>

        Servers
      </SideBarButton>

      <SideBarButton :to="{ name: 'Players' }" :permissions="[Permissions.Players.Details.List]">
        <template #icon>
          <User :size="16" />
        </template>

        Players
      </SideBarButton>

      <SideBarButton :to="{ name: 'Moderation' }" :permissions="[Permissions.Moderation.Actions.List]">
        <template #icon>
          <ShieldAlert :size="16" />
        </template>

        Moderation
      </SideBarButton>

      <SideBarButton :to="{ name: 'Data' }" :permissions="[Permissions.RemoteConfig.Entries.List, Permissions.Datastores.Datastores.List]">
        <template #icon>
          <Database :size="16" />
        </template>

        Data
      </SideBarButton>

      <SideBarButton v-if="game.features.includes(GameFeature.Actions)" :to="{ name: 'Actions' }" :permissions="[Permissions.Actions.Actions.List]">
        <template #icon>
          <Zap :size="16" />
        </template>

        Actions
      </SideBarButton>

      <SideBarButton v-if="game.features.includes(GameFeature.ErrorOccurrenceTracking)" :to="{ name: 'Errors' }" :permissions="[Permissions.Errors.Errors.List]">
        <template #icon>
          <AlertTriangle :size="16" />
        </template>

        Errors
      </SideBarButton>

      <SideBarButton :to="{ name: 'Settings' }" :notice="notice">
        <template #icon>
          <Settings :size="16" />
        </template>

        Settings
      </SideBarButton>

      <SideBarButton :key="props.game.id" :href="`https://www.roblox.com/games/${props.game.rootPlaceId}`">
        <template #icon>
          <ExternalLink :size="16" />
        </template>

        View on Roblox
      </SideBarButton>

      <SideBarButton href="https://docs.bloxadmin.com">
        <template #icon>
          <Info :size="16" />
        </template>

        Documentation
      </SideBarButton>
    </div>

    <div class="side-bar-footer">
      <SideBarButton @click="toggleCollapsed">
        <template #icon>
          <SidebarOpen :size="16" v-if="collapsed" />

          <SidebarClose :size="16" v-else />
        </template>

        Collapse
      </SideBarButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, Database, ExternalLink, Info, Server, Settings, ShieldAlert, SidebarClose, SidebarOpen, User, Zap } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { API_BASE, Game, GameFeature, Permissions } from "../../lib/bloxadmin";
import SideBarButton from "./SideBarButton.vue";
import SideBarDropdown from "./SideBarDropdown.vue";

interface Props {
  game: Game
}

const props = defineProps<Props>();

const collapsed = ref<boolean>(false);

const notice = computed(() => {
  if (props.game.apiKeySet) return undefined;

  return 'Set your Open Cloud API key';
});

const toggleCollapsed = (): void => {
  collapsed.value = !collapsed.value;
};

watch(() => props.game, () => {
  console.log(props.game);
});
</script>

<style lang="scss" scoped>
.side-bar {
  width: 288px;
  min-width: 288px;

  border-right: 1px solid var(--border);

  box-shadow: 4px 0 8px rgba(black, 0.025);

  background-color: var(--foreground);

  display: flex;
  flex-direction: column;

  overflow: hidden;

  height: 100%;

  &.side-bar-collapsed {
    width: 64px;
    min-width: 64px;
  }

  .side-bar-body {
    padding: 16px;

    flex-grow: 1;

    display: flex;
    flex-direction: column;

    > :not(:last-child) {
      margin-bottom: 8px;
    }

    > :nth-last-child(2) {
      margin-top: auto;
    }
  }

  .side-bar-footer {
    border-top: 1px solid var(--border);

    padding: 16px;
  }

  .side-bar-header {
    border-bottom: 1px solid var(--border);

    padding: 16px;

    position: relative;

    display: flex;
    align-items: center;

    white-space: nowrap;

    .side-bar-name {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      overflow: hidden;
      gap: 4px;
      line-height: 1;

      flex-grow: 1;

      margin: 0 16px;

      .side-bar-tag {
        text-transform: uppercase;
        font-size: 10px;
        font-weight: 500;
        color: var(--text);
      }

      .side-bar-text {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-title);

        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .side-bar-icon {
      flex-shrink: 0;

      display: grid;
      place-items: center;

      overflow: hidden;

      height: 32px;
      width: 32px;

      border-radius: 4px;

      img {
        height: 100%;
        width: 100%;

        object-fit: cover;
      }
    }
  }
}
</style>
