import type {
  AiRemoveBgNodeData,
  PixelateNodeData,
  RemoveBgNodeData,
  SpriteNodeData,
  UploadNodeData,
} from "./nodes";
import type { NodeType } from "./workflow";

export type CanvasNodeType = NodeType;

export interface CanvasNodeDataMap {
  upload: UploadNodeData;
  removebg: RemoveBgNodeData;
  airemovebg: AiRemoveBgNodeData;
  pixelate: PixelateNodeData;
  sprite: SpriteNodeData;
}

export function isCanvasNodeType(type: unknown): type is CanvasNodeType {
  return (
    type === "upload" ||
    type === "removebg" ||
    type === "airemovebg" ||
    type === "pixelate" ||
    type === "sprite"
  );
}
