import { defineStore } from "pinia";
import { ref } from "vue";

const useModalStore = defineStore("modal", () => {
  const modal = ref<string | null>(null);

  const open = (identifier: string): void => {
    modal.value = identifier;
  }

  const close = (): void => {
    modal.value = null;
  };

  return { modal, open, close };
});

export default useModalStore;
