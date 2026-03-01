<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { Handle, Position, useVueFlow } from "@vue-flow/core";
import type { UploadNodeData } from "../types/nodes";
import { useI18n } from "../i18n";

const props = defineProps<{
  id: string;
  data: UploadNodeData;
  selected?: boolean;
}>();
const { updateNodeData, removeNodes } = useVueFlow();
const openDrawerFromNode =
  inject<(nodeId: string) => void>("openDrawerFromNode");
const { t } = useI18n();

const isDragging = ref(false);
const inputId = `upload-input-${props.id}`;
const previewUrl = ref<string | null>(null);

const filePreviews = computed(
  () => props.data.files?.map((f) => f.dataURL) ?? [],
);

function onDrop(e: DragEvent) {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
    f.type.startsWith("image/"),
  );
  loadFiles(files);
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []).filter((f) =>
    f.type.startsWith("image/"),
  );
  loadFiles(files);
  input.value = "";
}

function loadFiles(files: File[]) {
  const readers = files.map(
    (f) =>
      new Promise<{ name: string; dataURL: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({ name: f.name, dataURL: reader.result as string });
        reader.readAsDataURL(f);
      }),
  );
  Promise.all(readers).then((loaded) => {
    updateNodeData(props.id, {
      ...props.data,
      files: [...(props.data.files ?? []), ...loaded],
    });
  });
}

function removeFile(idx: number) {
  const files = [...(props.data.files ?? [])];
  files.splice(idx, 1);
  updateNodeData(props.id, { ...props.data, files });
}
</script>

<template>
  <div class="node upload-node" :class="{ selected }">
    <div class="node-header vue-flow__node-drag-handle">
      <span class="node-icon-wrap">📁</span>
      <span class="node-title">{{ t("nodes.upload") }}</span>
      <button
        v-if="selected"
        class="node-del-btn"
        :title="t('nodes.deleteNode')"
        @click.stop="removeNodes([id])"
      >
        ×
      </button>
    </div>

    <label
      :for="inputId"
      class="drop-zone"
      :class="{ dragging: isDragging }"
      @dragover.prevent.stop="isDragging = true"
      @dragleave.stop="isDragging = false"
      @drop.prevent.stop="onDrop"
    >
      <span v-if="!data.files?.length">{{ t("upload.drop") }}</span>
      <span v-else>{{
        t("upload.addMore", { count: data.files.length })
      }}</span>
    </label>
    <input
      :id="inputId"
      type="file"
      multiple
      accept="image/*"
      style="display: none"
      @change="onFileInput"
    />

    <div v-if="filePreviews.length" class="preview-grid">
      <div
        v-for="(url, i) in filePreviews"
        :key="i"
        class="preview-cell"
        @click.stop="previewUrl = url"
        :title="t('upload.zoom')"
      >
        <img :src="url" class="preview-thumb" />
        <button
          class="thumb-del"
          @click.stop="removeFile(i)"
          :title="t('upload.removeFile')"
        >
          ×
        </button>
      </div>
    </div>

    <Handle
      type="source"
      :position="Position.Right"
      id="out"
      :connectable-end="false"
    />
    <div v-if="openDrawerFromNode" class="node-add-wrap">
      <span class="node-add-line" />
      <button
        class="node-add-btn"
        :title="t('nodes.addNext')"
        @click.stop="openDrawerFromNode(id)"
      >
        +
      </button>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="previewUrl" class="img-overlay" @click="previewUrl = null">
      <img :src="previewUrl" class="img-overlay-img" @click.stop />
      <button class="img-overlay-close" @click="previewUrl = null">×</button>
    </div>
  </Teleport>
</template>

<style scoped>
.node {
  background: #fff;
  border: 1.5px solid #e8e8ef;
  border-radius: 10px;
  min-width: 230px;
  font-size: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  position: relative;
}
.node.selected {
  border-color: #637dff;
  box-shadow:
    0 0 0 3px rgba(99, 125, 255, 0.18),
    0 2px 12px rgba(0, 0, 0, 0.07);
}
.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f5;
  font-weight: 600;
  font-size: 13px;
  cursor: grab;
}
.node-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: rgba(99, 125, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}
.node-title {
  flex: 1;
  color: #222;
}
.node-del-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: #f5f5f8;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;
}
.node-del-btn:hover {
  background: #fee2e2;
  color: #e53e3e;
}
.drop-zone {
  display: block;
  margin: 10px;
  border: 1.5px dashed #d0d0da;
  border-radius: 7px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  color: #aaa;
  transition:
    border-color 0.15s,
    background 0.15s;
  user-select: none;
  font-size: 12px;
}
.drop-zone.dragging,
.drop-zone:hover {
  border-color: #637dff;
  background: rgba(99, 125, 255, 0.05);
  color: #637dff;
}
.preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 10px 10px;
}
.preview-cell {
  position: relative;
  width: 40px;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ebebf0;
  flex-shrink: 0;
}
.preview-cell:hover {
  border-color: #637dff;
}
.preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  display: block;
}
.thumb-del {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}
.preview-cell:hover .thumb-del {
  display: flex;
}
.node-add-wrap {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 6px;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
  z-index: 5;
}
.node-add-line {
  width: 16px;
  height: 2px;
  border-radius: 2px;
  background: rgba(99, 125, 255, 0.45);
}
.node-add-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid #637dff;
  background: #fff;
  color: #637dff;
  font-size: 14px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  transition:
    background 0.15s,
    color 0.15s,
    box-shadow 0.15s;
  box-shadow: 0 1px 4px rgba(99, 125, 255, 0.25);
  pointer-events: auto;
}
.node:hover .node-add-wrap,
.node.selected .node-add-wrap {
  opacity: 1;
}
.node-add-btn:hover {
  background: #637dff;
  color: #fff;
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
