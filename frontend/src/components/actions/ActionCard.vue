<template>
  <RouterLink :to="{ name: 'Action', params: { gameIdentifier: gameIdentifier, action: action.name } }"
    class="action-card">
    <div class="action-card-start">
      <div class="action-card-header">
        <h2>{{ action.name }}</h2>
        <!-- <h3 v-if="action.description">{{ action.description }}</h3> -->
      </div>
      <div class="action-card-info">
        <div class="action-card-info-name">
          Parameters
        </div>
        <div class="action-card-info-count">
          <div class="action-parameter-badge"
            v-for="param in action.parameters.slice(0, action.parameters.length > MAX_PARAMETERS ? MAX_PARAMETERS - 1 : MAX_PARAMETERS)">
            <span class="action-parameter-name">{{ param.name }}{{ param.required ? "" : "?" }}:</span>
            <span class="action-parameter-type">{{ param.type }}</span>
          </div>
          <div class="action-parameter-badge" v-if="action.parameters.length > MAX_PARAMETERS">
            +{{ action.parameters.length - MAX_PARAMETERS + 1 }} more
          </div>
        </div>
      </div>
    </div>
    <div class="action-card-end">
      <div class="action-card-info">
        <div class="action-card-info-name">
          Created
        </div>
        <div class="action-card-info-count">
          {{ new Date(action.created).toLocaleDateString() }}
        </div>
      </div>
      <div class="action-card-info">
        <div class="action-card-info-name">
          Listening Servers
        </div>
        <div class="action-card-info-count">
          {{ action.active_server_count }}
        </div>
      </div>
      <div class="button-group">
        <BaseButton theme="primary">View</BaseButton>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { Action } from 'src/lib/bloxadmin';
import BaseButton from '../general/BaseButton.vue';
import { RouterLink } from 'vue-router';

const MAX_PARAMETERS = 4;

interface Props {
  gameIdentifier: string;
  action: Action;
}

defineProps<Props>();
</script>
<style lang="scss" scoped>
.action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;

  border-radius: 4px;
  padding: 16px 32px;

  border: 1px solid var(--border);
  background-color: var(--foreground);
  box-shadow: 0 4px 8px rgba(black, 0.025);
  color: var(--text);

  .action-card-header {
    h2 {
      margin: 0;
      font-size: 1.2rem;
      font-family: 'Fira Code', "Roboto Mono", monospace;
      color: var(--text-title);
    }

    h3 {
      margin: 0;
      font-size: 0.8rem;
      color: var(--text);
      max-width: 350px;
    }
  }

  .action-card-info {
    .action-card-info-name {
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .action-card-info-count {
      margin: 0;
      font-size: 1rem;
      display: flex;
      gap: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .action-parameter-badge {
    display: flex;
    gap: 4px;
    background-color: var(--background);
    color: var(--text-muted);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;

    .action-parameter-name {
      font-weight: bold;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .action-parameter-type {
      font-family: 'Fira Code', "Roboto Mono", monospace;
    }
  }

  .action-card-end,
  .action-card-start {
    display: flex;
    align-items: center;
    gap: 16px;
    justify-content: flex-end;


    .button-group {
      display: flex;
      gap: 8px;
      margin-left: 16px;
    }
  }
}
</style>
