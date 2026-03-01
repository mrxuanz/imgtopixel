import { imageToImageData } from "./imageData";

export function nearestNeighborScale(
  src: ImageData,
  maxSize: number,
): ImageData {
  const { width: sw, height: sh } = src;
  if (sw <= maxSize && sh <= maxSize) return src;

  const scale = Math.min(maxSize / sw, maxSize / sh);
  const dw = Math.max(1, Math.floor(sw * scale));
  const dh = Math.max(1, Math.floor(sh * scale));
  const dst = new ImageData(dw, dh);

  for (let dy = 0; dy < dh; dy++) {
    for (let dx = 0; dx < dw; dx++) {
      const sx = Math.floor(dx / scale);
      const sy = Math.floor(dy / scale);
      const si = (sy * sw + sx) * 4;
      const di = (dy * dw + dx) * 4;
      dst.data[di] = src.data[si]!;
      dst.data[di + 1] = src.data[si + 1]!;
      dst.data[di + 2] = src.data[si + 2]!;
      dst.data[di + 3] = src.data[si + 3]!;
    }
  }
  return dst;
}

export function loadImageFromDataURL(dataURL: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(imageToImageData(img));
    img.onerror = reject;
    img.src = dataURL;
  });
}

export function pixelateBySize(
  src: ImageData,
  pixelSize: number,
  offsetX = 0,
  offsetY = 0,
): ImageData {
  const { width: w, height: h } = src;
  const cxList = buildCenters(w, pixelSize, offsetX);
  const cyList = buildCenters(h, pixelSize, offsetY);
  if (cxList.length === 0 || cyList.length === 0) {
    return new ImageData(
      new Uint8ClampedArray(src.data),
      src.width,
      src.height,
    );
  }

  const newH = cyList.length;
  const newW = cxList.length;
  const result = new ImageData(newW, newH);

  for (let y = 0; y < newH; y++) {
    const sy = cyList[y]!;
    for (let x = 0; x < newW; x++) {
      const sx = cxList[x]!;
      const si = (sy * w + sx) * 4;
      const di = (y * newW + x) * 4;
      result.data[di] = src.data[si]!;
      result.data[di + 1] = src.data[si + 1]!;
      result.data[di + 2] = src.data[si + 2]!;
      result.data[di + 3] = src.data[si + 3]!;
    }
  }
  return result;
}

export function pixelateToTarget(
  src: ImageData,
  targetW: number,
  targetH: number,
): ImageData {
  const { width: w, height: h } = src;
  targetW = toPositiveInt(targetW);
  targetH = toPositiveInt(targetH);
  if (w <= 0 || h <= 0) return new ImageData(targetW, targetH);
  const result = new ImageData(targetW, targetH);

  const xEdges = linspace(0, w, targetW + 1);
  const yEdges = linspace(0, h, targetH + 1);

  for (let ty = 0; ty < targetH; ty++) {
    const y0 = yEdges[ty]!;
    let y1 = yEdges[ty + 1]!;
    if (y1 <= y0) y1 = Math.min(h, y0 + 1);

    for (let tx = 0; tx < targetW; tx++) {
      const x0 = xEdges[tx]!;
      let x1 = xEdges[tx + 1]!;
      if (x1 <= x0) x1 = Math.min(w, x0 + 1);

      const di = (ty * targetW + tx) * 4;

      const cy = Math.min(h - 1, Math.floor((y0 + y1 - 1) / 2));
      const cx = Math.min(w - 1, Math.floor((x0 + x1 - 1) / 2));
      const ci = (cy * w + cx) * 4;

      result.data[di] = src.data[ci]!;
      result.data[di + 1] = src.data[ci + 1]!;
      result.data[di + 2] = src.data[ci + 2]!;
      result.data[di + 3] = src.data[ci + 3]!;
    }
  }
  return result;
}

function buildCenters(
  length: number,
  pixelSize: number,
  offset: number,
): number[] {
  if (pixelSize <= 0) return [];
  const centers: number[] = [];
  let k = -Math.floor(offset / pixelSize) - 1;
  while (true) {
    const c = offset + k * pixelSize + Math.floor(pixelSize / 2);
    if (c >= length) break;
    if (c >= 0) centers.push(c);
    k += 1;
  }
  return centers;
}

function linspace(start: number, end: number, num: number): number[] {
  if (num <= 1) return [Math.round(start)];
  const arr: number[] = [];
  for (let i = 0; i < num; i++) {
    arr.push(Math.round(start + ((end - start) * i) / (num - 1)));
  }
  return arr;
}

function toPositiveInt(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : 1;
}

export function normalizeToArray(
  input: { type: string; data: ImageData | ImageData[] } | null,
): ImageData[] {
  if (!input) return [];
  if (input.type === "image-single") return [input.data as ImageData];
  return input.data as ImageData[];
}
