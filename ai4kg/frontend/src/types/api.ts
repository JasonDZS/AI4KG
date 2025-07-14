export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface GraphListResponse {
  graphs: {
    id: string;
    title: string;
    description?: string;
    user_id: string;
    metadata: {
      created_at: string;
      updated_at: string;
      node_count: number;
      edge_count: number;
    };
  }[];
  total: number;
}

export interface CreateGraphRequest {
  title: string;
  description?: string;
  nodes: any[];
  edges: any[];
}

export interface UpdateGraphRequest {
  title?: string;
  description?: string;
  nodes?: any[];
  edges?: any[];
}
