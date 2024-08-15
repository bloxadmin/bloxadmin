<template>
  <span ref="element" style="background-color: var(--foreground)">
    <slot />
  </span>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';

import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";

// check for darkmode
const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (dark) {
  import("highlight.js/styles/github-dark.css");
} else {
  import("highlight.js/styles/github.css");
}

hljs.registerLanguage("json", json);

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
