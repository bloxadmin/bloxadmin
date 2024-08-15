<template>
  <form class="verify">
    <div class="verify-notification" v-if="error">
      <p class="notification-title">Oops!</p>

      <p class="notification-description">An error occurred while verifying your account. Please try again later.</p>
    </div>

    <div class="verify-accounts">
      <div class="verify-account">
        <svg class="logo roblox" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11.676 0L0 44.166 43.577 56l11.676-44.166L11.676 0zm20.409 35.827l-12.177-3.308 3.264-12.342 12.182 3.308-3.27 12.342z"
            fill="#fff" />
        </svg>
        <template v-if="user">
          <img class="avatar roblox" :src="`${API_BASE}/roblox/avatars/${user.id}?size=352`">
          <p class="verify-account-name">{{ user.name }}</p>
          <p class="verify-account-username">@{{ user.name }}</p>
        </template>
        <template v-else>
          <div class="avatar empty roblox">
            <UserX :size="128" />
          </div>
          <BaseButton @click="robloxSigninRedirect" :active="loading" theme="primary" big>
            <template #icon>
              <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11.676 0L0 44.166 43.577 56l11.676-44.166L11.676 0zm20.409 35.827l-12.177-3.308 3.264-12.342 12.182 3.308-3.27 12.342z"
                  fill="#fff" />
              </svg>
            </template>

            Link Roblox
          </BaseButton>
        </template>
      </div>
      <Plus class="verify-accounts-sep" :size="64" />
      <div class="verify-account">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" class="logo discord">
          <g id="2" data-name="2" fill="#ffffff">
            <g id="Discord_Logos" data-name="Discord Logos">
              <g id="Discord_Logo_-_Large_-_var(--white)" data-name="Discord Logo - Large - var(--white)">
                <path class="cls-1"
                  d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </g>
            </g>
          </g>
        </svg>
        <template v-if="user && user.discord">
          <img class="avatar discord"
            :src="`https://cdn.discordapp.com/avatars/${user.discord.id}/${user.discord.avatar}.png?size=256`">
          <p class="verify-account-name">{{ user.discord.displayName }}</p>
          <p class="verify-account-username">@{{ user.name }}</p>
        </template>
        <template v-else>
          <div class="avatar empty discord">
            <UserX :size="128" />
          </div>
          <BaseButton @click="discordSigninRedirect" :active="loading" theme="discord" :big="true">
            <template #icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" width="30" height="30">
                <g id="2" data-name="2" fill="#ffffff">
                  <g id="Discord_Logos" data-name="Discord Logos">
                    <g id="Discord_Logo_-_Large_-_var(--white)" data-name="Discord Logo - Large - var(--white)">
                      <path class="cls-1"
                        d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                    </g>
                  </g>
                </g>
              </svg>
            </template>

            Link Discord
          </BaseButton>
        </template>
      </div>
    </div>

    <div v-if="user && user.discord" class="verify-verified">
      <p class="verify-verified-title">
        <CheckCircle /> Verified!
      </p>
      <p class="verify-verified-description">Your Discord and Roblox accounts are linked. You can now close this page</p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { CheckCircle, Plus, UserX } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import BaseButton from "../components/general/BaseButton.vue";
import { API_BASE, updateDiscordIntegration } from "../lib/bloxadmin";
import useAuthenticationStore from "../stores/authentication";

const loading = ref<boolean>(false);
const error = ref<boolean>(false);

const { user } = useAuthenticationStore();

const robloxSigninRedirect = () => {
  window.location.href = `${API_BASE}/roblox/link?discord-verify=true`;
}

const discordSigninRedirect = () => {
  window.location.href = `${API_BASE}/discord/verify`;
}

onMounted(() => {
  if (!user) {
    return robloxSigninRedirect();
  }

  if (!user.discord) {
    return discordSigninRedirect();
  }

  updateDiscordIntegration().then((result) => {
    if (!result)
      discordSigninRedirect();
  }).catch(() => {
    error.value = true;
  })
});
</script>

<style lang="scss">
.verify {
  height: calc(100vh - 64px);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .verify-notification {
    padding: 16px;

    border: 1px solid var(--primary);

    margin-bottom: 16px;

    border-radius: 4px;

    padding: 16px;

    background-color: var(--primary-background);

    p.notification-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary);
      line-height: 1;

      margin-bottom: 8px;
    }

    p.notification-description {
      font-size: 12px;
      color: var(--text);
      line-height: 1;
    }
  }

  // >* {
  //   width: 288px;
  // }

  .verify-accounts {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;

    margin-bottom: 32px;

    .verify-accounts-sep {
      color: #373737;
      font-size: 128px;
      font-weight: bolder;
    }

    .verify-account {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;

      .logo {
        position: absolute;
        top: 16px;
        width: 72px;
        height: 72px;
        padding: 8px;
        border-radius: 16px;
        background-color: var(--black);

        &.roblox {
          left: 12px;
          transform: rotate(-4deg);
          background-color: var(--primary);
        }

        &.discord {
          right: 12px;
          transform: rotate(4deg);
          background-color: #5468ff;
        }
      }

      .avatar {
        width: 256px;
        height: 256px;

        border-radius: 256px;

        margin-bottom: 16px;

        border: 8px solid var(--black);

        color: #ffffff;

        &.empty {
          display: flex;
          align-items: center;
          justify-content: center;

          svg {
            opacity: 0.25;
          }
        }

        &.roblox {
          border-color: var(--primary);
          background-color: var(--primary);
        }

        &.discord {
          border-color: #5468ff;
          background-color: #5468ff;
        }
      }

      .verify-account-name {
        font-size: 32px;
        font-weight: bolder;
        color: var(--text-title);
        line-height: 1;
      }

      .verify-account-username {
        font-size: 16px;
        font-weight: 500;
        color: var(--text);
        line-height: 1;
        font-style: italic;
      }
    }

  }

  .verify-verified {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5em;

    .verify-verified-title {
      font-size: 32px;
      font-weight: bolder;
      color: var(--text-title);
      line-height: 1;

      display: flex;
      align-items: center;
      gap: 0.5ch;

      svg {
        width: 32px;
        height: 32px;

        color: #22c55e;
      }
    }

    .verify-verified-description {
      font-size: 16px;
      font-weight: 500;
      color: var(--text);
      line-height: 1;
    }
  }
}
</style>
