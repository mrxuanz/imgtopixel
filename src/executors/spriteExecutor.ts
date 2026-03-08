import type { NodeOutput } from "../types/port";
import type { SpriteNodeData } from "../types/nodes";
import { normalizeToArray } from "../utils/processPixel";
import { extractSprites } from "../utils/spriteExtractor";

export async function spriteExecutor(
  _data: SpriteNodeData,
  input: NodeOutput,
): Promise<NodeOutput> {
  const images = normalizeToArray(input);
  if (images.length === 0) return null;

  const outputSprites: ImageData[] = [];
  for (const image of images) {
    const { sprites } = extractSprites(image);
    for (const sprite of sprites) {
      outputSprites.push(sprite.image);
    }
  }

  if (outputSprites.length === 0) return null;
  return { type: "image-array", data: outputSprites };
}
