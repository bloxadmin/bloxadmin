<template>
  <pre class="log-message"><code :class="messageType"><span class="time" :data-value="props.time">{{ time }}</span> <span class="type">{{ type }}</span> <span class="message">{{ message }}</span></code></pre>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { Log } from '../../lib/bloxadmin';

const props = defineProps<Log>();

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

const time = computed(() => {
  const date = new Date(props.time);

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
});

const type = computed(() => {
  switch (props.messageType) {
    case 'MessageOutput':
      return " INFO";
    case 'MessageWarning':
      return " WARN"
    case 'MessageError':
      return "ERROR";
    case 'MessageInfo':
      return "STACK";
  }
});

</script>
<style lang="scss" scoped>
pre.log-message code {
  display: inline;
  font-family: 'Fira Code', "Roboto Mono", monospace;
  font-size: 14px;
  font-variant-ligatures: additional-ligatures;

  color: rgba(var(--white), 0.25);

  .message {
    color: var(--neutral-50);
  }

  &.MessageWarning {
    color: var(--orange-200);

    .message {
      color: var(--orange-400);
    }
  }

  &.MessageError {
    color: var(--red-200);

    .message {
      color: var(--red-400);
    }
  }

  &.MessageInfo {
    color: var(--sky-200);

    .message {
      color: var(--sky-400);
    }
  }
}
</style>
