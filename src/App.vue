<script setup lang="ts">
import { ref, computed } from "vue";
import {
  NConfigProvider,
  NGlobalStyle,
  NButton,
  NDrawer,
  NDrawerContent,
  NIcon,
} from "naive-ui";
import { MenuOutline, AddOutline, CloseOutline } from "@vicons/ionicons5";
import { useWorkflowStore } from "./stores/workflowList";
import Sidebar from "./components/layout/Sidebar.vue";
import Workspace from "./components/layout/Workspace.vue";
import ResultPanel from "./components/layout/ResultPanel.vue";
import { useI18n } from "./i18n";

const store = useWorkflowStore();
const drawerOpen = ref(false);
const { t } = useI18n();

const activeWorkflow = computed(() => store.activeWorkflow);
</script>

<template>
  <n-config-provider>
    <n-global-style />
    <div class="app-layout">
      <div class="desktop-sidebar">
        <Sidebar
          :workflows="store.workflows"
          :active-id="store.activeId"
          @select="store.activeId = $event"
          @add="store.add()"
          @remove="store.remove($event)"
          @rename="(id, name) => store.rename(id, name)"
        />
      </div>

      <div class="main-area">
        <div class="mobile-topbar">
          <n-button
            text
            size="small"
            @click="drawerOpen = true"
            :aria-label="t('common.openMenu')"
          >
            <template #icon
              ><n-icon size="18"><MenuOutline /></n-icon
            ></template>
          </n-button>
          <span class="mobile-title">{{ activeWorkflow?.name ?? "" }}</span>
        </div>

        <div class="content-area">
          <Workspace />
          <ResultPanel />
        </div>
      </div>

      <n-drawer v-model:show="drawerOpen" :width="240" placement="left">
        <n-drawer-content
          :native-scrollbar="false"
          body-content-style="padding:0"
        >
          <template #header>
            <div class="drawer-header">
              <div class="drawer-brand">
                <img class="drawer-logo" src="/faviconCatz.png" alt="logo" />
              </div>
              <div style="display: flex; gap: 4px">
                <n-button
                  text
                  size="small"
                  @click="store.add()"
                  :aria-label="t('sidebar.new')"
                >
                  <template #icon
                    ><n-icon><AddOutline /></n-icon
                  ></template>
                </n-button>
                <n-button
                  text
                  size="small"
                  @click="drawerOpen = false"
                  :aria-label="t('common.close')"
                >
                  <template #icon
                    ><n-icon><CloseOutline /></n-icon
                  ></template>
                </n-button>
              </div>
            </div>
          </template>
          <Sidebar
            :workflows="store.workflows"
            :active-id="store.activeId"
            hide-header
            @select="
              (id) => {
                store.activeId = id;
                drawerOpen = false;
              }
            "
            @add="store.add()"
            @remove="store.remove($event)"
            @rename="(id, name) => store.rename(id, name)"
          />
        </n-drawer-content>
      </n-drawer>
    </div>
  </n-config-provider>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.desktop-sidebar {
  display: flex;
}
.main-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.mobile-topbar {
  display: none;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--n-border-color, #efeff5);
}
.mobile-title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.content-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
}
.drawer-brand {
  flex: 1;
  min-width: 0;
  height: 28px;
  display: flex;
  align-items: center;
}
.drawer-logo {
  height: 100%;
  max-width: 130px;
  width: auto;
  display: block;
  object-fit: contain;
  object-position: left center;
}
@media (max-width: 768px) {
  .desktop-sidebar {
    display: none;
  }
  .mobile-topbar {
    display: flex;
  }
}
</style>
