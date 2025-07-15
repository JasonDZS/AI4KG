export interface User {
  id: string
  username: string
  email: string
  created_at?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    token: string
  }
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterCredentials {
  username: string
  email: string
  password: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface Graph {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
}

export interface GraphNode {
  id: string
  label: string
  type: string
  x: number
  y: number
  size: number
  color: string
  properties: Record<string, any>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  type: string
  properties: Record<string, any>
  weight?: number
  color?: string
}

export interface GraphData {
  id: string
  title: string
  description: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  metadata: {
    created_at: string
    updated_at: string
    node_count: number
    edge_count: number
  }
}

export interface CreateGraphRequest {
  title: string
  description: string
}

export interface UpdateGraphRequest {
  title?: string
  description?: string
}

export interface CreateNodeRequest {
  id?: string
  label: string
  type: string
  x: number
  y: number
  size?: number
  color?: string
  properties?: Record<string, any>
}

export interface CreateEdgeRequest {
  source: string
  target: string
  label?: string
  type: string
  properties?: Record<string, any>
  weight?: number
  color?: string
}

export interface GraphsListResponse {
  graphs: Graph[]
  total: number
}