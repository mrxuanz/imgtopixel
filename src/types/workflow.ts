import type { Node, Edge } from '@vue-flow/core'

export type NodeType = 'upload' | 'removebg' | 'airemovebg' | 'pixelate' | 'sprite'

export interface Workflow {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  createdAt: number
  updatedAt: number
}
