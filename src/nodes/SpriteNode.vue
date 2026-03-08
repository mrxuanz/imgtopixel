<script setup lang="ts">
import { computed, inject } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { useRuntimeStore } from '../stores/runtime'
import type { SpriteNodeData } from '../types/nodes'
import { useI18n } from '../i18n'

const props = defineProps<{ id: string; data: SpriteNodeData; selected?: boolean }>()
const runtime = useRuntimeStore()
const { removeNodes } = useVueFlow()
const openDrawerFromNode = inject<(nodeId: string) => void>('openDrawerFromNode')
const { t } = useI18n()

const isRunning = computed(() => runtime.runningNodeId === props.id)
</script>

<template>
  <div class="node" :class="{ selected }">
    <Handle type="target" :position="Position.Left" id="in" :connectable-start="false" />

    <div class="node-header vue-flow__node-drag-handle">
      <span class="node-icon-wrap sprite-icon">🧩</span>
      <span class="node-title">{{ t('nodes.sprite') }}</span>
      <span v-if="isRunning" class="running-dot" />
      <button v-if="selected && !isRunning" class="node-del-btn" @click.stop="removeNodes([id])">×</button>
    </div>

    <div class="node-body">
      <span class="node-hint">{{ t('sprite.hint') }}</span>
    </div>

    <Handle type="source" :position="Position.Right" id="out" :connectable-end="false" />
    <div v-if="openDrawerFromNode" class="node-add-wrap">
      <span class="node-add-line" />
      <button
        class="node-add-btn"
        :title="t('nodes.addNext')"
        @click.stop="openDrawerFromNode(id)"
      >+</button>
    </div>
  </div>
</template>

<style scoped>
.node {
  background: #fff;
  border: 1.5px solid #e8e8ef;
  border-radius: 10px; min-width: 230px;
  font-size: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  transition: border-color 0.15s, box-shadow 0.15s;
  position: relative;
}
.node.selected {
  border-color: #637dff;
  box-shadow: 0 0 0 3px rgba(99,125,255,0.18), 0 2px 12px rgba(0,0,0,0.07);
}
.node-header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f5;
  font-weight: 600; font-size: 13px; cursor: grab;
}
.node-icon-wrap {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
}
.sprite-icon { background: rgba(99,190,255,0.16); }
.node-title { flex: 1; color: #222; }
.running-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #637dff; margin-left: auto;
  animation: pulse 1s infinite;
}
@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
.node-del-btn {
  width: 20px; height: 20px; border-radius: 50%;
  border: none; background: #f5f5f8; color: #999;
  font-size: 14px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; padding: 0; transition: background 0.15s, color 0.15s; flex-shrink: 0;
}
.node-del-btn:hover { background: #fee2e2; color: #e53e3e; }
.node-body { padding: 10px 12px; }
.node-hint { color: #aaa; font-size: 11px; }
.node-add-wrap {
  position: absolute;
  left: 100%; top: 50%;
  transform: translateY(-50%);
  display: flex; align-items: center; gap: 6px;
  padding-left: 6px;
  opacity: 0; transition: opacity 0.15s;
  pointer-events: none;
  z-index: 5;
}
.node-add-line {
  width: 16px; height: 2px; border-radius: 2px;
  background: rgba(99,125,255,0.45);
}
.node-add-btn {
  width: 22px; height: 22px; border-radius: 50%;
  border: 1.5px solid #637dff; background: #fff; color: #637dff;
  font-size: 14px; cursor: pointer; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  padding: 0; line-height: 1;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 4px rgba(99,125,255,0.25);
  pointer-events: auto;
}
.node:hover .node-add-wrap,
.node.selected .node-add-wrap { opacity: 1; }
.node-add-btn:hover { background: #637dff; color: #fff; }
</style>
