<script setup lang="ts">
import WorkflowCanvas from '../WorkflowCanvas.vue'
</script>

<template>
  <WorkflowCanvas class="workspace" />
</template>

<style scoped>
.workspace {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
