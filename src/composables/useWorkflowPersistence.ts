import { nextTick, onBeforeUnmount, watch } from "vue";
import { useVueFlow } from "@vue-flow/core";
import type { Edge, Node, NodeChange } from "@vue-flow/core";
import { useWorkflowStore } from "../stores/workflowList";

const SAVE_THROTTLE_MS = 200;

interface PersistableWorkflow {
  id: string;
  nodes: Node[];
  edges: Edge[];
}

interface UseWorkflowPersistenceOptions {
  getWorkflow: () => unknown;
  dragHandleSelector: string;
}

function withDefaultDragHandle(node: Node, dragHandleSelector: string): Node {
  if (node.dragHandle) return node;
  return { ...node, dragHandle: dragHandleSelector };
}

function isDraggingPositionChange(change: NodeChange): boolean {
  return change.type === "position" && change.dragging === true;
}

function isDragEndPositionChange(change: NodeChange): boolean {
  return change.type === "position" && change.dragging === false;
}

function toPersistableWorkflow(value: unknown): PersistableWorkflow | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Partial<PersistableWorkflow>;
  if (typeof candidate.id !== "string") return null;
  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) return null;
  return {
    id: candidate.id,
    nodes: candidate.nodes,
    edges: candidate.edges,
  };
}

export function useWorkflowPersistence(options: UseWorkflowPersistenceOptions) {
  const { getWorkflow, dragHandleSelector } = options;
  const workflowStore = useWorkflowStore();
  const {
    setNodes,
    setEdges,
    getNodes,
    getEdges,
    onNodesChange,
    onEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
  } = useVueFlow();
  let pendingSaveTimer: number | null = null;

  function saveToStore() {
    const currentWorkflow = toPersistableWorkflow(getWorkflow());
    if (!currentWorkflow) return;
    workflowStore.setElements(currentWorkflow.id, getNodes.value, getEdges.value);
  }

  function clearPendingSaveTimer() {
    if (pendingSaveTimer === null) return;
    window.clearTimeout(pendingSaveTimer);
    pendingSaveTimer = null;
  }

  function scheduleSaveToStore() {
    if (pendingSaveTimer !== null) return;
    pendingSaveTimer = window.setTimeout(() => {
      pendingSaveTimer = null;
      saveToStore();
    }, SAVE_THROTTLE_MS);
  }

  function flushSaveToStore() {
    clearPendingSaveTimer();
    saveToStore();
  }

  watch(
    () => toPersistableWorkflow(getWorkflow())?.id,
    async () => {
      await nextTick();
      const currentWorkflow = toPersistableWorkflow(getWorkflow());
      const nodes = (currentWorkflow?.nodes ?? []).map((node) =>
        withDefaultDragHandle(node, dragHandleSelector),
      );
      setNodes(nodes);
      setEdges(currentWorkflow?.edges ?? []);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (pendingSaveTimer !== null) flushSaveToStore();
  });

  onNodesChange((changes) => {
    applyNodeChanges(changes);
    if (changes.some(isDraggingPositionChange)) {
      scheduleSaveToStore();
      return;
    }
    if (changes.some(isDragEndPositionChange)) {
      flushSaveToStore();
      return;
    }
    saveToStore();
  });

  onEdgesChange((changes) => {
    applyEdgeChanges(changes);
    saveToStore();
  });

  return {
    saveToStore,
  };
}
