<script setup lang="ts">
import { computed, markRaw, provide, ref } from "vue";
import { Background } from "@vue-flow/background";
import { ConnectionMode, Panel, VueFlow, useVueFlow } from "@vue-flow/core";
import type { Connection, NodeTypesObject } from "@vue-flow/core";
import { nanoid } from "nanoid/non-secure";
import { useGraphConnections } from "../composables/useGraphConnections";
import { useWorkflowPersistence } from "../composables/useWorkflowPersistence";
import { useWorkflowRunner } from "../composables/useWorkflowRunner";
import { useI18n } from "../i18n";
import EdgeWithDelete from "../nodes/EdgeWithDelete.vue";
import AiRemoveBgNode from "../nodes/AiRemoveBgNode.vue";
import PixelateNode from "../nodes/PixelateNode.vue";
import RemoveBgNode from "../nodes/RemoveBgNode.vue";
import UploadNode from "../nodes/UploadNode.vue";
import { useWorkflowStore } from "../stores/workflowList";
import type { CanvasNodeDataMap, CanvasNodeType } from "../types/canvas";

const DEFAULT_DRAG_HANDLE_SELECTOR = ".vue-flow__node-drag-handle";

const workflowStore = useWorkflowStore();
const { t, locale, setLocale, localeOptions } = useI18n();
const workflow = computed(() => workflowStore.activeWorkflow);
const getWorkflow = () => {
  const current = workflow.value;
  if (!current) return null;
  return {
    id: current.id,
    nodes: current.nodes,
    edges: current.edges,
  };
};

const nodeTypes = markRaw({
  upload: UploadNode,
  removebg: RemoveBgNode,
  airemovebg: AiRemoveBgNode,
  pixelate: PixelateNode,
}) as NodeTypesObject;
const edgeTypes = markRaw({ default: EdgeWithDelete });

const {
  addEdges,
  addNodes,
  getNodes,
  removeEdges,
  zoomIn,
  zoomOut,
  fitView,
  viewport,
  vueFlowRef,
} = useVueFlow();

const { saveToStore } = useWorkflowPersistence({
  getWorkflow,
  dragHandleSelector: DEFAULT_DRAG_HANDLE_SELECTOR,
});

const { checkConnection, getOutgoingEdge } = useGraphConnections({
  saveToStore,
});

const { isRunning, handleRun } = useWorkflowRunner({ getWorkflow });

const locked = ref(false);
const drawerOpen = ref(false);
const addFromNodeId = ref<string | null>(null);

function getNodeDefaults(): CanvasNodeDataMap {
  return {
    upload: { label: t("nodes.upload"), files: [] },
    removebg: { label: t("nodes.removeBg"), tolerance: 30 },
    airemovebg: { label: t("nodes.aiRemoveBg") },
    pixelate: {
      label: t("nodes.pixelate"),
      mode: "auto",
      pixelSize: 4,
      targetW: 32,
      targetH: 32,
      pixelMode: "center",
    },
  };
}

function hasUploadNode() {
  return getNodes.value.some((node) => node.type === "upload");
}

function findFreePosition(
  preferX: number,
  preferY: number,
  bounds?: { left: number; top: number; right: number; bottom: number },
): { x: number; y: number } {
  const NODE_W = 240;
  const NODE_H = 120;
  const STEP = 60;
  const PAD = 16;
  const existing = getNodes.value;

  function overlaps(x: number, y: number) {
    return existing.some(
      (node) =>
        Math.abs(node.position.x - x) < NODE_W &&
        Math.abs(node.position.y - y) < NODE_H,
    );
  }

  function clampToView(x: number, y: number) {
    if (!bounds) return { x, y };
    const minX = bounds.left + PAD;
    const minY = bounds.top + PAD;
    const maxX = bounds.right - NODE_W - PAD;
    const maxY = bounds.bottom - NODE_H - PAD;
    if (maxX < minX || maxY < minY) return { x, y };
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }

  const { x, y: clampedY } = clampToView(preferX, preferY);
  let y = clampedY;
  let attempts = 0;
  while (overlaps(x, y) && attempts < 30) {
    y += STEP;
    attempts++;
    if (bounds) {
      const minY = bounds.top + PAD;
      const maxY = bounds.bottom - NODE_H - PAD;
      if (y > maxY) y = minY;
    }
  }
  return { x, y };
}

function getViewBounds() {
  const element = vueFlowRef.value;
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const flowViewport = viewport.value;
  return {
    left: (0 - flowViewport.x) / flowViewport.zoom,
    top: (0 - flowViewport.y) / flowViewport.zoom,
    right: (rect.width - flowViewport.x) / flowViewport.zoom,
    bottom: (rect.height - flowViewport.y) / flowViewport.zoom,
  };
}

