<template>
  <ServerWidget v-if="_serverIdentifier && serverIdentifier !== _serverIdentifier" />

  <div class="application">
    <NavigationBar />

    <div class="application-view">
      <Container>
        <h2>Admin</h2>
        <div class="admin-header">
          <BaseButton :to="{ name: 'Admin Games' }" theme="secondary">
            Games
          </BaseButton>
          <BaseButton :to="{ name: 'Admin Users' }" theme="secondary">
            Users
          </BaseButton>
        </div>
      </Container>

      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import ServerWidget from "../../components/game_server/ServerWidget.vue";
import BaseButton from "../../components/general/BaseButton.vue";
import Container from "../../components/general/Container.vue";
import NavigationBar from "../../components/general/NavigationBar.vue";
import useAuthenticationStore from "../../stores/authentication";
import useChatStore from "../../stores/chat";
import useModalStore from "../../stores/modal";

const route = useRoute();
const modals = useModalStore();
const { user } = useAuthenticationStore();

const serverIdentifier = computed(() => {
  return route.params.serverIdentifier;
});

const chatStore = useChatStore();
const { serverIdentifier: _serverIdentifier } = storeToRefs(chatStore);
</script>

<style scoped lang="scss">
.application {
  height: 100vh;

  position: relative;

  background-color: var(--background);

  display: flex;
  flex-direction: column;

  .application-view {
    flex-grow: 1;

    overflow: auto;

    z-index: 1;
  }
}

h2 {
  margin-bottom: 1rem;
}

.admin-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
</style>
