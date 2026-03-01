function getCanvas2DContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available");
  return ctx;
}

export function imageDataToBlob(
  data: ImageData,
  type = "image/png",
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = getCanvas2DContext(canvas);
  ctx.putImageData(data, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("toBlob failed"));
        return;
      }
      resolve(blob);
    }, type);
  });
}

export async function blobToImageData(blob: Blob): Promise<ImageData> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    return imageToImageData(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function imageToImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = getCanvas2DContext(canvas);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function imageDataToBase64(data: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = getCanvas2DContext(canvas);
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png").split(",")[1]!;
}

export function imageDataToDataURL(data: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = getCanvas2DContext(canvas);
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}

export function cloneImageData(data: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(data.data),
    data.width,
    data.height,
  );
}