function addNode(type: CanvasNodeType, fromNodeId?: string | null) {
  if (!workflow.value) return;
  if (type === "upload" && hasUploadNode()) {
    drawerOpen.value = false;
    addFromNodeId.value = null;
    return;
  }

  const nodeId = `${type}-${nanoid(16)}`;
  let preferX = 200;
  let preferY = 150;
  const existingOutgoing = fromNodeId ? getOutgoingEdge(fromNodeId) : undefined;
  const existingTargetId = existingOutgoing?.target ?? null;

  if (fromNodeId) {
    const sourceNode = getNodes.value.find((node) => node.id === fromNodeId);
    if (sourceNode) {
      preferX = sourceNode.position.x + 320;
      preferY = sourceNode.position.y;
    }
    if (existingOutgoing) {
      removeEdges([existingOutgoing]);
    }
  } else {
    const element = vueFlowRef.value;
    if (element) {
      const rect = element.getBoundingClientRect();
      const flowViewport = viewport.value;
      preferX = (rect.width / 2 - flowViewport.x) / flowViewport.zoom - 120;
      preferY = (rect.height / 2 - flowViewport.y) / flowViewport.zoom - 60;
    }
  }

  const bounds = getViewBounds();
  const position = findFreePosition(preferX, preferY, bounds ?? undefined);
  const defaults = getNodeDefaults();

  addNodes([
    {
      id: nodeId,
      type,
      position,
      data: { ...defaults[type] },
      dragHandle: DEFAULT_DRAG_HANDLE_SELECTOR,
    },
  ]);

  if (fromNodeId) {
    const connection: Connection = {
      source: fromNodeId,
      target: nodeId,
      sourceHandle: "out",
      targetHandle: "in",
    };
    if (checkConnection(connection)) {
      addEdges([connection]);
    }
  }

  if (existingTargetId) {
    const connection: Connection = {
      source: nodeId,
      target: existingTargetId,
      sourceHandle: "out",
      targetHandle: "in",
    };
    if (checkConnection(connection)) {
      addEdges([connection]);
    }
  }

  saveToStore();
  drawerOpen.value = false;
  addFromNodeId.value = null;
}

function openDrawerFromNode(nodeId: string) {
  addFromNodeId.value = nodeId;
  drawerOpen.value = true;
}

function closeDrawer() {
  drawerOpen.value = false;
  addFromNodeId.value = null;
}

function onLocaleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  setLocale(value);
}

provide("openDrawerFromNode", openDrawerFromNode);

defineExpose({ handleRun, isRunning });
</script>

<template>
  <div class="canvas-wrap">
    <VueFlow
      v-if="workflow"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :is-valid-connection="checkConnection"
      :connection-mode="ConnectionMode.Strict"
      :edges-updatable="true"
      :nodes-draggable="!locked"
      :nodes-connectable="!locked"
      :elements-selectable="!locked"
      fit-view-on-init
      class="vue-flow"
    >
      <Background
        pattern-color="var(--canvas-dot-color, #c8c8d0)"
        :gap="20"
        :size="1.5"
      />

      <Panel position="top-right">
        <div class="zoom-bar">
          <button
            class="zoom-btn"
            :title="t('canvas.zoomIn')"
            @click="zoomIn()"
          >
            +
          </button>
          <span class="zoom-label">{{ Math.round(viewport.zoom * 100) }}%</span>
          <button
            class="zoom-btn"
            :title="t('canvas.zoomOut')"
            @click="zoomOut()"
          >
            −
          </button>
          <div class="zoom-divider" />
          <button
            class="zoom-btn"
            :title="t('canvas.fitView')"
            @click="fitView({ padding: 0.2 })"
          >
            ⊡
          </button>
          <select
            class="lang-select"
            :value="locale"
            :aria-label="t('language.label')"
            :title="t('language.label')"
            @change="onLocaleChange"
          >
            <option
              v-for="opt in localeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
          <button
            class="zoom-btn"
            :class="{ active: locked }"
            :title="locked ? t('canvas.unlock') : t('canvas.lock')"
            @click="locked = !locked"
          >
            {{ locked ? "🔒" : "🔓" }}
          </button>
        </div>
      </Panel>

      <Panel position="bottom-center">
        <button class="run-btn" :disabled="isRunning" @click.stop="handleRun">
          {{ isRunning ? t("canvas.running") : t("canvas.run") }}
        </button>
      </Panel>
    </VueFlow>

    <button
      v-if="workflow"
      class="fab-add"
      :title="t('canvas.addNode')"
      @click.stop="
        drawerOpen = !drawerOpen;
        addFromNodeId = null;
      "
    >
      <span class="fab-icon" :class="{ rotated: drawerOpen }">+</span>
    </button>

    <Transition name="drawer">
      <div v-if="drawerOpen" class="node-drawer" @click.stop>
        <div class="drawer-header">
          <span class="drawer-title">{{
            addFromNodeId ? t("canvas.connectNode") : t("canvas.addNode")
          }}</span>
          <button class="drawer-close" @click="closeDrawer">×</button>
        </div>
        <div class="drawer-list">
          <button
            class="drawer-item"
            :disabled="hasUploadNode()"
            @click="addNode('upload', addFromNodeId)"
          >
            <span class="di-icon upload-icon">📁</span>
            <div class="di-info">
              <span class="di-name">{{ t("nodes.upload") }}</span>
              <span class="di-desc">{{ t("nodesDesc.upload") }}</span>
            </div>
          </button>
          <button
            class="drawer-item"
            @click="addNode('removebg', addFromNodeId)"
          >
            <span class="di-icon removebg-icon">✂️</span>
            <div class="di-info">
              <span class="di-name">{{ t("nodes.removeBg") }}</span>
              <span class="di-desc">{{ t("nodesDesc.removeBg") }}</span>
            </div>
          </button>
          <button
            class="drawer-item"
            @click="addNode('airemovebg', addFromNodeId)"
          >
            <span class="di-icon airemovebg-icon">🤖</span>
            <div class="di-info">
              <span class="di-name">{{ t("nodes.aiRemoveBg") }}</span>
              <span class="di-desc">{{ t("nodesDesc.aiRemoveBg") }}</span>
            </div>
          </button>
          <button
            class="drawer-item"
            @click="addNode('pixelate', addFromNodeId)"
          >
            <span class="di-icon pixelate-icon">🎨</span>
            <div class="di-info">
              <span class="di-name">{{ t("nodes.pixelate") }}</span>
              <span class="di-desc">{{ t("nodesDesc.pixelate") }}</span>
            </div>
          </button>
        </div>
      </div>
    </Transition>

    <Transition name="scrim">
      <div v-if="drawerOpen" class="drawer-scrim" @click="closeDrawer" />
    </Transition>

    <div v-if="!workflow" class="empty-state">{{ t("canvas.empty") }}</div>
  </div>
