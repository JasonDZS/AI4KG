import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/api';

class ApiService {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, { params });
    
    // 调试图数据API响应
    if (url.includes('/graphs/') && !url.includes('/graphs?')) {
      console.log('=== API RESPONSE DEBUG ===');
      console.log('URL:', url);
      console.log('Full response:', response.data);
      console.log('Data structure:', JSON.stringify(response.data, null, 2));
      
      if (response.data.data) {
        const graphData = response.data.data as any;
        console.log('Graph data keys:', Object.keys(graphData));
        console.log('Nodes count:', graphData.nodes?.length || 0);
        console.log('Edges count:', graphData.edges?.length || 0);
        
        if (graphData.edges && graphData.edges.length > 0) {
          console.log('First edge:', graphData.edges[0]);
          console.log('Edge keys:', Object.keys(graphData.edges[0]));
        }
      }
    }
    
    return response.data.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url);
    return response.data.data;
  }
}

export const apiService = new ApiService();
