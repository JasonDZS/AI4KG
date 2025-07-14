import { create } from 'zustand';
import { Graph, FilterConfig, Camera, LayoutConfig } from '../types/graph';

interface GraphStore {
  // 图数据
  graph: Graph | null;
  selectedNodes: string[];
  selectedEdges: string[];
  
  // 视图状态
  camera: Camera;
  layout: string;
  filters: FilterConfig;
  layoutConfig: LayoutConfig;
  
  // UI状态
  loading: boolean;
  error: string | null;
  
  // 操作方法
  setGraph: (graph: Graph | null) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedEdges: (edgeIds: string[]) => void;
  addSelectedNode: (nodeId: string) => void;
  removeSelectedNode: (nodeId: string) => void;
  clearSelection: () => void;
  
  setCamera: (camera: Camera) => void;
  setLayout: (layout: string) => void;
  setFilters: (filters: FilterConfig) => void;
  setLayoutConfig: (config: LayoutConfig) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  // 初始状态
  graph: null,
  selectedNodes: [],
  selectedEdges: [],
  
  camera: { x: 0, y: 0, ratio: 1 },
  layout: 'force',
  filters: {
    nodeTypes: [],
    edgeTypes: [],
    showLabels: true,
    minNodeSize: 1,
    maxNodeSize: 50,
  },
  layoutConfig: {
    type: 'force',
    iterations: 50,
    gravity: 1,
    repulsion: 1,
  },
  
  loading: false,
  error: null,
  
  // 操作方法
  setGraph: (graph) => set({ graph }),
  
  setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),
  setSelectedEdges: (edgeIds) => set({ selectedEdges: edgeIds }),
  
  addSelectedNode: (nodeId) => {
    const { selectedNodes } = get();
    if (!selectedNodes.includes(nodeId)) {
      set({ selectedNodes: [...selectedNodes, nodeId] });
    }
  },
  
  removeSelectedNode: (nodeId) => {
    const { selectedNodes } = get();
    set({ selectedNodes: selectedNodes.filter(id => id !== nodeId) });
  },
  
  clearSelection: () => set({ selectedNodes: [], selectedEdges: [] }),
  
  setCamera: (camera) => set({ camera }),
  setLayout: (layout) => set({ layout }),
  setFilters: (filters) => set({ filters }),
  setLayoutConfig: (layoutConfig) => set({ layoutConfig }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
