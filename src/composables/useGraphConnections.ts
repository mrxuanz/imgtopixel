import { useVueFlow } from "@vue-flow/core";
import type { Connection, Edge } from "@vue-flow/core";
import { isCanvasNodeType } from "../types/canvas";
import { isValidConnection } from "../utils/connectionValidator";

interface UseGraphConnectionsOptions {
  saveToStore: () => void;
}

export function useGraphConnections(options: UseGraphConnectionsOptions) {
  const { saveToStore } = options;
  const {
    getNodes,
    getEdges,
    onConnect,
    onEdgeUpdate,
    addEdges,
    removeEdges,
    updateEdge,
  } = useVueFlow();

  function isDirectionValid(conn: Connection): boolean {
    return conn.sourceHandle === "out" && conn.targetHandle === "in";
  }

  function hasExistingInput(targetId: string, excludeEdgeId?: string): boolean {
    return getEdges.value.some(
      (edge) => edge.target === targetId && edge.id !== excludeEdgeId,
    );
  }

  function getOutgoingEdge(sourceId: string): Edge | undefined {
    return getEdges.value.find((edge) => edge.source === sourceId);
  }

  function isConnectionAllowed(
    conn: Connection,
    excludeTargetInputFromEdgeId?: string,
  ): boolean {
    if (!isDirectionValid(conn)) return false;
    if (conn.source === conn.target) return false;
    if (hasExistingInput(conn.target, excludeTargetInputFromEdgeId)) return false;

    const sourceNode = getNodes.value.find((node) => node.id === conn.source);
    const targetNode = getNodes.value.find((node) => node.id === conn.target);
    if (!sourceNode || !targetNode) return false;
    if (!isCanvasNodeType(sourceNode.type) || !isCanvasNodeType(targetNode.type)) {
      return false;
    }
    return isValidConnection(sourceNode.type, targetNode.type);
  }

  onConnect((conn) => {
    if (!isConnectionAllowed(conn)) return;
    const existingOutgoing = getOutgoingEdge(conn.source);
    if (existingOutgoing) removeEdges([existingOutgoing]);
    addEdges([conn]);
    saveToStore();
  });

  onEdgeUpdate(({ edge, connection }) => {
    if (!isConnectionAllowed(connection, edge.id)) return;
    const otherOutgoing = getEdges.value.filter(
      (item) => item.source === connection.source && item.id !== edge.id,
    );
    if (otherOutgoing.length > 0) {
      removeEdges(otherOutgoing);
    }
    updateEdge(edge, connection);
    saveToStore();
  });

  function checkConnection(conn: Connection): boolean {
    return isConnectionAllowed(conn);
  }

  return {
    checkConnection,
    getOutgoingEdge,
  };
}
