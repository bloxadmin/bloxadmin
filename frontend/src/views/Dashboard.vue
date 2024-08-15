<template>
  <ServerWidget v-if="_serverIdentifier && serverIdentifier !== _serverIdentifier" />

  <div class="application">
    <NavigationBar />

    <div class="application-view">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import ServerWidget from "../components/game_server/ServerWidget.vue";
import NavigationBar from "../components/general/NavigationBar.vue";
import useAuthenticationStore from "../stores/authentication";
import useChatStore from "../stores/chat";
import useModalStore from "../stores/modal";

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
</style>
