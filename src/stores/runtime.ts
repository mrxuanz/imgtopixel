import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { NodeOutput } from '../types/port'

export const useRuntimeStore = defineStore('runtime', () => {
  const nodeOutputs = ref<Map<string, NodeOutput>>(new Map())
  const runningNodeId = ref<string | null>(null)
  const isWorkflowRunning = ref(false)
  const error = ref<string | null>(null)

  function setOutput(nodeId: string, output: NodeOutput) {
    nodeOutputs.value = new Map(nodeOutputs.value).set(nodeId, output)
  }

  function getOutput(nodeId: string): NodeOutput {
    return nodeOutputs.value.get(nodeId) ?? null
  }

  function clearOutputs() {
    nodeOutputs.value = new Map()
    error.value = null
    runningNodeId.value = null
    isWorkflowRunning.value = false
  }

  function setRunning(id: string | null) {
    runningNodeId.value = id
  }

  function setWorkflowRunning(v: boolean) {
    isWorkflowRunning.value = v
  }

  function setError(message: string | null) {
    error.value = message
  }

  return {
    nodeOutputs,
    runningNodeId,
    isWorkflowRunning,
    error,
    setOutput,
    getOutput,
    clearOutputs,
    setRunning,
    setWorkflowRunning,
    setError,
  }
})
