<template>
  <div class="logs-overview">
    <div class="logs-overview-header">
      <div class="header-text">
        <p class="logs-overview-title">
          Server Logs
        </p>
      </div>
      <div class="logs-overview-live">
        <Loading :size="12" /> Live
      </div>
    </div>

    <div class="logs-overview" ref="scrollBody">
      <LogsRow v-bind="log" v-for="log in logs" :key="log.time + log.message" v-if="logs.length" />
      <p v-else>No Logs Yet</p>
    </div>
  </div>
</template>


<script setup lang="ts">
import { onMounted, onUnmounted, onUpdated, ref } from "vue";
import { Log, getLogsEventSource } from "../../lib/bloxadmin";
import Loading from "../general/Loading.vue";
import LogsRow from "./LogsRow.vue";

interface Props {
  gameIdentifier: string;
  serverIdentifier: string;
}

const props = defineProps<Props>();
const source = ref<EventSource>();
const logs = ref<Log[]>([]);
const scrollBody = ref<HTMLDivElement | undefined>();

function scroll(e: Event) {
  const target = e.target as HTMLDivElement;
  console.log(target.scrollTop, target.scrollHeight - target.clientHeight,);
}

onMounted(() => {
  source.value = getLogsEventSource(props.gameIdentifier, props.serverIdentifier);

  source.value?.addEventListener("message", (event) => {
    const { time, data } = JSON.parse(event.data);

    logs.value.push({ ...data, time });
  });
});

onUpdated(() => {
  if (scrollBody.value) {
    const fromBottom = (scrollBody.value.scrollHeight - scrollBody.value.clientHeight) - scrollBody.value.scrollTop;

    if (fromBottom < 32)
      scrollBody.value.scrollTo(0, scrollBody.value.scrollHeight - scrollBody.value.clientHeight);
  }
})

onUnmounted(() => {
  source.value?.close();
});
</script>

<style scoped lang="scss">
.logs-overview {
  background-color: var(--foreground);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  aspect-ratio: 16 / 9;
  box-shadow: 0 4px 8px rgba(black, 0.025);
  border: 1px solid var(--border);

  .logs-overview-header {
    border-bottom: 1px solid var(--border);

    box-shadow: 0 4px 8px rgba(black, 0.025);

    flex-shrink: 0;

    display: flex;
    align-items: center;

    padding: 16px;

    .header-text {
      display: flex;
      gap: 16px;

      line-height: 1;

      flex-grow: 1;

      .logs-overview-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-title);

        margin-bottom: 4px;
      }
    }

    .logs-overview-live {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--primary);

      background-color: rgba(#ef4444, 0.1);
      border-radius: 4px;

      padding: 4px 16px;

      font-weight: 900;
    }

    > :not(:last-child) {
      margin-right: 8px;
    }
  }

  .logs-overview {
    background-color: var(--neutral-950);
    display: block;

    flex-grow: 1;

    overflow: auto;

    padding: 16px;
  }
}
</style>
