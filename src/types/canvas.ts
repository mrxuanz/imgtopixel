import type {
  AiRemoveBgNodeData,
  PixelateNodeData,
  RemoveBgNodeData,
  UploadNodeData,
} from "./nodes";
import type { NodeType } from "./workflow";

export type CanvasNodeType = Exclude<NodeType, "sprite">;

export interface CanvasNodeDataMap {
  upload: UploadNodeData;
  removebg: RemoveBgNodeData;
  airemovebg: AiRemoveBgNodeData;
  pixelate: PixelateNodeData;
}

export function isCanvasNodeType(type: unknown): type is CanvasNodeType {
  return (
    type === "upload" ||
    type === "removebg" ||
    type === "airemovebg" ||
    type === "pixelate"
  );
}
