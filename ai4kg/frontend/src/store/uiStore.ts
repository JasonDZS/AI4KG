import { create } from 'zustand';
import { UIState, PanelState, Theme } from '../types/ui';

interface UIStore extends UIState {
  panels: PanelState;
  theme: Theme;
  
  // 操作方法
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedTool: (tool: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  togglePanel: (panel: keyof PanelState) => void;
  setTheme: (theme: Theme) => void;
}

const defaultTheme: Theme = {
  primary: '#1890ff',
  secondary: '#52c41a',
  background: '#f0f2f5',
  surface: '#ffffff',
  text: '#000000',
  border: '#d9d9d9',
};

export const useUIStore = create<UIStore>((set, get) => ({
  // 初始状态
  sidebarCollapsed: false,
  selectedTool: null,
  loading: false,
  error: null,
  
  panels: {
    nodePanel: false,
    edgePanel: false,
    propertyPanel: true,
  },
  
  theme: defaultTheme,
  
  // 操作方法
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
  setSelectedTool: (tool: string | null) => set({ selectedTool: tool }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  
  togglePanel: (panel: keyof PanelState) => {
    const { panels } = get();
    set({
      panels: {
        ...panels,
        [panel]: !panels[panel],
      },
    });
  },
  
  setTheme: (theme: Theme) => set({ theme }),
}));
