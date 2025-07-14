import { create } from 'zustand';
import { graphService } from '../services/graphService';
import { GraphListResponse } from '../types/api';
import { Graph } from '../types/graph';

interface AppStore {
  // 认证状态
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // 图谱管理
  graphList: GraphListResponse | null;
  currentGraph: Graph | null;
  selectedGraphId: string | null;
  
  // UI状态
  loading: boolean;
  error: string | null;
  uploadModalVisible: boolean;
  graphListVisible: boolean;
  
  // 认证方法
  setAuth: (user: any, token: string) => void;
  logout: () => void;
  
  // 图谱管理方法
  fetchGraphList: () => Promise<void>;
  loadGraph: (graphId: string) => Promise<void>;
  uploadGraph: (file: File, title?: string) => Promise<void>;
  
  // UI状态方法
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUploadModalVisible: (visible: boolean) => void;
  setGraphListVisible: (visible: boolean) => void;
  setSelectedGraphId: (graphId: string | null) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // 初始状态
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  graphList: null,
  currentGraph: null,
  selectedGraphId: null,
  
  loading: false,
  error: null,
  uploadModalVisible: false,
  graphListVisible: false,
  
  // 认证方法
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  // 图谱管理方法
  fetchGraphList: async () => {
    try {
      set({ loading: true, error: null });
      const graphList = await graphService.getGraphs();
      set({ graphList, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  loadGraph: async (graphId: string) => {
    try {
      set({ loading: true, error: null });
      const graph = await graphService.getGraph(graphId);
      set({ 
        currentGraph: graph, 
        selectedGraphId: graphId, 
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  uploadGraph: async (file: File, title?: string) => {
    try {
      set({ loading: true, error: null });
      const graph = await graphService.importGraph(file);
      set({ 
        currentGraph: graph,
        selectedGraphId: graph.id,
        uploadModalVisible: false,
        loading: false 
      });
      // 重新获取图谱列表
      get().fetchGraphList();
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  // UI状态方法
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setUploadModalVisible: (visible) => set({ uploadModalVisible: visible }),
  setGraphListVisible: (visible) => set({ graphListVisible: visible }),
  setSelectedGraphId: (graphId) => set({ selectedGraphId: graphId }),
}));