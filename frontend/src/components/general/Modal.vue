<template>
  <div class="modal" v-if="modal === props.identifier">
    <div class="modal-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import useModalStore from "../../stores/modal";

interface Props {
  identifier: string
}

const props = defineProps<Props>();

const modalStore = useModalStore();
const { modal } = storeToRefs(modalStore);
</script>

<style lang="scss" scoped>
.modal {
  position: fixed;

  z-index: 999;

  left: 0;
  top: 0;

  height: 100vh;
  width: 100vw;

  overflow: auto;

  background-color: rgba(black, 0.5);

  .modal-body {
    padding: 16px;

    display: grid;
    place-items: center;

    min-height: 100%;
  }
}
</style>
