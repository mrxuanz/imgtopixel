export interface UploadNodeData {
  label: string;
  files: { name: string; dataURL: string }[];
}

export interface RemoveBgNodeData {
  label: string;
  tolerance: number;
}

export interface PixelateNodeData {
  label: string;
  mode: "auto" | "manual-size" | "manual-target";
  pixelSize: number;
  targetW: number;
  targetH: number;
  pixelMode: "detail" | "clean" | "center";
}

export interface AiRemoveBgNodeData {
  label: string;
}

export interface SpriteNodeData {
  label: string;
}
