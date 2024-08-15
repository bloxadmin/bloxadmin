<template>
  <div class="no-entry">
    <p class="title">No entry selected</p>
    <p class="subtitle">Select an entry to view it's contents</p>
  </div>
</template>
<style lang="scss" scoped>
.no-entry {
  flex: 1;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  height: 100%;

  padding: 32px;

  text-align: center;

  .title {
    font-size: 24px;
    font-weight: 500;
    color: var(--text-title);
  }

  .subtitle {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
  }
}
</style>
