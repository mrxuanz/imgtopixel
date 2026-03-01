import { computed } from "vue";
import { useVueFlow } from "@vue-flow/core";
import { runWorkflow } from "../executors/index";
import { useRuntimeStore } from "../stores/runtime";

interface UseWorkflowRunnerOptions {
  getWorkflow: () => unknown;
}

function hasWorkflow(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

export function useWorkflowRunner(options: UseWorkflowRunnerOptions) {
  const { getWorkflow } = options;
  const { getNodes, getEdges } = useVueFlow();
  const runtime = useRuntimeStore();
  const isRunning = computed(() => runtime.isWorkflowRunning);

  async function handleRun() {
    if (!hasWorkflow(getWorkflow()) || isRunning.value) return;
    runtime.clearOutputs();
    runtime.setWorkflowRunning(true);

    try {
      await runWorkflow(
        getNodes.value,
        getEdges.value,
        (id) => runtime.setRunning(id),
        (id, output) => runtime.setOutput(id, output),
      );
    } catch (error) {
      console.error("Workflow execution failed:", error);
      runtime.setError(error instanceof Error ? error.message : String(error));
    } finally {
      runtime.setRunning(null);
      runtime.setWorkflowRunning(false);
    }
  }

  return {
    isRunning,
    handleRun,
  };
}
