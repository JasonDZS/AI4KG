import axios from 'axios'
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
  GraphsListResponse,
  GraphData,
  CreateGraphRequest,
  UpdateGraphRequest,
  Graph,
  CreateNodeRequest,
  CreateEdgeRequest,
  GraphNode,
  GraphEdge,
  NodeDeleteImpact
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', credentials)
    return response.data
  },

  verify: async (): Promise<ApiResponse> => {
    const response = await api.get('/auth/verify')
    return response.data
  },
}

export const graphsApi = {
  getGraphs: async (params?: {
    page?: number
    size?: number
    search?: string
  }): Promise<ApiResponse<GraphsListResponse>> => {
    const response = await api.get('/graphs', { params })
    return response.data
  },

  getGraph: async (graphId: string): Promise<ApiResponse<GraphData>> => {
    const response = await api.get(`/graphs/${graphId}`)
    return response.data
  },

  createGraph: async (data: CreateGraphRequest): Promise<ApiResponse<Graph>> => {
    const response = await api.post('/graphs', data)
    return response.data
  },

  updateGraph: async (
    graphId: string,
    data: UpdateGraphRequest
  ): Promise<ApiResponse<Graph>> => {
    const response = await api.put(`/graphs/${graphId}`, data)
    return response.data
  },

  deleteGraph: async (graphId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/graphs/${graphId}`)
    return response.data
  },

  // Export graph data
  exportGraph: async (graphId: string, format: 'json' | 'gml' | 'graphml' | 'gexf' = 'json'): Promise<any> => {
    const response = await api.get(`/graphs/${graphId}/export`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },

  // Import graph data
  importGraph: async (data: any): Promise<ApiResponse<GraphData>> => {
    const response = await api.post('/graphs/import', data)
    return response.data
  },
}

export const nodesApi = {
  // Create node in graph
  createNode: async (graphId: string, data: CreateNodeRequest): Promise<ApiResponse<GraphNode>> => {
    const response = await api.post(`/graphs/${graphId}/nodes`, data)
    return response.data
  },

  // Update node
  updateNode: async (graphId: string, nodeId: string, data: Partial<CreateNodeRequest>): Promise<ApiResponse<GraphNode>> => {
    const response = await api.put(`/graphs/${graphId}/nodes/${nodeId}`, data)
    return response.data
  },

  // Get node delete impact analysis
  getDeleteImpact: async (graphId: string, nodeId: string): Promise<ApiResponse<NodeDeleteImpact>> => {
    const response = await api.get(`/graphs/${graphId}/nodes/${nodeId}/delete-impact`)
    return response.data
  },

  // Delete node
  deleteNode: async (graphId: string, nodeId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/graphs/${graphId}/nodes/${nodeId}`)
    return response.data
  },
}

export const edgesApi = {
  // Create edge in graph
  createEdge: async (graphId: string, data: CreateEdgeRequest): Promise<ApiResponse<GraphEdge>> => {
    const response = await api.post(`/graphs/${graphId}/edges`, data)
    return response.data
  },

  // Update edge
  updateEdge: async (graphId: string, edgeId: string, data: Partial<CreateEdgeRequest>): Promise<ApiResponse<GraphEdge>> => {
    const response = await api.put(`/graphs/${graphId}/edges/${edgeId}`, data)
    return response.data
  },

  // Delete edge
  deleteEdge: async (graphId: string, edgeId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/graphs/${graphId}/edges/${edgeId}`)
    return response.data
  },
}

export default api