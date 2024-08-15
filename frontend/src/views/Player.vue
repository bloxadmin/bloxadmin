<template>
  <template v-if="player">
    <!-- To-do: Player overview component -->
    <div id="overview">
      <div class="player">
        <div class="player-icon">
          <img :src="`${API_BASE}/roblox/avatars/${player.id}`" alt="Player Avatar" />
        </div>

        <div class="player-text">
          <p class="player-title">{{ player.name }}</p>

          <p class="player-description">{{ player.isOnline ? "Online" : "Offline" }}</p>
        </div>

        <a :href="`https://www.roblox.com/users/${player.id}/profile`" target="_blank">
          <IconButton theme="secondary">
            <ExternalLink :size="16" />
          </IconButton>
        </a>

        <WithPermission :one-of="[Permissions.Servers.Servers.List]">
          <IconButton v-if="player.serverId" theme="secondary"
            :to="{ name: 'Server', params: { serverIdentifier: player.serverId } }">
            <ArrowRight :size="16" />
          </IconButton>
        </WithPermission>

        <ModerationActionButton :game-identifier="gameIdentifier" :player="player" type="mute" :click="toggleMuted" />
        <ModerationActionButton :game-identifier="gameIdentifier" :player="player" type="kick" :click="kickPlayer"
          v-if="player.isOnline" />
        <ModerationActionButton :game-identifier="gameIdentifier" :player="player" type="ban" :click="toggleBanned" />
      </div>
    </div>

    <!--<div id="statistics">

    </div>-->

    <div id="sessions">
      <SessionTable :gameIdentifier="gameIdentifier" :playerIdentifier="playerIdentifier" />
    </div>

    <WithPermission :has="[Permissions.Players.Moderation.List]">
      <div id="moderator-actions">
        <ModeratorActionTable :gameIdentifier="gameIdentifier" :playerIdentifier="playerIdentifier" ref="modTable" />
      </div>
    </WithPermission>
  </template>

  <!-- To-do: Loading indicator -->
</template>

<script setup lang="ts">
import { ArrowRight, ExternalLink } from "lucide-vue-next";
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import IconButton from "../components/general/IconButton.vue";
import WithPermission from "../components/misc/WithPermission.vue";
import ModerationActionButton from "../components/moderation/ModerationActionButton.vue";
import ModeratorActionTable from "../components/moderation/ModeratorActionTable.vue";
import SessionTable from "../components/players/SessionTable.vue";
import { API_BASE, Permissions, Player, ban, getPlayer, kick, mute, unban, unmute } from "../lib/bloxadmin";

interface Props {
  gameIdentifier: string,
  playerIdentifier: string
}

const props = defineProps<Props>();

const router = useRouter();

const player = ref<Player | null>(null);
const modTable = ref<{ update: () => void } | null>(null);

const toggleBanned = async (reason?: string, duration?: number) => {
  if (!player.value) return "Player not found";

  const { ok, raw } = player.value.isBanned
    ? await unban(props.gameIdentifier, props.playerIdentifier, reason)
    : await ban(props.gameIdentifier, props.playerIdentifier, reason, duration);

  if (!ok) {
    return raw;
  }

  player.value.isBanned = !player.value.isBanned;
  modTable.value?.update();

  return true;
};

const kickPlayer = async (reason?: string) => {
  if (!player.value) return "Player not found";

  const { ok, raw } = await kick(props.gameIdentifier, props.playerIdentifier, reason);

  if (!ok) {
    return raw;
  }

  player.value.isOnline = false;
  modTable.value?.update();

  return true;
};

const toggleMuted = async (reason?: string, duration?: number) => {
  if (!player.value) return "Player not found";

  const { ok, raw } = player.value.isMuted
    ? await unmute(props.gameIdentifier, props.playerIdentifier, reason)
    : await mute(props.gameIdentifier, props.playerIdentifier, reason, duration);

  if (!ok) {
    return raw;
  }

  player.value.isMuted = !player.value.isMuted;
  modTable.value?.update();

  return true;
};

const updatePlayer = async (): Promise<void> => {
  player.value = null;

  const { body } = await getPlayer(props.gameIdentifier, props.playerIdentifier);

  if (!body) {
    router.push({ name: "Players" });

    return;
  }

  player.value = body;
};

watch(() => props.playerIdentifier, updatePlayer);

onMounted(updatePlayer);
</script>

<style lang="scss" scoped>
.player {
  display: flex;
  gap: 8px;

  padding: 16px;

  background-color: var(--foreground);

  border: 1px solid var(--border);

  border-radius: 4px;

  box-shadow: 0 4px 8px rgba(black, 0.025);

  .player-icon {
    height: 32px;
    width: 32px;

    background-color: var(--neutral-200);

    border-radius: 4px;

    display: grid;
    place-items: center;
  }

  .player-text {
    flex-grow: 1;

    padding: 0 8px;

    line-height: 1;

    p.player-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-title);

      margin-bottom: 4px;
    }

    p.player-description {
      font-size: 12px;
      color: var(--text);
    }
  }
}
</style>
