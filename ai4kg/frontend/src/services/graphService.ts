import { apiService } from './apiService';
import { Graph } from '../types/graph';
import { GraphListResponse, CreateGraphRequest, UpdateGraphRequest } from '../types/api';

class GraphService {
  async getGraphs(): Promise<GraphListResponse> {
    return apiService.get<GraphListResponse>('/graphs');
  }

  async getGraph(id: string): Promise<Graph> {
    return apiService.get<Graph>(`/graphs/${id}`);
  }

  async createGraph(data: CreateGraphRequest): Promise<Graph> {
    return apiService.post<Graph>('/graphs', data);
  }

  async updateGraph(id: string, data: UpdateGraphRequest): Promise<Graph> {
    return apiService.put<Graph>(`/graphs/${id}`, data);
  }

  async deleteGraph(id: string): Promise<void> {
    return apiService.delete<void>(`/graphs/${id}`);
  }

  // 导入图数据
  async importGraph(file: File): Promise<Graph> {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post<Graph>('/graphs/import', formData);
  }

  // 导出图数据
  async exportGraph(id: string, format: 'json' | 'csv' | 'gexf' = 'json'): Promise<Blob> {
    const response = await fetch(`/api/graphs/${id}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.blob();
  }
}

export const graphService = new GraphService();
