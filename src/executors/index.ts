import type { Node, Edge } from "@vue-flow/core";
import type { NodeOutput } from "../types/port";
import type { NodeType } from "../types/workflow";
import type {
  UploadNodeData,
  RemoveBgNodeData,
  AiRemoveBgNodeData,
  PixelateNodeData,
  SpriteNodeData,
} from "../types/nodes";
import { uploadExecutor } from "./uploadExecutor";
import { removeBgExecutor } from "./removeBgExecutor";
import { aiRemoveBgExecutor } from "./aiRemoveBgExecutor";
import { pixelateExecutor } from "./pixelateExecutor";
import { spriteExecutor } from "./spriteExecutor";

type NodeExecutor = (data: unknown, input: NodeOutput) => Promise<NodeOutput>;

const executors: Partial<Record<NodeType, NodeExecutor>> = {
  upload: async (data) => uploadExecutor(data as UploadNodeData),
  removebg: (data, input) => removeBgExecutor(data as RemoveBgNodeData, input),
  airemovebg: (data, input) =>
    aiRemoveBgExecutor(data as AiRemoveBgNodeData, input),
  pixelate: (data, input) => pixelateExecutor(data as PixelateNodeData, input),
  sprite: (data, input) => spriteExecutor(data as SpriteNodeData, input),
};

function topoSort(nodes: Node[], edges: Edge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    adj.get(e.source)!.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }
  const queue = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);
  const result: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    result.push(id);
    for (const next of adj.get(id) ?? []) {
      const deg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, deg);
      if (deg === 0) queue.push(next);
    }
  }
  return result;
}

export async function runWorkflow(
  nodes: Node[],
  edges: Edge[],
  onNodeStart: (id: string) => void,
  onNodeDone: (id: string, output: NodeOutput) => void,
): Promise<void> {
  const ordered = topoSort(nodes, edges);
  const outputs = new Map<string, NodeOutput>();
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  for (const nodeId of ordered) {
    onNodeStart(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const inEdge = edges.find((e) => e.target === nodeId);
    const inputData = inEdge ? (outputs.get(inEdge.source) ?? null) : null;

    const executor = executors[node.type as NodeType];
    if (!executor) {
      throw new Error(`Node ${nodeId} has unsupported type: ${String(node.type)}`);
    }

    let output: NodeOutput;
    try {
      output = await executor(node.data, inputData);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Node ${nodeId} failed: ${reason}`);
    }

    outputs.set(nodeId, output);
    onNodeDone(nodeId, output);
  }
}
