import { defineStore } from "pinia";
import type { StateTree } from "pinia";
import { ref, watchEffect } from "vue";
import type { Workflow } from "../types/workflow";
import type { Node, Edge } from "@vue-flow/core";
import { nanoid } from "nanoid/non-secure";
import { t } from "../i18n";

const WORKFLOW_PERSIST_KEY = "pixel-workflows";

function safeRandomId(): string {
  return nanoid(16);
}

function createWorkflow(name: string): Workflow {
  const uploadNodeId = safeRandomId();
  return {
    id: safeRandomId(),
    name,
    nodes: [
      {
        id: uploadNodeId,
        type: "upload",
        position: { x: 80, y: 120 },
        data: { label: t("nodes.upload"), files: [] },
      },
    ],
    edges: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createPixelateRemoveBgWorkflow(name: string): Workflow {
  const uploadNodeId = safeRandomId();
  const pixelateNodeId = `pixelate-${safeRandomId()}`;
  const removeBgNodeId = `removebg-${safeRandomId()}`;

  return {
    id: safeRandomId(),
    name,
    nodes: [
      {
        id: uploadNodeId,
        type: "upload",
        position: { x: -85, y: 107 },
        data: { label: t("nodes.upload"), files: [] },
      },
      {
        id: pixelateNodeId,
        type: "pixelate",
        position: { x: 173, y: 84 },
        data: {
          label: t("nodes.pixelate"),
          mode: "auto",
          pixelSize: 4,
          targetW: 32,
          targetH: 32,
          pixelMode: "center",
        },
      },
      {
        id: removeBgNodeId,
        type: "removebg",
        position: { x: 149.41668701171875, y: 225.5 },
        data: {
          label: t("nodes.removeBg"),
          tolerance: 80,
        },
      },
    ],
    edges: [
      {
        id: `vueflow__edge-${uploadNodeId}out-${pixelateNodeId}in`,
        type: "default",
        source: uploadNodeId,
        target: pixelateNodeId,
        sourceHandle: "out",
        targetHandle: "in",
        data: {},
        label: "",
      },
      {
        id: `vueflow__edge-${pixelateNodeId}out-${removeBgNodeId}in`,
        type: "default",
        source: pixelateNodeId,
        target: removeBgNodeId,
        sourceHandle: "out",
        targetHandle: "in",
        data: {},
        label: "",
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createInitialWorkflows(): Workflow[] {
  return [
    createPixelateRemoveBgWorkflow(t("workflow.preset.pixelateRemoveBg")),
  ];
}

function hasPersistedWorkflows(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(WORKFLOW_PERSIST_KEY) !== null;
  } catch {
    return false;
  }
}

function stripImageData(workflows: Workflow[]): Workflow[] {
  return workflows.map((w) => ({
    ...w,
    nodes: w.nodes.map((n) => {
      if (!n.data?.files) return n;
      return { ...n, data: { ...n.data, files: [] } };
    }),
  }));
}

function nextWorkflowName(workflows: Workflow[]): string {
  const patterns = [
    /^Workflow\s*(\d+)$/i,
    /^工作流\s*(\d+)$/,
    /^ワークフロー\s*(\d+)$/,
  ];
  const nums = workflows
    .map((w) => {
      for (const pattern of patterns) {
        const m = w.name.match(pattern);
        if (m) return parseInt(m[1]!, 10);
      }
      return 0;
    })
    .filter((n) => n > 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return t("workflow.nameWithIndex", { index: max + 1 });
}

function serializeWorkflowState(state: StateTree): string {
  const workflowsValue = (state as Record<string, unknown>).workflows;
  const workflows = Array.isArray(workflowsValue)
    ? (workflowsValue as Workflow[])
    : [];
  return JSON.stringify({
    ...state,
    workflows: stripImageData(workflows),
  });
}

export const useWorkflowStore = defineStore(
  "workflowList",
  () => {
    const workflows = ref<Workflow[]>(
      hasPersistedWorkflows() ? [] : createInitialWorkflows(),
    );
    const activeId = ref<string>(workflows.value[0]?.id ?? "");

    const activeWorkflow = ref<Workflow | null>(null);
    watchEffect(() => {
      const currentWorkflows = workflows.value as unknown as Workflow[];
      let next: Workflow | null = null;
      for (const workflow of currentWorkflows) {
        if (workflow.id === activeId.value) {
          next = workflow;
          break;
        }
      }
      activeWorkflow.value = next;
    });

    function add() {
      const currentWorkflows = workflows.value as unknown as Workflow[];
      const w = createWorkflow(nextWorkflowName(currentWorkflows));
      workflows.value = [...currentWorkflows, w];
      activeId.value = w.id;
    }

    function remove(id: string) {
      const currentWorkflows = workflows.value as unknown as Workflow[];
      let idx = -1;
      for (let i = 0; i < currentWorkflows.length; i++) {
        if (currentWorkflows[i]?.id === id) {
          idx = i;
          break;
        }
      }
      if (idx === -1) return;
      const nextWorkflows = [...currentWorkflows];
      nextWorkflows.splice(idx, 1);
      workflows.value = nextWorkflows;
      if (activeId.value === id) {
        activeId.value = nextWorkflows[Math.max(0, idx - 1)]?.id ?? "";
      }
    }

    function rename(id: string, name: string) {
      const currentWorkflows = workflows.value as unknown as Workflow[];
      for (const w of currentWorkflows) {
        if (w.id !== id) continue;
        w.name = name;
        w.updatedAt = Date.now();
        break;
      }
    }

    function setElements(id: string, nodes: Node[], edges: Edge[]) {
      const currentWorkflows = workflows.value as unknown as Workflow[];
      for (const w of currentWorkflows) {
        if (w.id !== id) continue;
        if (w.nodes === nodes && w.edges === edges) return;
        w.nodes = nodes;
        w.edges = edges;
        w.updatedAt = Date.now();
        break;
      }
    }

    return {
      workflows,
      activeId,
      activeWorkflow,
      add,
      remove,
      rename,
      setElements,
    };
  },
  {
    persist: {
      key: WORKFLOW_PERSIST_KEY,
      serializer: {
        serialize: serializeWorkflowState,
        deserialize: JSON.parse,
      },
    },
  },
);
