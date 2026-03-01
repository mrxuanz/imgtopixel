<script setup lang="ts">
import { ref, computed } from "vue";
import { NScrollbar, NIcon } from "naive-ui";
import {
  AddOutline,
  EllipsisHorizontalOutline,
  SearchOutline,
} from "@vicons/ionicons5";
import { useI18n } from "../../i18n";

interface WorkflowItem {
  id: string;
  name: string;
}

const props = defineProps<{
  workflows: WorkflowItem[];
  activeId?: string;
  hideHeader?: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  add: [];
  remove: [id: string];
  rename: [id: string, name: string];
}>();

const menuId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const editingName = ref("");
const searchQuery = ref("");
const { t } = useI18n();

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.workflows;
  return props.workflows.filter((w) => w.name.toLowerCase().includes(q));
});

function openMenu(id: string, e: MouseEvent) {
  e.stopPropagation();
  menuId.value = menuId.value === id ? null : id;
}

function closeMenu() {
  menuId.value = null;
}

function startRename(w: WorkflowItem, e: MouseEvent) {
  e.stopPropagation();
  editingId.value = w.id;
  editingName.value = w.name;
  menuId.value = null;
}

function commitRename(id: string) {
  const name = editingName.value.trim();
  if (name) emit("rename", id, name);
  editingId.value = null;
}

function doRemove(id: string, e: MouseEvent) {
  e.stopPropagation();
  menuId.value = null;
  emit("remove", id);
}

const vFocus = { mounted: (el: HTMLElement) => el.focus() };
</script>

<template>
  <aside class="sidebar" @click="closeMenu">
    <div v-if="!hideHeader" class="sidebar-header">
      <div class="sidebar-brand">
        <img class="sidebar-logo" src="/faviconCatz.png" alt="logo" />
      </div>
      <button
        class="icon-btn"
        @click.stop="emit('add')"
        :aria-label="t('sidebar.new')"
        :title="t('sidebar.new')"
      >
        <n-icon size="16"><AddOutline /></n-icon>
      </button>
    </div>

    <div class="search-wrap">
      <n-icon size="13" class="search-icon"><SearchOutline /></n-icon>
      <input
        v-model="searchQuery"
        class="search-input"
        :placeholder="t('sidebar.searchPlaceholder')"
        @click.stop
      />
    </div>

    <n-scrollbar class="sidebar-scroll">
      <ul class="workflow-list" role="listbox">
        <li
          v-for="w in filtered"
          :key="w.id"
          class="workflow-li"
          role="option"
          :aria-selected="activeId === w.id"
        >
          <input
            v-if="editingId === w.id"
            class="rename-input"
            v-model="editingName"
            v-focus
            @blur="commitRename(w.id)"
            @keydown.enter="commitRename(w.id)"
            @keydown.esc="editingId = null"
            @click.stop
          />
          <button
            v-else
            class="workflow-item"
            :class="{ active: activeId === w.id }"
            @click="emit('select', w.id)"
          >
            {{ w.name }}
          </button>

          <div class="menu-wrap" @click.stop>
            <button
              class="more-btn"
              :class="{ active: menuId === w.id }"
              @click="openMenu(w.id, $event)"
            >
              <n-icon size="14"><EllipsisHorizontalOutline /></n-icon>
            </button>
            <Transition name="drop">
              <div v-if="menuId === w.id" class="dropdown">
                <button class="drop-item" @click="startRename(w, $event)">
                  {{ t("common.rename") }}
                </button>
                <button
                  class="drop-item danger"
                  @click="doRemove(w.id, $event)"
                >
                  {{ t("common.delete") }}
                </button>
              </div>
            </Transition>
          </div>
        </li>

        <li v-if="filtered.length === 0" class="empty-hint">
          {{ searchQuery ? t("sidebar.noMatch") : t("sidebar.empty") }}
        </li>
      </ul>
    </n-scrollbar>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #e8e8ef;
  background: #fff;
  height: 100%;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #e8e8ef;
}
.sidebar-brand {
  flex: 1;
  min-width: 0;
  height: 28px;
  display: flex;
  align-items: center;
}
.sidebar-logo {
  height: 100%;
  max-width: 130px;
  width: auto;
  display: block;
  object-fit: contain;
  object-position: left center;
}
.icon-btn {
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition:
    color 0.15s,
    background 0.15s;
}
.icon-btn:hover {
  color: #637dff;
  background: rgba(99, 125, 255, 0.08);
}
.search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--n-border-color, #efeff5);
}
.search-icon {
  color: #aaa;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 12px;
  background: transparent;
  color: inherit;
}
.search-input::placeholder {
  color: #bbb;
}
.sidebar-scroll {
  flex: 1;
}
.workflow-list {
  list-style: none;
  margin: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.workflow-li {
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: 6px;
  position: relative;
}
.workflow-item {
  flex: 1;
  text-align: left;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: inherit;
  transition: background 0.15s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.workflow-item:hover {
  background: rgba(0, 0, 0, 0.06);
}
.workflow-item.active {
  background: rgba(99, 125, 255, 0.12);
  font-weight: 500;
  color: #637dff;
}
.rename-input {
  flex: 1;
  padding: 4px 8px;
  border: 1.5px solid #637dff;
  border-radius: 5px;
  font-size: 13px;
  outline: none;
  background: rgba(99, 125, 255, 0.06);
}
.menu-wrap {
  position: relative;
  flex-shrink: 0;
}
.more-btn {
  border: none;
  background: none;
  cursor: pointer;
  color: #bbb;
  padding: 4px 3px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition:
    color 0.15s,
    background 0.15s;
  opacity: 0;
}
.workflow-li:hover .more-btn,
.more-btn.active {
  opacity: 1;
  color: #666;
}
.more-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}
.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 2px);
  background: #fff;
  border: 1px solid #e0e0e6;
  border-radius: 7px;
  padding: 3px;
  min-width: 96px;
  z-index: 200;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}
.drop-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  border: none;
  background: none;
  border-radius: 5px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.12s;
  color: inherit;
}
.drop-item:hover {
  background: rgba(0, 0, 0, 0.05);
}
.drop-item.danger {
  color: #e53e3e;
}
.drop-item.danger:hover {
  background: rgba(229, 62, 62, 0.08);
}
.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.1s,
    transform 0.1s;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.empty-hint {
  font-size: 12px;
  color: #bbb;
  padding: 8px 10px;
}
</style>