</template>

<style scoped>
.canvas-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  background: #f5f5f7;
}
.vue-flow {
  flex: 1;
  min-height: 0;
  --vf-node-bg: #fff;
  --vf-node-color: #333;
  --vf-connection-path: #637dff;
  --vf-handle: #637dff;
}
:deep(.vue-flow__handle) {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #637dff;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(99, 125, 255, 0.35);
}
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.zoom-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #fff;
  border: 1px solid #e8e8ef;
  border-radius: 8px;
  padding: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.zoom-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s,
    color 0.12s;
  flex-shrink: 0;
}
.zoom-btn:hover {
  background: rgba(99, 125, 255, 0.1);
  color: #637dff;
}
.zoom-btn.active {
  background: rgba(99, 125, 255, 0.12);
  color: #637dff;
}
.zoom-label {
  font-size: 11px;
  color: #888;
  min-width: 36px;
  text-align: center;
  user-select: none;
}
.zoom-divider {
  width: 1px;
  height: 16px;
  background: #e8e8ef;
  margin: 0 2px;
}
.lang-select {
  height: 28px;
  border: 1px solid #e8e8ef;
  border-radius: 6px;
  padding: 0 6px;
  font-size: 11px;
  color: #555;
  background: #fafafa;
  outline: none;
  cursor: pointer;
}
.lang-select:hover {
  border-color: #637dff;
}
.lang-select:focus {
  border-color: #637dff;
  box-shadow: 0 0 0 2px rgba(99, 125, 255, 0.12);
}

.run-btn {
  background: #637dff;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 32px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(99, 125, 255, 0.35);
  transition: opacity 0.15s;
}
.run-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.run-btn:not(:disabled):hover {
  opacity: 0.88;
}

.fab-add {
  position: absolute;
  right: 24px;
  bottom: 72px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #637dff;
  border: none;
  color: #fff;
  box-shadow: 0 4px 16px rgba(99, 125, 255, 0.4);
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    box-shadow 0.15s;
}
.fab-add:hover {
  background: #4f6aee;
  box-shadow: 0 6px 20px rgba(99, 125, 255, 0.5);
}
.fab-icon {
  font-size: 24px;
  line-height: 1;
  display: block;
  transition: transform 0.2s;
}
.fab-icon.rotated {
  transform: rotate(45deg);
}

.node-drawer {
  position: absolute;
  right: 16px;
  bottom: 124px;
  width: 260px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
  z-index: 20;
  overflow: hidden;
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f0f0f4;
}
.drawer-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.drawer-close {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: #f0f0f4;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.12s;
}
.drawer-close:hover {
  background: #e0e0e8;
}
.drawer-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.drawer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
  width: 100%;
}
.drawer-item:hover {
  background: rgba(99, 125, 255, 0.07);
}
.drawer-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.drawer-item:disabled:hover {
  background: none;
}
.di-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.upload-icon {
  background: rgba(99, 125, 255, 0.1);
}
.removebg-icon {
  background: rgba(255, 99, 130, 0.1);
}
.airemovebg-icon {
  background: rgba(99, 125, 255, 0.12);
}
.pixelate-icon {
  background: rgba(99, 200, 130, 0.1);
}
.di-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.di-name {
  font-size: 13px;
  font-weight: 500;
  color: #222;
}
.di-desc {
  font-size: 11px;
  color: #999;
}

.drawer-scrim {
  position: absolute;
  inset: 0;
  z-index: 15;
  background: transparent;
}

.drawer-enter-active,
.drawer-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
.scrim-enter-active,
.scrim-leave-active {
  transition: opacity 0.15s;
}
.scrim-enter-from,
.scrim-leave-to {
  opacity: 0;
}
</style>
