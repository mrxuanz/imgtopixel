<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import { NScrollbar, NIcon } from "naive-ui";
import {
  ChevronDownOutline,
  ChevronUpOutline,
  DownloadOutline,
} from "@vicons/ionicons5";
import { useRuntimeStore } from "../../stores/runtime";
import { useWorkflowStore } from "../../stores/workflowList";
import { imageDataToDataURL } from "../../utils/imageData";
import { useI18n } from "../../i18n";
const props = withDefaults(
  defineProps<{
    minHeight?: number;
    defaultHeight?: number;
  }>(),
  {
    minHeight: 80,
    defaultHeight: 200,
  },
);

const runtime = useRuntimeStore();
const workflowStore = useWorkflowStore();
const height = ref(props.defaultHeight);
const collapsed = ref(false);
const previewUrl = ref<string | null>(null);
const { t } = useI18n();

type LastOutput = {
  nodeId: string;
  urls: string[];
};

const lastOutput = computed<LastOutput | null>(() => {
  const workflow = workflowStore.activeWorkflow;
  if (!workflow) return null;

  const edges = workflow.edges as unknown as Array<{ source: string }>;
  const nodes = workflow.nodes as unknown as Array<{ id: string }>;
  const sourceIds = new Set(edges.map((e) => e.source));
  const terminalIds = nodes
    .filter((n) => !sourceIds.has(n.id))
    .map((n) => n.id);

  for (const nodeId of terminalIds) {
    const output = runtime.nodeOutputs.get(nodeId);
    if (!output) continue;
    const urls =
      output.type === "image-array"
        ? output.data.map(imageDataToDataURL)
        : [imageDataToDataURL(output.data)];
    if (urls.length) return { nodeId, urls };
  }
  return null;
});

function downloadImage(url: string, idx: number) {
  const a = document.createElement("a");
  a.href = url;
  a.download = `output_${idx + 1}.png`;
  a.click();
}

let activeMouseMoveHandler: ((ev: MouseEvent) => void) | null = null;
let activeMouseUpHandler: (() => void) | null = null;
let activeTouchMoveHandler: ((ev: TouchEvent) => void) | null = null;
let activeTouchEndHandler: (() => void) | null = null;

function cleanupDragListeners() {
  if (activeMouseMoveHandler) {
    window.removeEventListener("mousemove", activeMouseMoveHandler);
    activeMouseMoveHandler = null;
  }
  if (activeMouseUpHandler) {
    window.removeEventListener("mouseup", activeMouseUpHandler);
    activeMouseUpHandler = null;
  }
  if (activeTouchMoveHandler) {
    window.removeEventListener("touchmove", activeTouchMoveHandler);
    activeTouchMoveHandler = null;
  }
  if (activeTouchEndHandler) {
    window.removeEventListener("touchend", activeTouchEndHandler);
    activeTouchEndHandler = null;
  }
}

onBeforeUnmount(() => {
  cleanupDragListeners();
});

function onMouseDown(e: MouseEvent) {
  cleanupDragListeners();
  const startY = e.clientY;
  const startH = height.value;
  function onMove(ev: MouseEvent) {
    height.value = Math.max(props.minHeight, startH + (startY - ev.clientY));
  }
  function onUp() {
    cleanupDragListeners();
  }
  activeMouseMoveHandler = onMove;
  activeMouseUpHandler = onUp;
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function onTouchStart(e: TouchEvent) {
  cleanupDragListeners();
  const startTouch = e.touches[0];
  if (!startTouch) return;
  const startY = startTouch.clientY;
  const startH = height.value;
  function onMove(ev: TouchEvent) {
    const touch = ev.touches[0];
    if (!touch) return;
    height.value = Math.max(
      props.minHeight,
      startH + (startY - touch.clientY),
    );
  }
  function onEnd() {
    cleanupDragListeners();
  }
  activeTouchMoveHandler = onMove;
  activeTouchEndHandler = onEnd;
  window.addEventListener("touchmove", onMove);
  window.addEventListener("touchend", onEnd);
}
</script>

<template>
  <div
    class="result-panel"
    :style="{ height: collapsed ? 'auto' : height + 'px' }"
  >
    <div
      v-if="!collapsed"
      class="resize-handle"
      @mousedown="onMouseDown"
      @touchstart.prevent="onTouchStart"
    />

    <div class="result-header">
      <span class="result-title">{{ t("result.title") }}</span>
      <span v-if="lastOutput" class="result-count">{{
        t("result.count", { count: lastOutput.urls.length })
      }}</span>
      <button
        class="icon-btn"
        :aria-label="collapsed ? t('common.expand') : t('common.collapse')"
        @click="collapsed = !collapsed"
      >
        <n-icon size="14">
          <ChevronUpOutline v-if="collapsed" />
          <ChevronDownOutline v-else />
        </n-icon>
      </button>
    </div>

    <n-scrollbar v-if="!collapsed" class="result-scroll">
      <div v-if="lastOutput" class="result-grid">
        <div
          v-for="(url, i) in lastOutput.urls"
          :key="i"
          class="result-cell"
          @click="previewUrl = url"
          :title="t('result.preview')"
        >
          <img :src="url" class="result-img" />
          <button
            class="dl-btn"
            @click.stop="downloadImage(url, i)"
            :title="t('common.download')"
          >
            <n-icon size="12"><DownloadOutline /></n-icon>
          </button>
        </div>
      </div>
      <div v-else class="result-empty">{{ t("result.empty") }}</div>
    </n-scrollbar>
  </div>

  <Teleport to="body">
    <div v-if="previewUrl" class="img-overlay" @click="previewUrl = null">
      <img :src="previewUrl" class="img-overlay-img" @click.stop />
      <button class="img-overlay-close" @click="previewUrl = null">×</button>
    </div>
  </Teleport>
</template>

<style scoped>
.result-panel {
  border-top: 1px solid var(--n-border-color, #efeff5);
  background: var(--n-color, #fff);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.resize-handle {
  height: 6px;
  cursor: row-resize;
  touch-action: none;
  transition: background 0.15s;
}
.resize-handle:hover {
  background: rgba(99, 125, 255, 0.2);
}
.result-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-bottom: 1px solid var(--n-border-color, #efeff5);
}
.result-title {
  font-size: 14px;
  font-weight: 500;
}
.result-count {
  font-size: 12px;
  color: #999;
}
.icon-btn {
  margin-left: auto;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}
.icon-btn:hover {
  color: #637dff;
}
.result-scroll {
  flex: 1;
  min-height: 0;
}
.result-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
}
.result-cell {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e6;
}
.result-cell:hover .dl-btn {
  opacity: 1;
}
.result-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  display: block;
  image-rendering: pixelated;
  background: repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 0 0 / 12px 12px;
}
.dl-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #fff;
  border-radius: 4px;
  padding: 3px 5px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
}
.result-empty {
  padding: 24px 16px;
  font-size: 13px;
  color: #bbb;
  text-align: center;
}
.result-cell {
  cursor: zoom-in;
}
</style>

<style>
.img-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}
.img-overlay-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 6px;
  image-rendering: pixelated;
  cursor: default;
}
.img-overlay-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-overlay-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
