<template>
  <BaseDropdown no-auto-hide :title="`${label} Player`" size="lg" ref="dropdown" v-if="hasPermission">
    <template #content>
      <form class="moderation-reason-dropdown" @submit="onSubmit">
        <p v-if="error" class="error">{{ error }}</p>
        <div class="input-wrapper">
          <label>Reason</label>
          <input placeholder="No reason" v-model="reason" />
        </div>
        <div class="input-wrapper" v-if="showDuration">
          <label>Duration</label>
          <input placeholder="Forever" v-model="duration" :required="requireDuration" />
        </div>
        <BaseButton theme="primary" :disabled="loading" center type="submit">
          <template #icon>
            <Loading v-if="loading" />

            <Component :is="icon" v-else :size="16" />
          </template>

          {{ label }}
        </BaseButton>
      </form>
    </template>

    <BaseButton :theme="theme" :disabled="loading">
      <template #icon>
        <Loading v-if="loading" />

        <Component :is="icon" v-else :size="16" />
      </template>

      {{ label }}
    </BaseButton>
  </BaseDropdown>
</template>
<script lang="ts" setup>
import { AlertTriangle, Check, LogOut, Siren, Slash, Volume2, VolumeX } from 'lucide-vue-next';
import parse from 'parse-duration';
import { computed, ref } from 'vue';
import { Permissions, Player } from '../../lib/bloxadmin';
import { hasPermissionSync } from '../../lib/permissions';
import BaseButton from '../general/BaseButton.vue';
import BaseDropdown, { DropdownRef } from '../general/BaseDropdown.vue';
import Loading from '../general/Loading.vue';


interface Props {
  gameIdentifier: string,
  type: "mute" | "ban" | "kick" | "warn",
  player: Player,
  click: (reason?: string, duration?: number) => Promise<true | string>
}

const props = defineProps<Props>();

const loading = ref(false);
const reason = ref("");
const duration = ref("");
const error = ref("");
const dropdown = ref<DropdownRef | null>(null);

const label = computed(() => {
  if (props.type === 'kick')
    return "Kick"

  if (props.type === 'warn')
    return "Warn"

  if (props.type === 'ban')
    if (props.player.isBanned)
      return "Unban"
    else
      return "Ban"

  if (props.type === 'mute')
    if (props.player.isMuted)
      return "Unmute"
    else
      return "Mute"

  return "Moderate"
});

const icon = computed(() => {
  if (props.type === 'kick')
    return LogOut

  if (props.type === 'warn')
    return AlertTriangle

  if (props.type === 'ban')
    if (props.player.isBanned)
      return Check
    else
      return Slash

  if (props.type === 'mute')
    if (props.player.isMuted)
      return Volume2
    else
      return VolumeX

  return Siren
});

const theme = computed(() => {
  if (props.type === 'ban')
    return "primary"

  return "secondary";
});

const showDuration = computed(() => {
  if (props.type === 'ban' && !props.player.isBanned)
    return true;

  if (props.type === 'mute' && !props.player.isMuted)
    return true;

  return false;
});

const requireDuration = computed(() => {
  if (props.type === 'ban' && !hasPermissionSync(props.gameIdentifier, [Permissions.Players.Moderation.PermanentBan]))
    return true;

  if (props.type === 'mute' && !hasPermissionSync(props.gameIdentifier, [Permissions.Players.Moderation.PermanentMute]))
    return true;

  return false;
});

const requiredPermission = computed(() => {
  if (props.type === 'kick')
    return Permissions.Players.Moderation.Kick

  if (props.type === 'warn')
    return Permissions.Players.Moderation.Warn

  if (props.type === 'ban')
    if (props.player.isBanned)
      return Permissions.Players.Moderation.Unban
    else
      return Permissions.Players.Moderation.PermanentBan

  if (props.type === 'mute')
    if (props.player.isMuted)
      return Permissions.Players.Moderation.Unmute
    else
      return Permissions.Players.Moderation.TemporaryBan

  return Permissions.Players.Moderation.Update
});

const hasPermission = computed(() => {
  return hasPermissionSync(props.gameIdentifier, [requiredPermission.value]);
});

const onSubmit = (event: Event) => {
  event.preventDefault();

  loading.value = true;
  error.value = "";

  let durationMs = parse(duration.value.trim() || "0");

  console.log(durationMs);
  if (duration.value.trim() && !durationMs) {
    error.value = "Please enter a valid duration";
    loading.value = false;
    return;
  }

  if (durationMs && durationMs < 1000) {
    error.value = "Duration must be at least 1 second";
    loading.value = false;
    return;
  }

  if (durationMs) {
    durationMs /= 1000;
  }

  props.click(reason.value.trim() || undefined, durationMs || undefined).then((result) => {
    if (result === true) {
      reason.value = "";
      duration.value = "";
      dropdown.value?.hide();
    } else {
      error.value = result;
    }
  }).finally(() => {
    loading.value = false;
  });
};
</script>
<style lang="scss" scoped>
.moderation-reason-dropdown {
  display: flex;
  flex-direction: column;
  padding: 0 16px 8px 16px;

  .error {
    font-size: 12px;
    color: var(--primary);
    line-height: 1;

    margin-bottom: 8px;
  }

  .input-wrapper {
    width: 100%;

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
  .base-button {
    margin-top: 16px;
  }
}
</style>
