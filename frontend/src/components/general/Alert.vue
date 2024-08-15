<template>
  <div class="alert">
    <div class="alert-icon">
      <slot name="icon" />
    </div>
    <div class="alert-content">
      <div class="alert-title">
        <slot name="title" />
      </div>
      <div class="alert-description">
        <slot name="description" />
      </div>
    </div>
    <BaseButton v-if="props.href || props.to" :href="props.href" :to="props.to" theme="primary">
      <template #icon>
        <ArrowRight :size="16" />
      </template>
      <slot name="button" />
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import { RouteLocationRaw } from 'vue-router';
import BaseButton from './BaseButton.vue';


interface Props {
  href?: string;
  to?: RouteLocationRaw;
}

const props = defineProps<Props>();
</script>

<style lang="scss">
.alert {
  display: flex;
  align-items: center;

  gap: 16px;

  padding: 16px;

  border: 1px solid var(--primary);

  margin-bottom: 16px;

  border-radius: 4px;

  padding: 16px;

  background-color: var(--primary-background);

  .alert-icon {
    color: var(--primary);
  }

  .alert-content {
    flex: 1;

    p:not(:last-child) {
      margin-bottom: 8px;
    }

    .alert-title {
      display: inline-flex;
      gap: 1ch;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary);
      line-height: 1;

      margin-bottom: 8px;
    }

    .alert-description {
      font-size: 14px;
      color: var(--primary-text);
      line-height: 1;
    }
  }

  ul {
    padding-left: 0.5rem;
    list-style: none;
    font-weight: 500;
    line-height: 1;
    margin-bottom: 8px;

    li::before {
      content: "•";
      line-height: 1;
      font-size: 1.5rem;
      display: inline-flex;
      width: 0.75em;
    }
  }
}
</style>
