// Heuristic foreground threshold when estimating a mask from corner color.
// Values <= 15 are treated as background-like; larger deltas are foreground.
const FOREGROUND_COLOR_DIFF_THRESHOLD = 15;

export function makeForegroundMask(data: ImageData): {
  rgb: ImageData;
  mask: Uint8Array;
} {
  const { width: w, height: h } = data;
  const rgb = new ImageData(w, h);
  const mask = new Uint8Array(w * h);

  for (let i = 0; i < w * h; i++) {
    rgb.data[i * 4] = data.data[i * 4]!;
    rgb.data[i * 4 + 1] = data.data[i * 4 + 1]!;
    rgb.data[i * 4 + 2] = data.data[i * 4 + 2]!;
    rgb.data[i * 4 + 3] = 255;
  }

  if (hasAlpha(data)) {
    for (let i = 0; i < w * h; i++)
      mask[i] = data.data[i * 4 + 3]! > 10 ? 255 : 0;
    return { rgb, mask };
  }

  const corners = [
    getPixelRGB(data, 0, 0),
    getPixelRGB(data, w - 1, 0),
    getPixelRGB(data, 0, h - 1),
    getPixelRGB(data, w - 1, h - 1),
  ];
  const bg = [
    corners.reduce((s, c) => s + c[0], 0) / 4,
    corners.reduce((s, c) => s + c[1], 0) / 4,
    corners.reduce((s, c) => s + c[2], 0) / 4,
  ];

  for (let i = 0; i < w * h; i++) {
    const r = data.data[i * 4]!,
      g = data.data[i * 4 + 1]!,
      b = data.data[i * 4 + 2]!;
    const diff = Math.max(
      Math.abs(r - bg[0]!),
      Math.abs(g - bg[1]!),
      Math.abs(b - bg[2]!),
    );
    mask[i] = diff > FOREGROUND_COLOR_DIFF_THRESHOLD ? 255 : 0;
  }
  return { rgb, mask };
}

export function removeBackground(data: ImageData, tolerance = 30): ImageData {
  const { width: w, height: h } = data;
  const result = new ImageData(w, h);

  for (let i = 0; i < data.data.length; i++) result.data[i] = data.data[i]!;
  if (!hasAlpha(data))
    for (let i = 0; i < w * h; i++) result.data[i * 4 + 3] = 255;

  const edgePixels: number[][] = [];
  for (let x = 0; x < w; x++) {
    if (data.data[(0 * w + x) * 4 + 3]! > 0)
      edgePixels.push(getPixelRGB(data, x, 0));
    if (data.data[((h - 1) * w + x) * 4 + 3]! > 0)
      edgePixels.push(getPixelRGB(data, x, h - 1));
  }
  for (let y = 1; y < h - 1; y++) {
    if (data.data[(y * w + 0) * 4 + 3]! > 0)
      edgePixels.push(getPixelRGB(data, 0, y));
    if (data.data[(y * w + w - 1) * 4 + 3]! > 0)
      edgePixels.push(getPixelRGB(data, w - 1, y));
  }

  if (edgePixels.length === 0) return result;

  const bg = [
    median(edgePixels.map((p) => p[0]!)),
    median(edgePixels.map((p) => p[1]!)),
    median(edgePixels.map((p) => p[2]!)),
  ];

  const isBg = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    if (data.data[i + 3]! === 0) return true;
    const d =
      Math.abs(data.data[i]! - bg[0]!) +
      Math.abs(data.data[i + 1]! - bg[1]!) +
      Math.abs(data.data[i + 2]! - bg[2]!);
    return d <= tolerance * 3;
  };

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h * 2);
  let queueHead = 0;
  let queueTail = 0;

  const tryEnqueue = (x: number, y: number) => {
    const idx = y * w + x;
    if (!visited[idx] && isBg(x, y)) {
      visited[idx] = 1;
      queue[queueTail++] = x;
      queue[queueTail++] = y;
    }
  };

  for (let x = 0; x < w; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    tryEnqueue(0, y);
    tryEnqueue(w - 1, y);
  }

  while (queueHead < queueTail) {
    const px = queue[queueHead++]!;
    const py = queue[queueHead++]!;
    result.data[(py * w + px) * 4 + 3] = 0;
    if (px > 0) tryEnqueue(px - 1, py);
    if (px < w - 1) tryEnqueue(px + 1, py);
    if (py > 0) tryEnqueue(px, py - 1);
    if (py < h - 1) tryEnqueue(px, py + 1);
  }

  return result;
}

function hasAlpha(data: ImageData): boolean {
  for (let i = 3; i < data.data.length; i += 4)
    if (data.data[i]! < 255) return true;
  return false;
}

function getPixelRGB(
  data: ImageData,
  x: number,
  y: number,
): [number, number, number] {
  const i = (y * data.width + x) * 4;
  return [data.data[i]!, data.data[i + 1]!, data.data[i + 2]!];
}

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}
