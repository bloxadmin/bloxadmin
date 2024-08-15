<template>
  <form class="sign-in">
    <div class="sign-in-notification" v-if="error">
      <p class="notification-title">Oops!</p>

      <p class="notification-description">Incorrect username or password</p>
    </div>

    <div class="sign-in-external">

      <BaseButton @click="roblox" :active="loading" theme="primary">
        <template #icon>
          <svg width="16" height="16" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.676 0L0 44.166 43.577 56l11.676-44.166L11.676 0zm20.409 35.827l-12.177-3.308 3.264-12.342 12.182 3.308-3.27 12.342z" fill="#fff"/>
          </svg>
        </template>

        Sign in with Roblox
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import BaseButton from "../components/general/BaseButton.vue";
import { API_BASE } from "../lib/bloxadmin";

const loading = ref<boolean>(false);
const error = ref<boolean>(false);

const roblox = () => {
  window.location.href = `${API_BASE}/roblox/link`;
}

onMounted(roblox);
</script>

<style lang="scss">
.sign-in {
  height: calc(100vh - 64px);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .sign-in-notification {
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

  > * {
    width: 288px;
  }
  
  .sign-in-footer {
    display: flex;
  }

  .sign-in-label {
    font-size: 12px;
    color: var(--text);
    line-height: 1;

    margin-bottom: 8px;
  }

  input.sign-in-input {
    height: 40px;

    padding: 0 16px;

    background-color: var(--neutral-200);

    border-radius: 4px;

    border: 1px solid var(--border);

    margin-bottom: 16px;

    font-size: 14px;
    color: var(--neutral-900);
    line-height: 1;

    &::placeholder {
      color: var(--text);
    }
  }
}

.sign-in-sep {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;

  &::after, &::before {
    content: "";

    display: block;

    width: 100%;

    height: 1px;

    background-color: var(--text);

    margin: 16px 0;
  }
}
</style>
