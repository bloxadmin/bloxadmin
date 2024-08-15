<template>
  <div class="outline" ref="root">
    <div class="outline-container">
      <div class="container-view" ref="view">
        <slot />
      </div>

      <!-- To-do: Hide before content loads -->
      <div class="container-side-bar">
        <div class="side-bar-menu">
          <p class="menu-heading">On this page</p>

          <div v-for="section in sections" :key="section.identifier" class="menu-item" :class="{ active: section.identifier === activeSection }" @click="scrollToSection(section.identifier)">{{ capitalize(section.text) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { capitalize } from "../../lib/format";

interface Section {
  identifier: string,
  text: string
}

const view = ref<HTMLElement | null>(null);
const root = ref<HTMLElement | null>(null);

const sections = ref<Section[]>([]);
const activeSection = ref<string | null>(null);

const route = useRoute();
const { replace } = useRouter();

let mutationObserver: MutationObserver;

const hash = computed(() => {
  return route.hash.slice(1);
});

const scrollToSection = (identifier: string): void => {
  const element = document.getElementById(identifier) as HTMLElement;
  (root.value as HTMLElement).scrollTo({ top: element.offsetTop - 32, behavior: "smooth" });
};

const handleScroll = (): void => {
  if (sections.value.length === 0) return;

  const { scrollTop } = root.value as HTMLElement;

  for (const section of sections.value) {
    const element = document.getElementById(section.identifier) as HTMLElement;

    if (scrollTop < element.offsetTop - 32) continue;
    
    activeSection.value = section.identifier;
  }

  // replace({ hash: activeSection.value === sections.value[0].identifier ? "" : "#" + activeSection.value as string });
};

const updateSections = (): void => {
  sections.value = Array.from(view.value?.children as HTMLCollection).filter(child => child.id).map(child => {
    return { 
      identifier: child.id, 
      text: child.id.replaceAll("-", " ") 
    };
  });

  activeSection.value = sections.value.length === 0 ? null : sections.value[0].identifier;

  (root.value as HTMLElement).scrollTo({ top: 0 });

  if (!route.hash) return;
  
  scrollToSection(hash.value);
};

onMounted(() => {
  updateSections();

  mutationObserver = new MutationObserver(updateSections);
  mutationObserver.observe(view.value as HTMLElement, { childList: true });

  (root.value as HTMLElement).addEventListener("scroll", handleScroll);
});

onBeforeUnmount(() => {
  mutationObserver.disconnect();

  (root.value as HTMLElement).removeEventListener("scroll", handleScroll);
});
</script>

<style lang="scss" scoped>
.outline {
  flex-grow: 1;

  overflow: auto;

  height: 100%;

  .outline-container {
    max-width: 1200px;

    padding: 32px;
    
    margin: 0 auto;

    display: flex;
    gap: 32px;

    .container-side-bar {
      width: 192px;

      flex-shrink: 0;

      .side-bar-menu {
        position: sticky;

        top: 32px;
        
        line-height: 1;

        padding-left: 16px;

        p.menu-heading {
          font-size: 12px;
          color: var(--text);
        }

        .menu-item {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);

          margin-top: 8px;

          cursor: pointer;

          position: relative;

          &:hover {
            color: var(--text-active);
          }

          &.active {
            color: var(--primary);

            &::before {
              height: 2px;
              width: 8px;

              background-color: var(--primary);

              position: absolute;

              top: 6px;
              left: -16px;

              content: "";
            }
          }
        }
      }
    }

    .container-view {
      flex-grow: 1;

      display: flex;
      flex-direction: column;

      position: relative;

      gap: 32px;

      padding-bottom: calc(100vh - 128px);
    }
  }
}
</style>
