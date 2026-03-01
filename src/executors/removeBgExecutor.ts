import type { NodeOutput } from '../types/port'
import type { RemoveBgNodeData } from '../types/nodes'
import { removeBackground } from '../utils/background'
import { normalizeToArray } from '../utils/processPixel'

export async function removeBgExecutor(data: RemoveBgNodeData, input: NodeOutput): Promise<NodeOutput> {
  const images = normalizeToArray(input)
  if (images.length === 0) return null
  const results = images.map(img => removeBackground(img, data.tolerance))
  return { type: 'image-array', data: results }
}
