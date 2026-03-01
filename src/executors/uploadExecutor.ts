import type { NodeOutput } from '../types/port'
import type { UploadNodeData } from '../types/nodes'
import { loadImageFromDataURL } from '../utils/processPixel'

export async function uploadExecutor(data: UploadNodeData): Promise<NodeOutput> {
  if (!data.files || data.files.length === 0) return null
  const results: ImageData[] = []
  for (const file of data.files) {
    const img = await loadImageFromDataURL(file.dataURL)
    results.push(img)
  }
  return { type: 'image-array', data: results }
}
