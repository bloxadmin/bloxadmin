<template>
  <div class="navigation-bar">
    <RouterLink to="/games" class="navigation-bar-title">bloxadmin</RouterLink>
    <RouterLink class="navigation-bar-button" v-if="user" :to="{ name: 'Games' }">Games</RouterLink>

    <!-- <RouterLink class="navigation-bar-button" v-if="user" :to="{ name: 'Groups' }">Groups</RouterLink> -->

    <RouterLink class="navigation-bar-button" v-if="user && user.admin" :to="{ name: 'Admin' }">Admin</RouterLink>

    <div class="navigation-bar-spacer" />

    <div class="navigation-bar-button" v-if="user" @click="handleLogoutClick">Log out</div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import useAuthenticationStore from "../../stores/authentication";

const authenticationStore = useAuthenticationStore();
const { user } = storeToRefs(authenticationStore);
const { signOut } = authenticationStore;

const router = useRouter();

const handleLogoutClick = async () => {
  await signOut();

  router.push("/")
};
</script>

<style lang="scss" scoped>
.navigation-bar {
  height: 64px;

  background-color: var(--nav-background);

  display: flex;
  align-items: center;
  gap: 16px;

  padding: 16px;

  .navigation-bar-title {
    font-size: 24px;
    font-weight: 900;
    color: #ffffff
  }

  .navigation-bar-spacer {
    flex-grow: 1;
  }

  .navigation-bar-button {
    font-size: 14px;
    font-weight: 500;
    color: var(--nav-text);
    line-height: 1;

    cursor: pointer;

    &:hover {
    color: var(--nav-text-active);
    }
  }
}
</style>
