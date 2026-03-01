import type { NodeType } from '../types/workflow'

const OUTPUT_TYPE: Record<NodeType, string> = {
  upload:     'image-array',
  removebg:   'image-array',
  airemovebg: 'image-array',
  pixelate:   'image-array',
  sprite:     'image-array',
}

const INPUT_ACCEPTS: Record<NodeType, string | null> = {
  upload:     null,
  removebg:   'image-any',
  airemovebg: 'image-any',
  pixelate:   'image-any',
  sprite:     'image-any',
}

export function isValidConnection(sourceType: NodeType, targetType: NodeType): boolean {
  const accepts = INPUT_ACCEPTS[targetType]
  if (accepts === null) return false
  const out = OUTPUT_TYPE[sourceType]
  if (!out) return false
  if (accepts === 'image-any') return true
  return out === accepts
}
