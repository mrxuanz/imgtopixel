<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useVueFlow } from '@vue-flow/core'
import type { EdgeProps } from '@vue-flow/core'
import { useI18n } from '../i18n'

const props = defineProps<EdgeProps>()

const { removeEdges } = useVueFlow()
const { t } = useI18n()

const pathData = computed(() => {
  const [path, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  })
  return { path, labelX, labelY }
})
</script>

<template>
  <BaseEdge
    :id="id"
    :path="pathData.path"
    :marker-end="markerEnd"
    :style="style"
  />
  <EdgeLabelRenderer v-if="selected">
    <div
      class="edge-toolbar"
      :style="{
        transform: `translate(-50%, -50%) translate(${pathData.labelX}px, ${pathData.labelY}px)`,
      }"
    >
      <button class="edge-del-btn" :title="t('edge.delete')" @click.stop="removeEdges([id])">×</button>
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.edge-toolbar {
  position: absolute;
  pointer-events: all;
}
.edge-del-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #e53e3e;
  background: #fff;
  color: #e53e3e;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  transition: background 0.15s;
  padding: 0;
}
.edge-del-btn:hover {
  background: #e53e3e;
  color: #fff;
}
</style>
