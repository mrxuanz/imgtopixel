import { makeForegroundMask } from "./background";
import { cloneImageData } from "./imageData";

interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ExtractedSprite {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  image: ImageData;
}

export interface ExtractSpritesResult {
  sprites: ExtractedSprite[];
  preview: ImageData;
}

export function mergeRects(rects: Rect[]): Rect[] {
  let current = rects.slice();
  let merged = true;

  while (merged) {
    merged = false;
    const result: Rect[] = [];

    for (const rect of current) {
      const { x1, y1, x2, y2 } = rect;
      let didMerge = false;

      for (let i = 0; i < result.length; i++) {
        const source = result[i]!;
        if (
          x1 <= source.x2 &&
          x2 >= source.x1 &&
          y1 <= source.y2 &&
          y2 >= source.y1
        ) {
          result[i] = {
            x1: Math.min(x1, source.x1),
            y1: Math.min(y1, source.y1),
            x2: Math.max(x2, source.x2),
            y2: Math.max(y2, source.y2),
          };
          didMerge = true;
          merged = true;
          break;
        }
      }

      if (!didMerge) {
        result.push(rect);
      }
    }

    current = result;
  }

  return current;
}

export function extractSprites(image: ImageData): ExtractSpritesResult {
  const { mask } = makeForegroundMask(image);
  const { width, height } = image;
  const preview = cloneImageData(image);
  const rects = findConnectedComponentRects(mask, width, height);

  if (rects.length === 0) {
    return { sprites: [], preview };
  }

  const mergedRects = rects;
  const minArea = Math.max(width * height * 0.0005, 16);
  const sprites: ExtractedSprite[] = [];

  for (const rect of mergedRects) {
    const spriteW = rect.x2 - rect.x1;
    const spriteH = rect.y2 - rect.y1;
    if (spriteW * spriteH < minArea) continue;

    drawRect(preview, rect, [0, 200, 255, 255]);
    sprites.push({
      id: 0,
      x: rect.x1,
      y: rect.y1,
      w: spriteW,
      h: spriteH,
      image: cropImageData(image, rect),
    });
  }

  sortSpritesByRows(sprites);
  for (let i = 0; i < sprites.length; i++) {
    sprites[i]!.id = i;
  }

  return { sprites, preview };
}

function findConnectedComponentRects(
  mask: Uint8Array,
  width: number,
  height: number,
): Rect[] {
  const visited = new Uint8Array(mask.length);
  const rects: Rect[] = [];
  const neighbors: Array<readonly [number, number]> = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = y * width + x;
      if (visited[start] || mask[start] === 0) continue;

      visited[start] = 1;
      const queueX: number[] = [x];
      const queueY: number[] = [y];
      let head = 0;

      let x1 = x;
      let y1 = y;
      let x2 = x + 1;
      let y2 = y + 1;

      while (head < queueX.length) {
        const px = queueX[head]!;
        const py = queueY[head]!;
        head++;

        if (px < x1) x1 = px;
        if (py < y1) y1 = py;
        if (px + 1 > x2) x2 = px + 1;
        if (py + 1 > y2) y2 = py + 1;

        for (const [dx, dy] of neighbors) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (visited[ni] || mask[ni] === 0) continue;
          visited[ni] = 1;
          queueX.push(nx);
          queueY.push(ny);
        }
      }

      rects.push({ x1, y1, x2, y2 });
    }
  }

  return rects;
}

function cropImageData(src: ImageData, rect: Rect): ImageData {
  const w = rect.x2 - rect.x1;
  const h = rect.y2 - rect.y1;
  const out = new ImageData(w, h);

  for (let y = 0; y < h; y++) {
    const sy = rect.y1 + y;
    for (let x = 0; x < w; x++) {
      const sx = rect.x1 + x;
      const si = (sy * src.width + sx) * 4;
      const di = (y * w + x) * 4;
      out.data[di] = src.data[si]!;
      out.data[di + 1] = src.data[si + 1]!;
      out.data[di + 2] = src.data[si + 2]!;
      out.data[di + 3] = src.data[si + 3]!;
    }
  }

  return out;
}

function drawRect(
  image: ImageData,
  rect: Rect,
  color: [number, number, number, number],
) {
  const { width, height } = image;
  const x1 = Math.max(0, Math.min(width - 1, rect.x1));
  const y1 = Math.max(0, Math.min(height - 1, rect.y1));
  const x2 = Math.max(0, Math.min(width - 1, rect.x2 - 1));
  const y2 = Math.max(0, Math.min(height - 1, rect.y2 - 1));

  for (let x = x1; x <= x2; x++) {
    setPixel(image, x, y1, color);
    setPixel(image, x, y2, color);
  }
  for (let y = y1; y <= y2; y++) {
    setPixel(image, x1, y, color);
    setPixel(image, x2, y, color);
  }
}

function setPixel(
  image: ImageData,
  x: number,
  y: number,
  [r, g, b, a]: [number, number, number, number],
) {
  const i = (y * image.width + x) * 4;
  image.data[i] = r;
  image.data[i + 1] = g;
  image.data[i + 2] = b;
  image.data[i + 3] = a;
}

function sortSpritesByRows(sprites: ExtractedSprite[]) {
  sprites.sort((a, b) => a.y - b.y || a.x - b.x);
  if (sprites.length === 0) return;

  const avgH = sprites.reduce((sum, item) => sum + item.h, 0) / sprites.length;
  const rowTolerance = Math.max(4, Math.floor(avgH * 0.5));
  const rowAnchors: number[] = [];

  let rowY = sprites[0]!.y;
  for (const item of sprites) {
    if (item.y - rowY > rowTolerance) {
      rowY = item.y;
    }
    rowAnchors.push(rowY);
  }

  const indexed = sprites.map((item, index) => ({
    item,
    rowY: rowAnchors[index]!,
  }));
  indexed.sort((a, b) => a.rowY - b.rowY || a.item.x - b.item.x);

  for (let i = 0; i < indexed.length; i++) {
    sprites[i] = indexed[i]!.item;
  }
}
