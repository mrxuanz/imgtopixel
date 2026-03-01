import type { NodeOutput } from '../types/port'
import type { PixelateNodeData } from '../types/nodes'
import { detectPixelSize } from '../utils/detectPixel'
import { pixelateBySize, pixelateToTarget, normalizeToArray } from '../utils/processPixel'

export async function pixelateExecutor(data: PixelateNodeData, input: NodeOutput): Promise<NodeOutput> {
  const images = normalizeToArray(input)
  if (images.length === 0) return null

  const results = images.map(img => {
    let size = data.pixelSize
    let offsetX = 0
    let offsetY = 0
    if (data.mode === 'auto') {
      const detected = detectPixelSize(img)
      size = detected.size
      offsetX = detected.offsetX
      offsetY = detected.offsetY
    }
    if (data.mode === 'manual-target') {
      return pixelateToTarget(img, data.targetW, data.targetH)
    }
    return pixelateBySize(img, Math.max(1, size), offsetX, offsetY)
  })

  return { type: 'image-array', data: results }
}
