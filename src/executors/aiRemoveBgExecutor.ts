import type { NodeOutput } from '../types/port'
import type { AiRemoveBgNodeData } from '../types/nodes'
import { blobToImageData, imageDataToBlob } from '../utils/imageData'
import { normalizeToArray } from '../utils/processPixel'

type RemoveBackgroundFn = (
  input: Blob | ImageData | HTMLImageElement | string,
  config?: Record<string, unknown>,
) => Promise<Blob>

let removeBackgroundFn: RemoveBackgroundFn | null = null

async function getRemoveBackgroundFn(): Promise<RemoveBackgroundFn> {
  if (removeBackgroundFn) return removeBackgroundFn
  const mod = await import('@imgly/background-removal')
  removeBackgroundFn = mod.removeBackground
  return removeBackgroundFn
}

export async function aiRemoveBgExecutor(
  _data: AiRemoveBgNodeData,
  input: NodeOutput,
): Promise<NodeOutput> {
  const images = normalizeToArray(input)
  if (images.length === 0) return null

  const removeBackground = await getRemoveBackgroundFn()
  const results: ImageData[] = []
  for (const img of images) {
    const blob = await imageDataToBlob(img)
    const resultBlob = await removeBackground(blob)
    results.push(await blobToImageData(resultBlob))
  }
  return { type: 'image-array', data: results }
}
