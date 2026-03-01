export type NodeOutput =
  | { type: "image-single"; data: ImageData }
  | { type: "image-array"; data: ImageData[] }
  | null;
