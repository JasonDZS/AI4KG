export interface Node {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: string;
  properties: Record<string, any>;
  weight?: number;
  color?: string;
}

export interface GraphMetadata {
  created_at: string;
  updated_at: string;
  node_count: number;
  edge_count: number;
}

export interface Graph {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  nodes: Node[];
  edges: Edge[];
  metadata: GraphMetadata;
}

export interface FilterConfig {
  nodeTypes: string[];
  edgeTypes: string[];
  showLabels: boolean;
  minNodeSize: number;
  maxNodeSize: number;
}

export interface Camera {
  x: number;
  y: number;
  ratio: number;
}

export interface LayoutConfig {
  type: 'force' | 'circular' | 'random' | 'hierarchical';
  iterations?: number;
  gravity?: number;
  repulsion?: number;
}
