<template>
  <span ref="element" style="background-color: var(--neutral-900)">
    <slot />
  </span>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';

import hljs from "highlight.js/lib/core";
import lua from "highlight.js/lib/languages/lua";
import "highlight.js/styles/github-dark.css";

hljs.registerLanguage("lua", lua);

const _element = ref<HTMLElement | null>(null);
const element = computed({
  get() {
    return _element.value;
  },
  set(value) {
    _element.value = value;

    if (value) {
      hljs.highlightElement(value);
    }
  }
});
</script>
